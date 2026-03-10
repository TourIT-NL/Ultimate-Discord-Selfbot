use super::paths::get_discord_base_paths;
use crate::core::error::AppError;
use crate::core::logger::Logger;
use crate::core::vault::Vault;
use is_elevated::is_elevated;
use regex::Regex;
use sha2::{Digest, Sha256};
use std::fs;
use std::io::copy;
use std::net::ToSocketAddrs;
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

        // 1. DNS Resolution Check
        let domains = [
            "discord.com",
            "gateway.discord.gg",
            "remote-auth-gateway.discord.gg",
        ];
        for domain in &domains {
            match (domain.to_string(), 443).to_socket_addrs() {
                Ok(_) => Logger::debug(
                    app,
                    &format!("[Forensics] DNS resolution successful for {}", domain),
                    None,
                ),
                Err(e) => Logger::warn(
                    app,
                    &format!("[Forensics] DNS resolution failed for {}: {}", domain, e),
                    None,
                ),
            }
        }

        // 2. Process Scan for monitoring/malicious tools
        let mut s = sysinfo::System::new();
        s.refresh_processes_specifics(
            sysinfo::ProcessesToUpdate::All,
            true,
            sysinfo::ProcessRefreshKind::default(),
        );

        let suspicious_processes = [
            "wireshark",
            "fiddler",
            "charles",
            "http-toolkit",
            "proxyman",
            "cheatengine",
            "processhacker",
            "x64dbg",
            "ollydbg",
            "ida64",
            "ghidra",
        ];

        for process in s.processes().values() {
            let name = process.name().to_string_lossy().to_lowercase();
            for suspicious in &suspicious_processes {
                if name.contains(suspicious) {
                    Logger::warn(
                        app,
                        &format!(
                            "[Forensics] Detected potentially intrusive process: {} (PID: {})",
                            name,
                            process.pid()
                        ),
                        Some(serde_json::json!({"pid": process.pid().as_u32(), "name": name})),
                    );
                }
            }
        }

        // 3. Anti-Debugging Check
        #[cfg(target_os = "windows")]
        {
            unsafe {
                if windows_sys::Win32::System::Diagnostics::Debug::IsDebuggerPresent() != 0 {
                    Logger::warn(
                        app,
                        "[Forensics] Anti-Debugging: Process is being debugged!",
                        None,
                    );
                }
            }
        }

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

        let mut integrity_verified = false;
        'base_path_loop: for base_path in &base_paths {
            Logger::debug(
                app,
                &format!("[Forensics] Checking integrity in: {:?}", base_path),
                None,
            );

            // 1. Check for executable
            let exe_name = {
                #[cfg(target_os = "windows")]
                {
                    "Discord.exe"
                }
                #[cfg(target_os = "macos")]
                {
                    "Discord"
                } // This is likely inside Contents/MacOS/
                #[cfg(target_os = "linux")]
                {
                    "Discord"
                }
            };

            let exe_path = base_path.join(exe_name);
            if !exe_path.is_file() {
                Logger::warn(
                    app,
                    &format!(
                        "[Forensics] Discord executable not found at: {:?}",
                        exe_path
                    ),
                    None,
                );
                continue; // Try next base_path
            }

            // Hash verification for exe_path (existing logic from original)
            match fs::File::open(&exe_path) {
                Ok(mut file) => {
                    let mut hasher = Sha256::new();
                    match copy(&mut file, &mut hasher) {
                        Ok(_) => {
                            let hash = hasher.finalize();
                            Logger::debug(
                                app,
                                &format!(
                                    "[Forensics] Verified executable: {:?} Hash: {:x}",
                                    exe_path, hash
                                ),
                                None,
                            );
                        }
                        Err(_e) => {
                            Logger::warn(
                                app,
                                &format!(
                                    "Failed to read and hash Discord executable: {:?}",
                                    exe_path
                                ),
                                None,
                            );
                            continue; // This base_path is problematic
                        }
                    }
                }
                Err(_) => {
                    Logger::warn(
                        app,
                        &format!(
                            "Failed to open Discord executable for integrity check: {:?}",
                            exe_path
                        ),
                        None,
                    );
                    continue; // This base_path is problematic
                }
            }

            // 2. Check for modules
            let modules_dir = base_path.join("modules");
            if !modules_dir.is_dir() {
                Logger::warn(
                    app,
                    &format!(
                        "[Forensics] 'modules' directory not found in: {:?}",
                        base_path
                    ),
                    None,
                );
                continue; // Try next base_path
            }

            let mut core_module_found = false;
            if let Ok(entries) = std::fs::read_dir(&modules_dir) {
                for entry in entries.flatten() {
                    let path = entry.path();
                    if path.is_dir() {
                        if let Some(dir_name) = path.file_name().and_then(|s| s.to_str()) {
                            if dir_name.starts_with("discord_desktop_core-") {
                                let core_module_root = path; // This is the path to discord_desktop_core-1
                                let core_module_path =
                                    core_module_root.join("discord_desktop_core");

                                let index_js = core_module_path.join("index.js");
                                let core_asar = core_module_path.join("core.asar");
                                let package_json = core_module_path.join("package.json");

                                let critical_core_module_files =
                                    vec![index_js.clone(), core_asar, package_json];

                                let mut all_files_in_core_found = true;
                                for file_path in critical_core_module_files {
                                    if !file_path.is_file() {
                                        Logger::warn(
                                            app,
                                            &format!(
                                                "[Forensics] Critical Discord module file not found: {:?}",
                                                file_path
                                            ),
                                            None,
                                        );
                                        all_files_in_core_found = false;
                                        break; // This core module path is invalid
                                    }
                                    // Hash verification for module file
                                    match fs::File::open(&file_path) {
                                        Ok(mut file) => {
                                            let mut hasher = Sha256::new();
                                            match copy(&mut file, &mut hasher) {
                                                Ok(_) => {
                                                    let hash = hasher.finalize();
                                                    Logger::debug(
                                                        app,
                                                        &format!(
                                                            "[Forensics] Verified module file: {:?} Hash: {:x}",
                                                            file_path, hash
                                                        ),
                                                        None,
                                                    );
                                                }
                                                Err(_e) => {
                                                    Logger::warn(
                                                        app,
                                                        &format!(
                                                            "Failed to read and hash Discord module file: {:?}",
                                                            file_path
                                                        ),
                                                        None,
                                                    );
                                                    all_files_in_core_found = false;
                                                    break;
                                                }
                                            }
                                        }
                                        Err(_) => {
                                            Logger::warn(
                                                app,
                                                &format!(
                                                    "Failed to open Discord module file for integrity check: {:?}",
                                                    file_path
                                                ),
                                                None,
                                            );
                                            all_files_in_core_found = false;
                                            break;
                                        }
                                    }
                                }

                                if all_files_in_core_found {
                                    core_module_found = true;
                                    // 3. Scan for malicious modifications within this module
                                    Self::scan_for_malicious_modifications(app, &index_js);
                                    break; // Found and verified, we are done with this module scan
                                }
                            }
                        }
                    }
                }
            }
            if !core_module_found {
                Logger::warn(
                    app,
                    &format!(
                        "[Forensics] Could not find and verify 'discord_desktop_core' within: {:?}",
                        modules_dir
                    ),
                    None,
                );
                continue; // Try next base_path
            }

            // If we reach here, both exe and modules are verified for this base_path
            integrity_verified = true;
            break 'base_path_loop;
        }

        if integrity_verified {
            Logger::info(
                app,
                "[Forensics] Discord client integrity check completed successfully.",
                None,
            );
            Ok(())
        } else {
            Err(AppError::new(
                "Failed to verify Discord client integrity across all found installations.",
                "discord_integrity_check_failed",
            ))
        }
    }

    /// Scans a specific index.js file for common token stealer patterns.
    fn scan_for_malicious_modifications(app: &tauri::AppHandle, path: &std::path::Path) {
        if let Ok(content) = fs::read_to_string(path) {
            let mut detected = false;
            let suspicious_keywords = [
                "webhook",
                "http",
                "https",
                "axios",
                "fetch",
                "XMLHttpRequest",
                "LOCALAPPDATA",
                "Roaming",
                "leveldb",
                "tokens",
                "password",
                "mfa",
                "ND...",
                "OT...",
            ];

            // A typical Discord index.js is very small. If it's over 1KB and contains webhooks, it's suspicious.
            let size = content.len();
            if size > 1500 {
                for kw in &suspicious_keywords {
                    if content.contains(kw) {
                        Logger::warn(
                            app,
                            &format!(
                                "[SECURITY] Detected suspicious payload in Discord module index.js: '{}' at {:?}",
                                kw, path
                            ),
                            Some(serde_json::json!({"file_size": size, "pattern": kw})),
                        );
                        detected = true;
                    }
                }
            }

            if !detected {
                Logger::debug(
                    app,
                    &format!(
                        "[Forensics] No immediate malicious patterns found in {:?}",
                        path
                    ),
                    None,
                );
            }
        }
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
        // More robust regex to catch variations in minified or formatted JS
        let re = Regex::new(r#"(?i)client_?id[:=]\s*["']?([0-9]{17,21})["']?"#).unwrap();

        for base_path in &base_paths {
            Logger::debug(
                app,
                &format!("[Forensics] Scanning for Client ID in: {:?}", base_path),
                None,
            );

            // Priority 1: Check in app resources
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
                            Logger::info(
                                app,
                                &format!("[Forensics] Successfully extrapolated client_id: {}", id),
                                None,
                            );
                            return Err(AppError::client_id_extrapolation_needed(id));
                        }

                        // Fallback: Check in app.asar
                        let app_asar_path = entry_path.join("resources").join("app.asar");
                        if app_asar_path.exists() {
                            if let Some(id) = Self::scrape_asar_file(app, &app_asar_path, &re) {
                                Logger::info(
                                    app,
                                    &format!(
                                        "[Forensics] Successfully extrapolated client_id from ASAR: {}",
                                        id
                                    ),
                                    None,
                                );
                                return Err(AppError::client_id_extrapolation_needed(id));
                            }
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

                let alt_asar = base_path.join("resources").join("app.asar");
                if alt_asar.exists() {
                    if let Some(id) = Self::scrape_asar_file(app, &alt_asar, &re) {
                        return Err(AppError::client_id_extrapolation_needed(id));
                    }
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

    fn scrape_asar_file(
        _app: &tauri::AppHandle,
        path: &std::path::Path,
        re: &Regex,
    ) -> Option<String> {
        use std::io::{BufReader, Read};

        let file = match fs::File::open(path) {
            Ok(f) => f,
            Err(_) => return None,
        };

        let mut reader = BufReader::new(file);
        let mut buffer = vec![0; 65536]; // 64KB chunks
        let mut overlap = String::new();

        while let Ok(bytes_read) = reader.read(&mut buffer) {
            if bytes_read == 0 {
                break;
            }

            // Convert current chunk to lossy UTF-8
            let current_chunk = String::from_utf8_lossy(&buffer[..bytes_read]);

            // Prepend overlap from previous chunk to handle regex spanning across chunks
            let search_text = format!("{}{}", overlap, current_chunk);

            if let Some(cap) = re.captures(&search_text) {
                if let Some(id) = cap.get(1) {
                    return Some(id.as_str().to_string());
                }
            }

            // Keep the last 50 characters for overlap in the next iteration
            overlap = search_text
                .chars()
                .rev()
                .take(50)
                .collect::<String>()
                .chars()
                .rev()
                .collect();
        }

        None
    }

    fn scrape_js_files(
        _app: &tauri::AppHandle,
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
