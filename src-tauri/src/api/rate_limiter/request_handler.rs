use super::fingerprint::{BrowserProfile, FingerprintManager};
use super::rate_limit_handler::handle_rate_limits;
use super::types::{ApiRequest, ApiResponseContent, BucketInfo, StandardRequest};
use crate::core::error::AppError;
use crate::core::logger::Logger;
use crate::core::op_manager::OperationManager;
use rand::Rng;
use reqwest::Client;
use std::collections::HashMap;
use std::sync::{Arc, atomic::Ordering};
use std::time::{Duration, Instant};
use tauri::Manager;
use tokio::sync::Mutex;

pub async fn handle_request(
    req: StandardRequest,
    client: Client,
    buckets: Arc<Mutex<HashMap<String, Arc<Mutex<BucketInfo>>>>>,
    global_reset_at: Arc<Mutex<Instant>>,
    app_handle: tauri::AppHandle,
    route: String,
    global_429_count: Arc<std::sync::atomic::AtomicU32>,
    actor_profile: BrowserProfile,
) {
    let bucket_arc = {
        let mut map = buckets.lock().await;
        map.entry(route.clone())
            .or_insert_with(|| Arc::new(Mutex::new(BucketInfo::default())))
            .clone()
    };

    loop {
        let jitter = rand::thread_rng().gen_range(50..250);
        tokio::time::sleep(Duration::from_millis(jitter)).await;

        let now = Instant::now();
        {
            let g = global_reset_at.lock().await;
            if now < *g {
                tokio::time::sleep(*g - now).await;
                continue;
            }
        }

        {
            let mut b = bucket_arc.lock().await;
            if now >= b.reset_at {
                b.remaining = b.limit;
            }
            if b.remaining == 0 {
                let wait = b.reset_at.saturating_duration_since(now) + Duration::from_millis(100);
                drop(b);
                tokio::time::sleep(wait).await;
                continue;
            }
            b.remaining -= 1;
        }

        let active_profile = req.profile.clone().unwrap_or_else(|| actor_profile.clone());
        let active_locale = req
            .locale
            .clone()
            .unwrap_or_else(FingerprintManager::get_system_locale);

        let mut rb = client.request(req.method.clone(), &req.url);
        rb = rb.header("user-agent", &active_profile.user_agent);
        rb = rb.header(
            "x-super-properties",
            FingerprintManager::generate_super_properties(&active_profile, &active_locale),
        );
        // ... more headers ...

        if let Some(r) = req.referer.clone() {
            rb = rb.header("referer", r);
        }

        if req.is_bearer {
            rb = rb.header("authorization", format!("Bearer {}", req.auth_token));
        } else {
            rb = rb.header("authorization", &req.auth_token);
        }
        if let Some(b) = req.body.clone() {
            rb = rb.json(&b);
        }

        let op_manager = app_handle.state::<OperationManager>();
        if op_manager.state.is_running.load(Ordering::SeqCst) {
            Logger::trace(
                &app_handle,
                &format!("[LIM] Request linked to active operation: {}", route),
                None,
            );
        }

        match rb.send().await {
            Ok(resp) => {
                let status = resp.status();
                handle_rate_limits(
                    &app_handle,
                    &bucket_arc,
                    &global_reset_at,
                    &resp,
                    &global_429_count,
                )
                .await;

                if status.as_u16() == 429 {
                    continue;
                }

                global_429_count.store(0, Ordering::SeqCst);

                let result = if status.is_success() {
                    if req.return_raw_bytes {
                        resp.bytes()
                            .await
                            .map(ApiResponseContent::Bytes)
                            .map_err(AppError::from)
                    } else if status == reqwest::StatusCode::NO_CONTENT {
                        Ok(ApiResponseContent::Json(serde_json::json!({})))
                    } else {
                        resp.json::<serde_json::Value>()
                            .await
                            .map(ApiResponseContent::Json)
                            .map_err(AppError::from)
                    }
                } else {
                    let json = resp.json::<serde_json::Value>().await.unwrap_or_default();
                    Err(AppError::from_discord_json(&json))
                };
                let _ = req.response_tx.send(result);
                break;
            }
            Err(e) => {
                let _ = req.response_tx.send(Err(AppError::from(e)));
                break;
            }
        }
    }
}
