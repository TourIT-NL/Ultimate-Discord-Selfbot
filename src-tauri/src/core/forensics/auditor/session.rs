use super::paths::get_discord_base_paths;
use crate::core::error::AppError;
use crate::core::logger::Logger;
use crate::core::vault::Vault;
use is_elevated::is_elevated;
use regex::Regex;
use sha2::{Digest, Sha256};
use std::fs;
use std::io::copy;
use walkdir::WalkDir;

pub struct SessionAuditor;

impl SessionAuditor {
    pub fn audit_system_environment(app: &tauri::AppHandle) -> Result<(), AppError> {
        Logger::info(
            app,
            "[Forensics] Starting system environment audit...",
            None,
        );

        if is_elevated() {
            Logger::warn(
                app,
                "[Forensics] Application is running with elevated privileges. This increases attack surface.",
                None,
            );
        } else {
            Logger::debug(
                app,
                "[Forensics] Application is running with normal user privileges.",
                None,
            );
        }

        Logger::debug(
            app,
            "[Forensics] Performing DNS resolution check (placeholder).",
            None,
        );
        Logger::debug(
            app,
            "[Forensics] Performing basic process scan (placeholder).",
            None,
        );
        Logger::debug(
            app,
            "[Forensics] Performing anti-debugging check (placeholder).",
            None,
        );

        Logger::info(app, "[Forensics] System environment audit completed.", None);
        Ok(())
    }

    pub fn check_discord_client_integrity(app: &tauri::AppHandle) -> Result<(), AppError> {
        Logger::info(
            app,
            "[Forensics] Starting Discord client integrity check...",
            None,
        );

        let base_paths = get_discord_base_paths();
        if base_paths.is_empty() {
            return Err(AppError::new(
                "No Discord installations found to perform integrity check.",
                "discord_not_found",
            ));
        }

        let critical_files: Vec<&str> = vec![
            #[cfg(target_os = "windows")]
            "Discord.exe",
            #[cfg(target_os = "macos")]
            "Discord",
            #[cfg(target_os = "linux")]
            "Discord",
            "modules/discord_desktop_core/index.js",
            "modules/discord_desktop_core/core.asar",
            "package.json",
        ];

        for base_path in base_paths {
            Logger::debug(
                app,
                &format!("[Forensics] Checking integrity in: {:?}", base_path),
                None,
            );

            for file_suffix in &critical_files {
                let file_path = base_path.join(file_suffix);

                if !file_path.exists() {
                    Logger::warn(
                        app,
                        &format!(
                            "[Forensics] Critical Discord file not found: {:?}",
                            file_path
                        ),
                        None,
                    );
                    return Err(AppError::new(
                        &format!("Critical Discord file not found: {:?}", file_path),
                        "discord_file_missing",
                    ));
                }

                if !file_path.is_file() {
                    return Err(AppError::new(
                        &format!("Expected file is not a file: {:?}", file_path),
                        "discord_file_invalid_type",
                    ));
                }

                match fs::File::open(&file_path) {
                    Ok(mut file) => {
                        let mut hasher = Sha256::new();
                        match copy(&mut file, &mut hasher) {
                            Ok(_) => {
                                let hash = hasher.finalize();
                                Logger::debug(
                                    app,
                                    &format!(
                                        "[Forensics] Verified file: {:?} Hash: {:x}",
                                        file_path, hash
                                    ),
                                    None,
                                );
                            }
                            Err(_e) => {
                                return Err(AppError::new(
                                    &format!(
                                        "Failed to read and hash Discord file: {:?}",
                                        file_path
                                    ),
                                    "discord_file_read_error",
                                ));
                            }
                        }
                    }
                    Err(_) => {
                        return Err(AppError::new(
                            &format!(
                                "Failed to open Discord file for integrity check: {:?}",
                                file_path
                            ),
                            "discord_file_open_error",
                        ));
                    }
                }
            }
        }

        Logger::info(
            app,
            "[Forensics] Discord client integrity check completed successfully.",
            None,
        );
        Ok(())
    }

    pub fn extrapolate_client_id(app: &tauri::AppHandle) -> Result<String, AppError> {
        if let Ok(id_from_env) = std::env::var("DISCORD_CLIENT_ID") {
            if !id_from_env.is_empty() {
                Logger::info(
                    app,
                    "[Forensics] Using client_id from DISCORD_CLIENT_ID environment variable.",
                    None,
                );
                return Ok(id_from_env);
            }
        }

        if let Ok(id_from_vault) = Vault::get_credential(app, "client_id") {
            return Ok(id_from_vault);
        }

        let base_paths = get_discord_base_paths();
        let re = Regex::new(r#"clientId:"([0-9]{18,19})""#).unwrap();

        for base_path in &base_paths {
            #[cfg(target_os = "windows")]
            if let Ok(entries) = fs::read_dir(base_path) {
                for entry in entries.filter_map(|e| e.ok()) {
                    let entry_path = entry.path();
                    if entry_path.is_dir()
                        && entry_path
                            .file_name()
                            .and_then(|s| s.to_str())
                            .is_some_and(|n| n.starts_with("app-"))
                    {
                        let app_resources_path = entry_path.join("resources").join("app");
                        if let Some(id) = Self::scrape_js_files(app, &app_resources_path, &re) {
                            return Err(AppError::client_id_extrapolation_needed(id));
                        }
                    }
                }
            }

            #[cfg(any(target_os = "linux", target_os = "windows"))]
            {
                let alt_path = base_path.join("resources").join("app");
                if let Some(id) = Self::scrape_js_files(app, &alt_path, &re) {
                    return Err(AppError::client_id_extrapolation_needed(id));
                }
            }

            #[cfg(target_os = "macos")]
            {
                let app_resources_path = base_path.join("Contents").join("Resources").join("app");
                if let Some(id) = Self::scrape_js_files(app, &app_resources_path, &re) {
                    return Err(AppError::client_id_extrapolation_needed(id));
                }
            }
        }

        Err(AppError::new(
            "No Discord Client ID found.",
            "client_id_not_found",
        ))
    }

    fn scrape_js_files(
        app: &tauri::AppHandle,
        path: &std::path::Path,
        re: &Regex,
    ) -> Option<String> {
        if !path.exists() {
            return None;
        }
        for entry in WalkDir::new(path).into_iter().filter_map(|e| e.ok()) {
            if entry.path().extension().is_some_and(|ext| ext == "js") {
                if let Ok(content) = fs::read_to_string(entry.path()) {
                    if let Some(cap) = re.captures(&content) {
                        if let Some(id) = cap.get(1) {
                            let client_id = id.as_str().to_string();
                            Logger::info(
                                app,
                                &format!("[Forensics] Extrapolated client_id: {}", client_id),
                                None,
                            );
                            return Some(client_id);
                        }
                    }
                }
            }
        }
        None
    }
}
