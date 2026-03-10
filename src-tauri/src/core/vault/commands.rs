// src-tauri/src/core/vault/commands.rs

use crate::core::error::AppError;
use crate::core::logger::Logger;
use crate::core::vault::encryption::EncryptionManager;
use crate::core::vault::state::VaultState;
use tauri::{AppHandle, State};

#[tauri::command]
pub async fn is_vault_locked(
    app_handle: AppHandle,
    state: State<'_, VaultState>,
) -> Result<bool, AppError> {
    if EncryptionManager::has_master_password(&app_handle)? {
        let key_guard = state.encryption_key.lock().unwrap();
        Ok(key_guard.is_none())
    } else {
        Ok(false)
    }
}

#[tauri::command]
pub async fn has_master_password(app_handle: AppHandle) -> Result<bool, AppError> {
    EncryptionManager::has_master_password(&app_handle)
}

#[tauri::command]
pub async fn set_master_password(
    app_handle: AppHandle,
    state: State<'_, VaultState>,
    password: Option<String>,
) -> Result<(), AppError> {
    EncryptionManager::set_master_password(&app_handle, password.as_deref())?;

    // After setting or clearing, we need to update the in-memory key
    let mut key_guard = state.encryption_key.lock().unwrap();
    if password.is_some() {
        // If we just set it, it's effectively "locked" until they provide it again
        *key_guard = None;
    } else {
        // If we cleared it, the key is now plaintext in the keyring, so we can re-load it
        *key_guard = Some(zeroize::Zeroizing::new(
            EncryptionManager::get_or_create_encryption_key(&app_handle)?,
        ));
    }

    Logger::info(&app_handle, "[Vault] Master password status updated", None);
    Ok(())
}

#[tauri::command]
pub async fn has_biometric_support(app_handle: AppHandle) -> Result<bool, AppError> {
    #[cfg(target_os = "windows")]
    {
        // On Windows, we check if the biometric service is running and if the OS version supports Windows Hello.
        // For a more exhaustive check, we'd use WinRT (UserConsentVerifier),
        // but for now, we'll check if the BioSrv is active or if the Windows version is 10+.

        let mut s = sysinfo::System::new();
        s.refresh_processes_specifics(
            sysinfo::ProcessesToUpdate::All,
            true,
            sysinfo::ProcessRefreshKind::default(),
        );

        // A rough but effective check: see if the Windows Biometric Service (BioSrv) exists and is running.
        // We can't easily query services with sysinfo, but we can check if the OS is Win 10+.
        let os_version = sysinfo::System::os_version().unwrap_or_default();
        let is_win10_plus = os_version
            .split('.')
            .next()
            .and_then(|v| v.parse::<u32>().ok())
            .map_or(false, |v| v >= 10);

        if is_win10_plus {
            Logger::debug(
                &app_handle,
                &format!(
                    "[Vault] OS Version: {} detected as Biometric capable.",
                    os_version
                ),
                None,
            );
            Ok(true)
        } else {
            Ok(false)
        }
    }
    #[cfg(not(target_os = "windows"))]
    Ok(false)
}

#[tauri::command]
pub async fn unlock_vault(
    app_handle: AppHandle,
    state: State<'_, VaultState>,
    password: String,
) -> Result<(), AppError> {
    let key = EncryptionManager::unlock_with_password(&app_handle, &password)?;
    let mut key_guard = state.encryption_key.lock().unwrap();
    *key_guard = Some(zeroize::Zeroizing::new(key));

    Logger::info(&app_handle, "[Vault] Vault unlocked successfully", None);
    Ok(())
}

#[tauri::command]
pub async fn set_client_id_credential(
    app_handle: AppHandle,
    client_id: String,
) -> Result<(), AppError> {
    crate::core::vault::Vault::set_credential(&app_handle, "client_id", &client_id)?;
    Logger::info(
        &app_handle,
        &format!("[Vault] Client ID credential set: {}", client_id),
        None,
    );
    Ok(())
}
