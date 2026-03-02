use crate::api::rate_limiter::fingerprint::{BrowserProfile, FingerprintManager};
use crate::core::error::AppError;
use crate::core::logger::Logger;
use crate::core::vault::Vault;
use reqwest::{Client, header};
use std::time::Duration;

pub fn build_client(
    app_handle: &tauri::AppHandle,
    profile: &BrowserProfile,
    locale: &str,
) -> Client {
    let super_props = FingerprintManager::generate_super_properties(profile, locale);

    let mut builder = Client::builder()
        .timeout(Duration::from_secs(30))
        .user_agent(&profile.user_agent)
        .default_headers({
            let mut h = header::HeaderMap::new();
            h.insert(
                "x-super-properties",
                header::HeaderValue::from_str(&super_props).unwrap(),
            );
            h.insert(
                "origin",
                header::HeaderValue::from_static("https://discord.com"),
            );
            for (name, val) in FingerprintManager::generate_client_hints(profile) {
                h.insert(name, header::HeaderValue::from_str(&val).unwrap());
            }
            h
        });

    if let Ok(proxy_url) = Vault::get_credential(app_handle, "proxy_url").and_then(|s| {
        if s.is_empty() {
            Err(AppError::new("Empty proxy", "proxy_empty"))
        } else {
            Ok(s)
        }
    }) {
        if let Ok(proxy) = reqwest::Proxy::all(&proxy_url) {
            builder = builder.proxy(proxy);
            Logger::debug(
                app_handle,
                "[LIM] Proxy configuration injected into engine",
                None,
            );
        } else {
            Logger::warn(
                app_handle,
                "[LIM] Invalid proxy URL provided",
                Some(serde_json::json!({ "proxy_url": proxy_url })),
            );
        }
    }

    builder.build().unwrap()
}
