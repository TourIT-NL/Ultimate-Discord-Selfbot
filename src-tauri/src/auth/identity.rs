// src-tauri/src/auth/identity.rs

use super::oauth::refresh_oauth_token;
use super::types::DiscordUser;
use crate::api::rate_limiter::ApiHandle;
use crate::core::error::AppError;
use crate::core::logger::Logger;
use crate::core::vault::{DiscordIdentity, Vault};
use tauri::{AppHandle, Emitter, Manager, Window}; // Import refresh_oauth_token

#[tauri::command]
pub async fn login_with_user_token(
    app_handle: AppHandle,
    window: Window,
    token: String,
) -> Result<DiscordUser, AppError> {
    login_with_token_internal(app_handle, window, token, None, false).await
}

pub async fn login_with_token_internal(
    app_handle: AppHandle,
    window: Window,
    token: String,
    refresh_token: Option<String>,
    is_oauth: bool,
) -> Result<DiscordUser, AppError> {
    let token = token
        .trim()
        .trim_start_matches("Bearer ")
        .trim_matches('"')
        .to_string();
    let user_profile = validate_token(&app_handle, &token, is_oauth, refresh_token.clone()).await?;

    Vault::save_identity(
        &app_handle,
        DiscordIdentity {
            id: user_profile.id.clone(),
            username: user_profile.username.clone(),
            token: token.clone(),
            refresh_token,
            is_oauth,
        },
    )?;

    let _ = window.emit("auth_success", user_profile.clone());
    Ok(user_profile)
}

pub async fn validate_token(
    app_handle: &AppHandle,
    token: &str,
    is_bearer: bool,
    mut refresh_token_opt: Option<String>,
) -> Result<DiscordUser, AppError> {
    // 1. Strict Structural Parity Check
    let token_regex = regex::Regex::new(
        r"^(mfa\.[a-zA-Z0-9_-]{84}|[a-zA-Z0-9_-]{24,28}\.[a-zA-Z0-9_-]{6}\.[a-zA-Z0-9_-]{27,38})$",
    )
    .unwrap();

    if !token_regex.is_match(token) {
        Logger::error(
            app_handle,
            "[Auth] Token structural validation failed.",
            None,
        );
        return Err(AppError::new(
            "Invalid token format detected.",
            "invalid_token_format",
        ));
    }

    let mut current_token = token.to_string();
    let mut num_retries = 0;
    const MAX_RETRIES: u8 = 1; // Only one retry after refresh

    loop {
        let api_handle = app_handle.state::<ApiHandle>();
        let response_result = api_handle
            .send_request_json(
                reqwest::Method::GET,
                "https://discord.com/api/v9/users/@me",
                None,
                &current_token,
                is_bearer,
                Some("https://discord.com/login".to_string()),
            )
            .await;

        match response_result {
            Ok(response_value) => {
                return serde_json::from_value(response_value).map_err(AppError::from);
            }
            Err(e) => {
                if let Some(details) = &e.technical_details {
                    if (details.contains("401") || details.contains("403"))
                        && is_bearer
                        && refresh_token_opt.is_some()
                        && num_retries < MAX_RETRIES
                    {
                        Logger::warn(
                            app_handle,
                            "[Auth] Access token expired or invalid. Attempting refresh...",
                            Some(serde_json::json!({"error_code": e.error_code})),
                        );

                        match refresh_oauth_token(app_handle, refresh_token_opt.clone().unwrap())
                            .await
                        {
                            Ok((new_access_token, new_refresh_token)) => {
                                Logger::info(
                                    app_handle,
                                    "[Auth] Token refreshed successfully. Updating identity.",
                                    None,
                                );
                                current_token = new_access_token.clone();
                                refresh_token_opt = new_refresh_token.clone();

                                // Retrieve active identity to update it
                                if let Ok(mut identity) = Vault::get_active_identity(app_handle) {
                                    identity.token = new_access_token;
                                    identity.refresh_token = new_refresh_token;
                                    let _ = Vault::save_identity(app_handle, identity); // Save updated identity
                                } else {
                                    Logger::error(
                                        app_handle,
                                        "[Auth] Failed to retrieve active identity for update after refresh.",
                                        None,
                                    );
                                }
                                num_retries += 1;
                                continue; // Retry the API call with the new token
                            }
                            Err(refresh_err) => {
                                Logger::error(
                                    app_handle,
                                    "[Auth] Failed to refresh token.",
                                    Some(
                                        serde_json::json!({"error": format!("{:?}", refresh_err)}),
                                    ),
                                );
                                // Fall through to force logout
                            }
                        }
                    }
                }
                // If not refreshable, or refresh failed, or max retries reached
                Logger::warn(
                    app_handle,
                    "[Auth] Token is invalid or expired. Forcing logout.",
                    Some(serde_json::json!({"error_code": e.error_code})),
                );
                let _ = app_handle.emit("force_logout", ());
                return Err(e);
            }
        }
    }
}

#[tauri::command]
pub async fn save_discord_credentials(
    app_handle: AppHandle,
    client_id: String,
    client_secret: String,
) -> Result<(), AppError> {
    Vault::set_credential(&app_handle, "client_id", client_id.trim())?;
    Vault::set_credential(&app_handle, "client_secret", client_secret.trim())?;
    Logger::info(&app_handle, "[Vault] Discord credentials updated", None);
    Ok(())
}

#[tauri::command]
pub async fn list_identities(app_handle: AppHandle) -> Result<Vec<DiscordIdentity>, AppError> {
    Ok(Vault::list_identities(&app_handle))
}

#[tauri::command]
pub async fn switch_identity(
    app_handle: AppHandle,
    window: Window,
    id: String,
) -> Result<DiscordUser, AppError> {
    let identities = Vault::list_identities(&app_handle);
    let identity = identities
        .iter()
        .find(|i| i.id == id)
        .ok_or_else(|| AppError {
            user_message: "Identity not found.".into(),
            ..Default::default()
        })?;
    Logger::info(
        &app_handle,
        &format!("[Auth] Switching to identity: {}", identity.username),
        None,
    );
    login_with_token_internal(
        app_handle,
        window,
        identity.token.clone(),
        identity.refresh_token.clone(),
        identity.is_oauth,
    )
    .await
}

#[tauri::command]
pub async fn remove_identity(app_handle: AppHandle, id: String) -> Result<(), AppError> {
    Vault::remove_identity(&app_handle, &id)
}

#[tauri::command]
pub async fn logout(app_handle: AppHandle) -> Result<(), AppError> {
    Vault::clear_active_session(&app_handle)
}

#[tauri::command]
pub async fn get_current_user(
    app_handle: AppHandle,
    window: Window,
) -> Result<DiscordUser, AppError> {
    let (token, is_bearer) = Vault::get_active_token(&app_handle)?;
    let user_profile = validate_token(&app_handle, &token, is_bearer, None).await?;
    let _ = window.emit("auth_success", user_profile.clone());
    Ok(user_profile)
}
