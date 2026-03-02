use super::types::BucketInfo;
use crate::core::logger::Logger;
use reqwest::Response;
use std::sync::{Arc, atomic::Ordering};
use std::time::{Duration, Instant};
use tokio::sync::Mutex;

pub async fn handle_rate_limits(
    app: &tauri::AppHandle,
    bucket_arc: &Arc<Mutex<BucketInfo>>,
    global_throttle: &Arc<Mutex<Instant>>,
    response: &Response,
    global_429_count: &Arc<std::sync::atomic::AtomicU32>,
) {
    let headers = response.headers();
    let mut bucket = bucket_arc.lock().await;
    let now = Instant::now();

    if let Some(bid) = headers
        .get("x-ratelimit-bucket")
        .and_then(|v| v.to_str().ok())
    {
        bucket.bucket_id = Some(bid.to_string());
    }

    if let Some(limit) = headers
        .get("x-ratelimit-limit")
        .and_then(|v| v.to_str().ok())
        .and_then(|s| s.parse::<u32>().ok())
    {
        bucket.limit = limit;
    }

    if let Some(remaining) = headers
        .get("x-ratelimit-remaining")
        .and_then(|v| v.to_str().ok())
        .and_then(|s| s.parse::<u32>().ok())
    {
        bucket.remaining = remaining;
    }

    if let Some(reset_after) = headers
        .get("x-ratelimit-reset-after")
        .and_then(|v| v.to_str().ok())
        .and_then(|s| s.parse::<f64>().ok())
    {
        bucket.reset_at = now + Duration::from_secs_f64(reset_after);
    }

    if response.status().as_u16() == 429 {
        bucket.consecutive_429s += 1;
        let retry_after = headers
            .get("retry-after")
            .and_then(|v| v.to_str().ok())
            .and_then(|s| s.parse::<f64>().ok())
            .unwrap_or(1.0);

        if global_429_count.fetch_add(1, Ordering::SeqCst) > 10 {
            let mut g = global_throttle.lock().await;
            *g = now + Duration::from_secs(60);
            Logger::error(
                app,
                "[LIM] Circuit breaker active! Locking engine for 60s.",
                None,
            );
            global_429_count.store(0, Ordering::SeqCst);
        }

        let backoff = Duration::from_secs_f64(retry_after)
            + Duration::from_secs(2u64.pow(bucket.consecutive_429s.min(6)));
        bucket.reset_at = now + backoff;
        bucket.remaining = 0;

        if headers.contains_key("x-ratelimit-global") {
            let mut g = global_throttle.lock().await;
            *g = now + Duration::from_secs_f64(retry_after);
            Logger::error(
                app,
                &format!("[LIM] GLOBAL 429. Throttle for {:?}", retry_after),
                None,
            );
        } else {
            Logger::warn(
                app,
                &format!("[LIM] Bucket 429. Backoff for {:?}", backoff),
                None,
            );
        }
    } else {
        bucket.consecutive_429s = 0;
    }
}
