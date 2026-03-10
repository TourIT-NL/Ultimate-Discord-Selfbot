use std::path::PathBuf;

pub fn get_discord_base_paths() -> Vec<PathBuf> {
    let mut paths = Vec::new();

    #[cfg(target_os = "windows")]
    {
        if let Ok(local_appdata) = std::env::var("LOCALAPPDATA") {
            let appdata_base = PathBuf::from(local_appdata);
            let discord_variants = ["Discord", "DiscordPTB", "DiscordCanary"];

            for variant in &discord_variants {
                let discord_path = appdata_base.join(variant);
                if discord_path.is_dir() {
                    let mut found_app_dir = false;
                    if let Ok(entries) = std::fs::read_dir(&discord_path) {
                        for entry in entries.flatten() {
                            if let Ok(file_type) = entry.file_type() {
                                if file_type.is_dir() {
                                    if let Some(dir_name) = entry.file_name().to_str() {
                                        if dir_name.starts_with("app-") {
                                            paths.push(entry.path());
                                            found_app_dir = true;
                                        }
                                    }
                                }
                            }
                        }
                    }

                    if !found_app_dir {
                        paths.push(discord_path);
                    }
                }
            }
        }
    }

    #[cfg(target_os = "macos")]
    if let Ok(home) = std::env::var("HOME") {
        let base = PathBuf::from(home).join("Library/Application Support");
        paths.push(base.join("Discord"));
        paths.push(base.join("DiscordPTB"));
        paths.push(base.join("DiscordCanary"));
    }

    #[cfg(target_os = "linux")]
    if let Ok(home) = std::env::var("HOME") {
        let base = PathBuf::from(home).join(".config");
        paths.push(base.join("discord"));
        paths.push(base.join("discordptb"));
        paths.push(base.join("discordcanary"));

        // Add flatpak/snap paths if applicable
        let flatpak_path =
            PathBuf::from(home).join(".var/app/com.discordapp.Discord/config/discord");
        if flatpak_path.exists() {
            paths.push(flatpak_path);
        }
        let snap_path = PathBuf::from("/snap/discord/current/usr/share/discord");
        if snap_path.exists() {
            paths.push(snap_path);
        }
    }

    paths.into_iter().filter(|p| p.exists()).collect()
}

pub fn get_discord_data_paths() -> Vec<PathBuf> {
    let mut paths = Vec::new();

    #[cfg(target_os = "windows")]
    if let Ok(appdata) = std::env::var("APPDATA") {
        let appdata_base = PathBuf::from(appdata);
        let discord_variants = ["Discord", "DiscordPTB", "DiscordCanary"];
        for variant in &discord_variants {
            let p = appdata_base.join(variant);
            if p.exists() {
                paths.push(p);
            }
        }
    }

    #[cfg(target_os = "macos")]
    if let Ok(home) = std::env::var("HOME") {
        let base = PathBuf::from(home).join("Library/Application Support");
        paths.push(base.join("discord"));
        paths.push(base.join("discordptb"));
        paths.push(base.join("discordcanary"));
    }

    #[cfg(target_os = "linux")]
    if let Ok(home) = std::env::var("HOME") {
        let base = PathBuf::from(home).join(".config");
        paths.push(base.join("discord"));
        paths.push(base.join("discordptb"));
        paths.push(base.join("discordcanary"));
    }

    paths.into_iter().filter(|p| p.exists()).collect()
}
