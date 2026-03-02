// src-tauri/src/api/rate_limiter/actor.rs

use crate::api::discord_routes::get_discord_route;
use crate::api::rate_limiter::client_builder::build_client;
use crate::api::rate_limiter::fingerprint::{BrowserProfile, FingerprintManager};
use crate::api::rate_limiter::request_handler::handle_request;
use crate::api::rate_limiter::types::{ApiRequest, BucketInfo};
use crate::core::logger::Logger;
use reqwest::Client;
use std::collections::HashMap;
use std::sync::Arc;
use std::sync::atomic::AtomicU32;
use std::time::Instant;
use tokio::sync::{Mutex, mpsc};

pub struct RateLimiterActor {
    pub inbox: mpsc::Receiver<ApiRequest>,
    pub client: Client,
    pub profile: BrowserProfile,
    pub buckets: Arc<Mutex<HashMap<String, Arc<Mutex<BucketInfo>>>>>,
    pub global_reset_at: Arc<Mutex<Instant>>,
    pub app_handle: tauri::AppHandle,
    pub global_429_count: Arc<AtomicU32>,
}

impl RateLimiterActor {
    pub fn new(inbox: mpsc::Receiver<ApiRequest>, app_handle: tauri::AppHandle) -> Self {
        let profile = FingerprintManager::random_profile();
        let client = build_client(
            &app_handle,
            &profile,
            &FingerprintManager::get_system_locale(),
        );
        Self {
            inbox,
            client,
            profile,
            buckets: Arc::new(Mutex::new(HashMap::new())),
            global_reset_at: Arc::new(Mutex::new(Instant::now())),
            app_handle,
            global_429_count: Arc::new(AtomicU32::new(0)),
        }
    }

    pub async fn run(&mut self) {
        Logger::info(
            &self.app_handle,
            "[LIM] Engine Dispatcher active and resilient",
            None,
        );

        while let Some(request) = self.inbox.recv().await {
            match request {
                ApiRequest::RebuildClient => {
                    self.profile = FingerprintManager::random_profile();
                    self.client = build_client(
                        &self.app_handle,
                        &self.profile,
                        &FingerprintManager::get_system_locale(),
                    );
                    Logger::info(
                        &self.app_handle,
                        "[LIM] Client rebuilt with new profile",
                        None,
                    );
                }
                ApiRequest::Standard(req) => {
                    let client = self.client.clone();
                    let buckets = self.buckets.clone();
                    let global = self.global_reset_at.clone();
                    let app_handle = self.app_handle.clone();
                    let route = get_discord_route(&req.url).to_string();
                    let global_429_count = self.global_429_count.clone();
                    let actor_profile = self.profile.clone();

                    tokio::spawn(async move {
                        handle_request(
                            *req,
                            client,
                            buckets,
                            global,
                            app_handle,
                            route,
                            global_429_count,
                            actor_profile,
                        )
                        .await;
                    });
                }
            }
        }
    }
}
