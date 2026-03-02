use crate::api::rate_limiter::handle::ApiHandle;
use crate::core::error::AppError;

pub async fn fetch_all_messages(
    channel_id: &str,
    api_handle: &ApiHandle,
    token: &str,
    is_bearer: bool,
) -> Result<Vec<serde_json::Value>, AppError> {
    let mut all_messages = Vec::new();
    let mut last_id: Option<String> = None;

    loop {
        let mut url = format!(
            "https://discord.com/api/v9/channels/{}/messages?limit=100",
            channel_id
        );
        if let Some(id) = &last_id {
            url.push_str(&format!("&before={}", id));
        }

        let messages: Vec<serde_json::Value> = match api_handle
            .send_request_json(reqwest::Method::GET, &url, None, token, is_bearer, None)
            .await
        {
            Ok(v) => serde_json::from_value(v).map_err(AppError::from)?,
            Err(_) => break,
        };

        if messages.is_empty() {
            break;
        }

        last_id = messages
            .last()
            .and_then(|m| m["id"].as_str().map(|s| s.to_string()));

        all_messages.extend(messages);
    }

    Ok(all_messages)
}
