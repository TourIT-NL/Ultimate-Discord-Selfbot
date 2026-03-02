use std::path::PathBuf;

pub fn get_discord_base_paths() -> Vec<PathBuf> {
    let mut paths = Vec::new();

    #[cfg(target_os = "windows")]
    {
        if let Ok(local_appdata) = std::env::var("LOCALAPPDATA") {
            let base = PathBuf::from(local_appdata);
            paths.push(base.join("Discord"));
            paths.push(base.join("DiscordPTB"));
            paths.push(base.join("DiscordCanary"));
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
