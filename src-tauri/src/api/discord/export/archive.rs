use super::types::ExportProgress;
use crate::api::discord::message_fetcher::fetch_all_messages;
use crate::api::rate_limiter::handle::ApiHandle;
use crate::core::error::AppError;
use crate::core::op_manager::OperationManager;
use crate::core::vault::Vault;
use std::fs::File;
use std::io::Write;
use tauri::{AppHandle, Emitter, Manager, Window};
use zip::write::{SimpleFileOptions, ZipWriter};

#[tauri::command]
pub async fn start_guild_user_archive(
    app_handle: AppHandle,
    window: Window,
    guild_id: String,
    output_path: String,
) -> Result<(), AppError> {
    let identity = Vault::get_active_identity(&app_handle)?;
    let token = identity.token.clone();
    let is_bearer = identity.is_oauth;
    let current_user_id = identity.id.clone();

    let api_handle = app_handle.state::<ApiHandle>();
    let op_manager = app_handle.state::<OperationManager>();
    op_manager.state.prepare();

    let channels_json = api_handle
        .send_request_json(
            reqwest::Method::GET,
            &format!("https://discord.com/api/v9/guilds/{}/channels", guild_id),
            None,
            &token,
            is_bearer,
            None,
        )
        .await?;
    let channels: Vec<serde_json::Value> =
        serde_json::from_value(channels_json).map_err(AppError::from)?;

    let output_file = File::create(&output_path)
        .map_err(|e| AppError::new("Zip Creation Error", &e.to_string()))?;
    let mut zip = ZipWriter::new(output_file);
    let zip_options =
        SimpleFileOptions::default().compression_method(zip::CompressionMethod::Deflated);

    let mut log_accumulator = String::new();

    for (i, channel) in channels.iter().enumerate() {
        let channel_id = channel["id"].as_str().unwrap_or_default();
        let channel_name = channel["name"].as_str().unwrap_or("unknown");
        let c_type = channel["type"].as_u64().unwrap_or(0);

        if c_type != 0 && c_type != 2 {
            continue;
        }

        let _ = window.emit(
            "export_progress",
            ExportProgress {
                current: i + 1,
                total: channels.len(),
                channel_id: channel_id.to_string(),
                status: "archiving_channel".to_string(),
                processed_count: 0,
            },
        );

        let messages = fetch_all_messages(channel_id, &api_handle, &token, is_bearer).await?;

        for msg in messages {
            if msg["author"]["id"].as_str() == Some(&current_user_id) {
                let ts = msg["timestamp"].as_str().unwrap_or("");
                let content = msg["content"].as_str().unwrap_or("");
                log_accumulator.push_str(&format!(
                    "[{}] [#{}]: {}
",
                    ts, channel_name, content
                ));
            }
        }
    }

    zip.start_file("my_messages.txt", zip_options)
        .map_err(|e| AppError::new("Zip Error", &e.to_string()))?;
    zip.write_all(log_accumulator.as_bytes())
        .map_err(|e| AppError::new("Zip Write Error", &e.to_string()))?;
    zip.finish()
        .map_err(|e| AppError::new("Zip Finish Error", &e.to_string()))?;

    op_manager.state.reset();
    let _ = window.emit("export_complete", ());
    Ok(())
}
