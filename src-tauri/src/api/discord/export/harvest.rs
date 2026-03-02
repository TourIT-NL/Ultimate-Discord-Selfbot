use super::types::{ExportOptions, ExportProgress};
use crate::api::discord::message_fetcher::fetch_all_messages;
use crate::api::rate_limiter::handle::{ApiHandle, RequestConfig};
use crate::api::rate_limiter::types::ApiResponseContent;
use crate::core::error::AppError;
use crate::core::op_manager::OperationManager;
use crate::core::vault::Vault;
use std::fs::{self, File};
use std::io::Write;
use std::path::{Path, PathBuf};
use tauri::{AppHandle, Emitter, Manager, Window};

async fn download_file(
    api_handle: &ApiHandle,
    url: &str,
    save_path: &Path,
    token: &str,
    is_bearer: bool,
) -> Result<(), AppError> {
    let response_content = api_handle
        .send_request(
            reqwest::Method::GET,
            url,
            None,
            token,
            is_bearer,
            RequestConfig {
                return_raw_bytes: true,
                ..Default::default()
            },
        )
        .await?;

    match response_content {
        ApiResponseContent::Bytes(bytes) => {
            let mut file = File::create(save_path)
                .map_err(|e| AppError::new("File Creation Error", &e.to_string()))?;
            file.write_all(&bytes)
                .map_err(|e| AppError::new("File Write Error", &e.to_string()))?;
            Ok(())
        }
        _ => Err(AppError::new(
            "Type Mismatch",
            "Expected raw bytes, received JSON",
        )),
    }
}

#[tauri::command]
pub async fn start_attachment_harvest(
    app_handle: AppHandle,
    window: Window,
    options: ExportOptions,
) -> Result<(), AppError> {
    let (token, is_bearer) = Vault::get_active_token(&app_handle)?;
    let api_handle = app_handle.state::<ApiHandle>();
    let op_manager = app_handle.state::<OperationManager>();
    op_manager.state.prepare();

    let output_dir = PathBuf::from(&options.output_path);
    fs::create_dir_all(&output_dir)
        .map_err(|e| AppError::new("Directory Creation Error", &e.to_string()))?;

    for (i, channel_id) in options.channel_ids.iter().enumerate() {
        let _ = window.emit(
            "export_progress",
            ExportProgress {
                current: i + 1,
                total: options.channel_ids.len(),
                channel_id: channel_id.to_string(),
                status: "fetching_messages".to_string(),
                processed_count: 0,
            },
        );

        let messages = fetch_all_messages(channel_id, &api_handle, &token, is_bearer).await?;
        let mut attachment_count = 0;

        for msg in messages {
            if let Some(attachments) = msg.get("attachments").and_then(|a| a.as_array()) {
                for attachment in attachments {
                    if let (Some(url), Some(filename)) = (
                        attachment.get("url").and_then(|u| u.as_str()),
                        attachment.get("filename").and_then(|f| f.as_str()),
                    ) {
                        let save_path = output_dir.join(filename);
                        let _ = window.emit(
                            "export_progress",
                            ExportProgress {
                                current: i + 1,
                                total: options.channel_ids.len(),
                                channel_id: channel_id.to_string(),
                                status: format!("downloading_{}", filename),
                                processed_count: attachment_count,
                            },
                        );
                        download_file(&api_handle, url, &save_path, &token, is_bearer).await?;
                        attachment_count += 1;
                    }
                }
            }
        }
    }

    op_manager.state.reset();
    let _ = window.emit("export_complete", ());
    Ok(())
}
