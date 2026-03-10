use super::types::{ExportOptions, ExportProgress};
use crate::api::discord::message_fetcher::fetch_all_messages;
use crate::api::rate_limiter::handle::ApiHandle;
use crate::core::error::AppError;
use crate::core::op_manager::OperationManager;
use crate::core::vault::Vault;
use std::fs::{self, File};
use std::io::Write;
use std::path::PathBuf;
use tauri::{AppHandle, Emitter, Manager, Window};

pub fn generate_html_from_messages(
    messages: &[serde_json::Value],
    include_attachments: bool,
) -> String {
    let mut html_content = String::from(
        "<html><head><style>
        body { font-family: sans-serif; background: #313338; color: #dbdee1; padding: 20px; }
        .message { margin-bottom: 15px; padding: 10px; border-radius: 8px; background: #2b2d31; }
        .author { font-weight: bold; color: #f2f3f5; margin-right: 10px; }
        .timestamp { font-size: 0.8em; color: #949ba4; }
        .content { margin-top: 5px; white-space: pre-wrap; }
        .attachment { margin-top: 10px; padding: 5px; border: 1px solid #4e5058; border-radius: 4px; display: inline-block; }
    </style></head><body>",
    );

    for msg in messages {
        let author = msg["author"]["username"].as_str().unwrap_or("Unknown");
        let content = msg["content"].as_str().unwrap_or("");
        let ts = msg["timestamp"].as_str().unwrap_or("");

        html_content.push_str(&format!(
            "<div class='message'><span class='author'>{}</span><span class='timestamp'>{}</span><div class='content'>{}</div>",
            author, ts, content
        ));

        if include_attachments {
            if let Some(atts) = msg["attachments"].as_array() {
                for att in atts {
                    let att_name = att["filename"].as_str().unwrap_or("file");
                    html_content.push_str(&format!(
                        "<div class='attachment'>Attachment: {}</div>",
                        att_name
                    ));
                }
            }
        }
        html_content.push_str("</div>");
    }
    html_content.push_str("</body></html>");
    html_content
}

#[tauri::command]
pub async fn start_chat_export(
    app_handle: AppHandle,
    window: Window,
    options: ExportOptions,
) -> Result<(), AppError> {
    let identity = Vault::get_active_identity(&app_handle)?;
    let user_id = identity.id;
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
                status: "fetching_history".to_string(),
                processed_count: 0,
            },
        );

        let all_messages = fetch_all_messages(channel_id, &api_handle, &token, is_bearer).await?;

        // Filter by direction
        let filtered_messages: Vec<serde_json::Value> = all_messages
            .into_iter()
            .filter(|msg| {
                let msg_author_id = msg["author"]["id"].as_str().unwrap_or("");
                match options.direction.as_str() {
                    "sent" => msg_author_id == user_id,
                    "received" => msg_author_id != user_id,
                    _ => true, // "both" or default
                }
            })
            .collect();

        let _ = window.emit(
            "export_progress",
            ExportProgress {
                current: i + 1,
                total: options.channel_ids.len(),
                channel_id: channel_id.to_string(),
                status: format!("generating_{}", options.format),
                processed_count: filtered_messages.len(),
            },
        );

        let (ext, content) = if options.format == "raw" {
            (
                "json",
                serde_json::to_string_pretty(&filtered_messages).unwrap(),
            )
        } else {
            (
                "html",
                generate_html_from_messages(&filtered_messages, options.include_attachments),
            )
        };

        let file_path = output_dir.join(format!("{}.{}", channel_id, ext));
        let mut file = File::create(file_path)
            .map_err(|e| AppError::new("File Creation Error", &e.to_string()))?;
        file.write_all(content.as_bytes())
            .map_err(|e| AppError::new("File Write Error", &e.to_string()))?;
    }

    op_manager.state.reset();
    let _ = window.emit("export_complete", ());
    Ok(())
}
