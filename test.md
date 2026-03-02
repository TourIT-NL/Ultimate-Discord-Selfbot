# Project Analysis & Recommendations

This document contains a comprehensive list of 50 suggested improvements, 50 new features, and 50 proposed fixes based on a deep analysis of the project's architecture and codebase.

---

## 1. Improvements (50)

### Frontend Refactoring & Architecture

1.  **Break Down `useDiscordAuth.ts`:** Refactor the `useDiscordAuth` "God Hook" into smaller, specific hooks like `useOAuth`, `useQRLogin`, `useTokenLogin`, and `useVaultManager`.
2.  **Break Down `useDiscordOperations.ts`:** Decompose the `useDiscordOperations` "God Hook" into feature-specific hooks such as `useMessageCleaner`, `useGuildManager`, `usePrivacyAuditor`, etc.
3.  **Eliminate Prop-Drilling from `App.tsx`:** Move state management out of `App.tsx` and into Zustand slices. `App.tsx` should primarily handle routing and layout.
4.  **Create a `DashboardLayout` Component:** Abstract the main dashboard view, including the sidebar and operation overlay, into a dedicated `DashboardLayout.tsx` to simplify `App.tsx`.
5.  **Develop a Component Library:** Create a set of small, reusable, and "dumb" components in `src/components/common` that receive props and render UI, without containing business logic.
6.  **Adopt Feature-Based Directory Structure:** Restructure the `src/components` and `src/hooks` directories by feature (e.g., `src/features/bulk-delete`, `src/features/auth`) instead of by type.
7.  **Implement Zustand Slices:** Expand `authStore.ts` into multiple state slices (e.g., `sessionSlice.ts`, `guildsSlice.ts`, `operationSlice.ts`) to manage global state more effectively.
8.  **Centralize API Calls:** Create a dedicated API layer (e.g., `src/api/discord.ts`) that centralizes all `invoke` calls to the Rust backend, rather than spreading them across hooks.
9.  **Replace Prop-Drilled Functions with Zustand Actions:** Functions passed down multiple layers (like `startAction`) should be converted to actions in a relevant Zustand slice.
10. **Introduce a `<SettingsView />` Component:** Create a new view for application-level settings, removing this responsibility from the main dashboard.
11. **Refactor `OperationOverlay.tsx`:** Make this component more generic to handle different types of operations, fed by a global operation state from Zustand.
12. **Create Context-Specific Providers:** For highly localized state, use React Context Providers for specific feature trees instead of relying on a monolithic global state.
13. **Isolate `DeveloperLog`:** The `DeveloperLog` component should be conditionally imported or rendered only in development mode to reduce production bundle size.
14. **Type Guard Utilities:** Create a `src/types/guards.ts` file with user-defined type guards (e.g., `isGuild`, `isChannel`) to improve type safety in mapping and filtering operations.
15. **Generic `ListView` Component:** Develop a reusable `ListView` component for displaying selectable lists of guilds, channels, or users to reduce code duplication.

### Backend & Performance

16. **Use `tokio::task::spawn` for Parallelism:** In the Rust backend, identify independent API calls (e.g., fetching multiple resources) and execute them in parallel using `tokio::task::spawn`.
17. **Refactor `api.rs`:** If `api.rs` is a single large file, break it down into modules that mirror the frontend features (e.g., `api/auth.rs`, `api/cleanup.rs`).
18. **Implement Graceful Shutdown:** Ensure that long-running Rust operations can be gracefully cancelled from the frontend without causing panics or leaving dangling resources.
19. **Connection Pooling for `reqwest`:** If not already done, use a single `reqwest::Client` instance across the backend to leverage connection pooling.
20. **Optimize JSON Serialization:** Evaluate `simd-json` or other high-performance JSON libraries for serialization/deserialization between Rust and JS, as it's a primary bottleneck.
21. **Upgrade `Cargo.toml` Dependencies:** Run `cargo outdated` or a similar tool to identify and upgrade stale dependencies, applying necessary security patches.
22. **Upgrade `package.json` Dependencies:** Use `npm outdated` to find and update frontend dependencies, especially build tools and testing libraries.
23. **Code-Split Frontend Bundles:** Configure Vite to create smaller chunks for different routes/features (`/dashboard`, `/login`) to improve initial load time.
24. **Memoize React Components:** Use `React.memo` for components that are re-rendered frequently with the same props, especially in lists.
25. **Virtualize Large Lists:** For views that may render hundreds of guilds or channels, implement virtualization (e.g., using `tanstack-virtual`) to improve rendering performance.
26. **Optimize Tauri Payload Size:** Ensure that the data being passed from Rust to the frontend is as minimal as possible. Avoid sending unnecessarily large or nested objects.
27. **Cache Static Resources in Tauri:** Configure Tauri to efficiently cache static assets (JS, CSS, images) to speed up subsequent app launches.

### DX, Tooling & CI/CD

28. **Enforce Conventional Commits:** Add a commit message linter (`commitlint`) with `husky` to enforce a standardized commit history.
29. **Automate Dependency Updates:** Configure Dependabot or Renovatebot to automatically create PRs for dependency updates.
30. **Improve GitHub Actions Caching:** Refine the caching steps in `.github/workflows/main.yml` to more effectively cache Rust and Node dependencies between runs.
31. **Add Storybook for Component Development:** Introduce Storybook to develop and document UI components in isolation, improving reusability and testing.
32. **Implement Visual Regression Testing:** Add a visual regression testing tool (e.g., Percy, Chromatic) to the CI pipeline to catch unintended UI changes.
33. **Add `clippy::pedantic` Lints:** For a higher level of code quality, enable the more opinionated `pedantic` and `nursery` clippy lints in `Cargo.toml` and fix the resulting warnings.
34. **Generate a `CODEOWNERS` file:** Create a `CODEOWNERS` file in the `.github` directory to automatically request reviews from the right people for different parts of the codebase.
35. **Refine `vitest.config.ts` for Coverage:** Configure Vitest to enforce a minimum test coverage threshold, failing the build if it's not met.
36. **Automate `CHANGELOG.md` Generation:** Use a tool like `release-drafter` (already present but can be improved) or `standard-version` to automate changelog updates based on conventional commit messages.
37. **Create a `justfile` or `Makefile`:** Add a `justfile` to provide a simple, unified command interface for common development tasks (e.g., `just run`, `just test-all`).
38. **Improve `DeveloperLog` Component:** Enhance the developer log to be a proper in-app console, showing structured logs from both the frontend and backend.
39. **Add a `pre-push` Husky Hook:** Include a `pre-push` hook that runs all tests (Rust and Vitest) to prevent pushing broken code.
40. **Expand `labeler.yml`:** Add more labels to `.github/labeler.yml` for more granular categorization of PRs (e.g., `frontend`, `backend`, `ci`, `docs`).

### Documentation & User Experience

41. **Document All Tauri Commands:** Maintain a markdown document that lists every Tauri command, its arguments, and what it does. This can be auto-generated.
42. **Create an Architectural Decision Record (ADR):** Start an ADRs directory to document key architectural decisions, such as the choice to refactor hooks or adopt Zustand slices.
43. **Improve In-App Onboarding:** Create a multi-step onboarding tour for new users (e.g., using Shepherd.js) that explains the main features.
44. **Add Empty States to UI:** Design and implement "empty state" views for when there are no guilds, channels, or messages to show, guiding the user on what to do next.
45. **Refine Operation Progress:** The `OperationOverlay` should provide more granular progress, such as "Deleting messages in #general (50/1230)" and an ETA.
46. **Add a Global Search/Command Palette:** Implement a command palette (e.g., `cmdk`) to allow users to quickly search for and navigate to any guild, channel, or action.
47. **Improve Accessibility (a11y):** Run an accessibility audit and ensure all components are keyboard-navigable and have proper ARIA attributes.
48. **Create a User-Facing `UserManual.tsx`:** The existing file should be fleshed out to be a comprehensive, searchable in-app guide.
49. **Standardize All Icons:** Ensure all icons used in the application come from a single, consistent library (e.g., Material Icons, Lucide).
50. **Implement Light/Dark Mode:** Use Tailwind CSS's dark mode feature to provide both a light and a dark theme, respecting the user's OS preference.

---

## 2. Added Features (50)

### New Cleanup & Privacy Operations

1.  **Bulk Unfriend:** An operation to remove all friends or select multiple friends to unfriend at once.
2.  **Bulk Close/Leave DMs:** A feature to close all direct message channels or leave all group DMs that the user is a part of.
3.  **Profile Sanitizer:** An operation to clear all personal information from the user's profile (avatar, bio, custom status, pronouns).
4.  **Bulk Unblock Users:** A view to see all blocked users and unblock them in bulk.
5.  **Clear Recent Activity:** A feature to clear recent game activity and other presence data that Discord tracks.
6.  **"Friend Check" Audit:** A privacy audit that lists friends you share no servers with, helping identify old/forgotten connections.
7.  **Bot Permission Audit:** An audit that scans all joined servers and lists bots with potentially dangerous permissions (e.g., Administrator, Kick Members).
8.  **Public Server Audit:** An audit that lists all joined servers marked as "Public" or discoverable.
9.  **Vanity URL Cleaner:** A feature to automatically leave servers that the user was invited to via a vanity URL after a configurable period.
10. **Automated Scheduled Cleanups:** A new section where users can configure jobs to run automatically (e.g., "Delete all messages older than 30 days every Sunday").
11. **Message Content "Redactor":** Instead of deleting, an operation to edit messages in bulk to replace their content with `[REDACTED]` or random text.
12. **Bulk HypeSquad Leave:** A simple one-click feature to leave the HypeSquad program.
13. **Bulk Connection Removal:** An operation to disconnect all linked accounts (Spotify, Steam, etc.) from the user's Discord profile.
14. **Guild Reordering/Folder Manager:** A UI to programmatically re-order the user's server list and manage server folders.
15. **Status History Cleaner:** An operation to clear the custom status history.

### Data & Reporting

16. **Data Export Expansion:** Allow exporting scraped data (messages, guild list, etc.) to formats other than JSON, such as CSV or HTML.
17. **Selective Data Export:** Allow users to select specific servers or channels to include in a data export.
18. **"Privacy Score" Dashboard:** A dashboard widget that calculates a "Privacy Score" based on the number of public servers, risky bots, exposed info, etc.
19. **Operation History & Log:** A persistent, filterable log of all past operations performed by the tool, their status, and how many items were affected.
20. **Visualize Scraped Data:** Add a feature to generate charts and graphs from scraped data, like a heatmap of message activity per channel.
21. **GDPR Package Inspector:** A tool to load and parse Discord's GDPR data package, presenting it in a readable, searchable format.
22. **Generate Report Before Deletion:** Add an option to "Generate a report of what will be deleted" before running a bulk delete operation.
23. **Compare Snapshots:** A feature to take a "snapshot" of the account state (servers, friends, etc.) and compare it with a later snapshot to see what has changed.

### UI & UX Features

24. **Multi-Account Support:** Allow users to securely log into and switch between multiple Discord accounts within the app, with separate vaults for each.
25. **"Whitelist" for Operations:** For all bulk operations (leave server, unfriend), provide a "whitelist" mode where the user selects items to _keep_ rather than items to _remove_.
26. **Advanced Filtering:** For any list (guilds, channels, friends), add an advanced filtering input (e.g., `has_role:Admin`, `member_count:>1000`).
27. **Operation Templates:** Allow users to save the configuration for a complex operation (e.g., selected channels, date range) as a template to quickly run it again later.
28. **Real-time Event Log:** A live-scrolling log on the dashboard that shows low-level events as they happen (e.g., "Rate limit hit, sleeping for 5s," "Fetching user data...").
29. **Application Settings Page:** A dedicated settings page for configuring app behavior (e.g., theme, log level, default date ranges, rate limit aggressiveness).
30. **"Incognito Mode":** A mode that temporarily stops the app from recording any operation history.
31. **"Simulation Mode" (Dry Run):** Add a "Dry Run" checkbox to all destructive operations. When checked, the tool will simulate the entire process and produce a log of what it _would_ have done, without making any actual API calls.
32. **Confirmation Timeout:** For critical operations, make the final confirmation button disabled for 3-5 seconds to prevent accidental clicks.
33. **Searchable In-App Docs:** Make the `UserManual.tsx` content searchable.
34. **Interactive Walkthroughs:** For complex features, add interactive, step-by-step walkthroughs that guide the user through the process.
35. **Keyboard Shortcuts:** Assign keyboard shortcuts to common actions (e.g., `Ctrl+F` to focus search, `Ctrl+Enter` to start an operation).
36. **Internationalization (i18n):** Add support for multiple languages using a library like `i18next`.

### Security & Backend Features

37. **2FA/MFA Requirement Check:** An audit that checks which of the user's joined servers with moderation capabilities do _not_ require 2FA for moderators.
38. **Automatic Token Revocation on Logout:** When a user logs out, automatically revoke the Discord refresh token via the API.
39. **Vault Export/Import:** Allow users to export their encrypted vault to a file (e.g., for backup) and import it on another machine.
40. **Credential Rotation Prompt:** If a token has been stored for a long time (e.g., > 90 days), prompt the user to log out and back in to rotate their credentials.
41. **Self-Hostable Backend Endpoint:** For advanced users, add the ability to configure the app to talk to a self-hosted instance of the backend logic instead of just local Tauri commands.
42. **Webhook Notifications:** Allow users to configure a webhook URL to receive notifications when a long-running operation is completed.
43. **Emergency Lockdown:** A one-click button that performs a series of quick, critical privacy actions: leave all public servers, DMs with non-friends, and sanitize the profile.
44. **Plugin System:** Design a simple plugin system where users can write their own cleanup/audit scripts (e.g., in JavaScript or Lua).
45. **Auto-Update Feature:** Implement Tauri's built-in auto-updater to allow the application to update itself seamlessly.
46. **gRPC for Backend Communication:** Explore using gRPC instead of JSON-based Tauri commands for more efficient and strongly-typed communication between frontend and backend.
47. **Full-Text Search Indexing:** For scraped messages, build a local full-text search index (e.g., using `tantivy` in Rust) to allow for instant message searching.
48. **"Panic" Button / Key Combination:** A global keyboard shortcut that immediately cancels any running operation and locks the application.
49. **Discord Gateway Integration:** Connect to the Discord Gateway WebSocket to receive real-time events (e.g., new messages, guild joins) and update the UI without needing to re-fetch.
50. **Account Disablement/Deletion Initiator:** A feature that guides the user through the initial steps of disabling or deleting their Discord account, linking them to the correct pages.

---

## 3. Proposed Fixes & Missing Tests (50)

### Potential Bug Fixes

1.  **Race Condition in `checkVaultLock`:** The initial check for the vault's lock status could be prone to a race condition. Ensure all subsequent auth logic properly awaits the result of the initial check.
2.  **Fix: Unhandled API Errors:** Ensure that every `invoke` call has a `.catch()` block that properly handles `AppError` and displays a user-friendly message.
3.  **Fix: State Desync on Operation Failure:** If a multi-part operation fails midway, the UI state might not accurately reflect the partial changes. Implement transactional state updates or re-sync state on failure.
4.  **Fix: Incorrect Rate Limit Handling:** A bug may exist where a 429 response on one API endpoint doesn't properly pause requests to other endpoints, violating Discord's global rate limit. The actor model should handle this, but it needs verification.
5.  **Fix: Zombie Processes on Cancellation:** When a user cancels an operation, ensure the corresponding Rust async task is properly aborted and doesn't continue running in the background.
6.  **Fix: Memory Leak in `OperationOverlay`:** The log list in the operation overlay can grow infinitely. Implement virtualization or cap the number of log lines to prevent a memory leak.
7.  **Fix: UI Freeze During Heavy Computation:** Any heavy synchronous computation on the frontend (e.g., processing a large list) should be moved to a Web Worker to avoid freezing the UI thread.
8.  **Fix: Inconsistent Disabled States:** Buttons that trigger actions should be disabled immediately on click (`isSubmitting`) to prevent duplicate requests. This needs to be applied consistently.
9.  **Fix: Auth State Flash on Load:** On app start, there might be a flash of the "Login" screen before the app determines the user is already authenticated. Fix this with a dedicated "Loading" or splash screen.
10. **Fix: `AppError` `technical_details` Leakage:** Ensure that the `technical_details` field of the `AppError` struct is only ever displayed in a developer-only log and never in a standard user-facing error message.
11. **Fix: Incorrect Date Range Calculation for "All Time":** Ensure that setting "All Time" for deletion uses the user's account creation date as the start, not a fixed old date.
12. **Fix: Off-by-One Errors in Pagination:** When fetching paginated resources from Discord, double-check the `before`/`after` logic to prevent off-by-one errors that could miss or re-process items.
13. **Fix: Hardcoded URLs:** Search the codebase for any hardcoded Discord API URLs and replace them with constants managed in a central configuration file.
14. **Fix: Inadequate Sanitization of User Input:** All user-provided input (e.g., tokens, keywords) should be sanitized on the backend to prevent potential injection attacks, even if unlikely in Tauri.
15. **Fix: App Crash on Unexpected Log Out:** If the user's token is invalidated remotely, the next API call will fail. This should be caught globally and trigger a graceful logout instead of a crash.

### Missing Test Cases

16. **Fix: Add test for OAuth failure during code exchange.**
17. **Fix: Add test for QR code login flow timeout.**
18. **Fix: Add unit test for vault encryption/decryption logic.**
19. **Fix: Add test for handling an invalid master password on unlock.**
20. **Fix: Add test case for a destructive operation (`NuclearWipe`) where the user types the confirmation word incorrectly.**
21. **Fix: Add test for starting a new operation while another is already in progress.**
22. **Fix: Add integration test for the rate-limiting actor, simulating 429 responses.**
23. **Fix: Add test for bulk deleting messages from an already deleted or inaccessible channel.**
24. **Fix: Add test for leaving a server that the user has already been kicked from.**
25. **Fix: Add test to verify component behavior when `fetchGuilds` returns an empty array.**
26. **Fix: Add Vitest component test for `ErrorOverlay` to ensure it renders `user_message` correctly.**
27. **Fix: Add test for date range filtering logic in message deletion.**
28. **Fix: Add test to ensure the `RateLimitInfo` struct is updated correctly after each simulated response.**
29. **Fix: Add test for the `open_discord_url_for_action` command to ensure it constructs URLs correctly.**
30. **Fix: Add test to simulate a user cancelling the OAuth flow in their browser.**
31. **Fix: Add test for concurrent access to the Zustand `authStore`.**
32. **Fix: Add test for parsing various formats of `X-RateLimit-*` headers.**
33. **Fix: Add unit test for the `AppError` serialization to ensure `technical_details` is omitted when `None`.**
34. **Fix: Add test for multi-select logic in the `useSelectionState` hook.**
35. **Fix: Add test for handling a `null` or `undefined` guild list gracefully in the UI.**
36. **Fix: Add component test for the `Sidebar` to ensure it correctly reflects the selected guilds/channels.**
37. **Fix: Add test for Rust backend logic when receiving a channel list containing duplicates.**
38. **Fix: Add test for frontend state update when `auth_success` event is received from backend.**
39. **Fix: Add test case where the local server for OAuth callback fails to start.**
40. **Fix: Add test to ensure the local OAuth server shuts down immediately after receiving the callback.**
41. **Fix: Add test for handling invalid data from the OS keychain.**
42. **Fix: Add test for message deletion in a DM with a user who has blocked you.**
43. **Fix: Add test for the "select all" and "deselect all" functionality in a list view.**
44. **Fix: Add test for the UI's behavior when the backend emits progress events during an operation.**
45. **Fix: Add a test case for a very long channel list to check for UI performance regressions.**
46. **Fix: Add test for `useOperationControl` hook's state transitions (idle -> running -> completed/failed).**
47. **Fix: Add mock test for `tauri::api::shell::open` to verify it's called with the correct URL.**

### 4.2. Vault Subsystem (`src-tauri/src/core/vault`)

The Vault subsystem is the secure storage and management core of the application, responsible for handling sensitive data like Discord user identities, authentication tokens, and application credentials (client IDs/secrets). It employs a multi-layered security model combining OS-level keyrings with encrypted disk fallbacks, protected by an optional master password.

#### **File: `mod.rs`**

- **Purpose**: Acts as the public interface (facade) for the entire Vault subsystem, delegating calls to specialized managers for identities, credentials, and encryption/fallback mechanisms.
- **Logic Flow**: Simplifies interaction with the Vault by exposing high-level functions like `save_identity`, `get_credential`, and `clear_all_data`.
- **Architectural Impact**: Enhances modularity and abstraction within the Vault. Centralizes access points to secure storage operations.
- **Call Sites**: `auth::identity.rs` (for saving/retrieving identities and tokens), `auth::oauth.rs` (for client ID/secret), `auth::rpc.rs` (for client ID/secret), `forensics::auditor.rs` (for client ID), and `core::vault::commands.rs` (Tauri commands).
- **Dependency Graph**: Directly imports and re-exports components of its submodules (`identity`, `credential`, `encryption`, `fallback`, `state`).

#### **File: `identity.rs`**

- **Purpose**: Manages the persistent storage and retrieval of Discord user identities (`DiscordIdentity` struct).
- **Logic Flow**: Stores encrypted identity data using system keyrings (primary) and disk fallback (secondary). Manages a global `identity_index` to list multiple accounts.
- **Architectural Impact**: Critical for multi-account support and persistent user sessions. Employs strong security practices by encrypting identity data before storage.
- **Call Sites**: `Vault` (via `mod.rs`), `auth::identity.rs` (internally for token validation and emission).
- **Dependency Graph**: Depends on `keyring` crate for OS-level secure storage, `serde` for serialization, `AppError`, `Logger`, and `super::fallback::FallbackManager`.

#### **File: `credential.rs`**

- **Purpose**: Manages generic application credentials (e.g., `client_id`, `client_secret`, `proxy_url`).
- **Logic Flow**: Similar to `identity.rs`, it uses the OS keyring first and then an encrypted disk fallback for storage. Provides `set_credential`, `get_credential`, and `remove_credential` methods.
- **Architectural Impact**: Enables secure and persistent storage for application-specific secrets separate from user identity data. Robust error handling for missing credentials.
- **Call Sites**: `Vault` (via `mod.rs`), `auth::oauth.rs`, `auth::rpc.rs`, `auth::identity.rs`, `forensics::auditor.rs`.
- **Dependency Graph**: Depends on `keyring` crate, `AppError`, `Logger`, and `super::fallback::FallbackManager`.

#### **File: `encryption.rs`**

- **Purpose**: Manages the application's encryption keys and integrates an optional master password.
- **Logic Flow**: Handles `get_or_create_encryption_key` (from memory, keyring, or generating new), `has_master_password`, `set_master_password` (which re-encrypts the vault key with Argon2id-derived keys), and `unlock_vault` (verifies master password and decrypts the vault key).
- **Architectural Impact**: Implements a multi-layered security model. Centralizes encryption key management and master password protection for the entire Vault.
- **Call Sites**: `super::fallback::FallbackManager` (to get/set encryption key), `core::vault::commands.rs` (Tauri commands for vault lock/unlock/master password).
- **Dependency Graph**: Depends on `keyring` crate, `Crypto` module (for hashing/encryption), `AppError`, `Logger`, `VaultState` (for in-memory key caching), and `super::fallback::FallbackManager`.

#### **File: `fallback.rs`**

- **Purpose**: Provides an encrypted disk-based fallback storage mechanism for when the OS keyring is unavailable or fails.
- **Logic Flow**: `get_fallback_path` (resolves path in `app_local_data_dir`), `write_fallback` (encrypts and writes to disk), `read_fallback` (reads and decrypts from disk), `delete_fallback` (removes from disk). Uses `EncryptionManager` to get the key and `Crypto` for encryption.
- **Architectural Impact**: Enhances resilience by providing an alternative secure storage layer. Ensures data is always encrypted at rest.
- **Call Sites**: `IdentityManager`, `CredentialManager`, `EncryptionManager` (indirectly through Keyring failures).
- **Dependency Graph**: Depends on `std::fs`, `std::path::PathBuf`, `AppError`, `Logger`, `crate::core::crypto::Crypto`, and `super::encryption::EncryptionManager`.

#### **File: `state.rs`**

- **Purpose**: Defines `VaultState`, a Tauri-managed state struct to hold the in-memory encryption key.
- **Logic Flow**: Simply holds a `Mutex<Option<Zeroizing<String>>>` for the encryption key. `Zeroizing` ensures secure memory handling.
- **Architectural Impact**: Crucial for performance (avoiding repeated decryption) and security (sensitive key in memory is `zeroize`d).
- **Call Sites**: `EncryptionManager` (to store/retrieve the key).
- **Dependency Graph**: Depends on `tokio::sync::Mutex`, `zeroize::Zeroizing`.

#### **File: `commands.rs`**

- **Purpose**: Exposes Tauri commands for Vault management, allowing frontend interaction with the secure storage.
- **Logic Flow**: Wraps `EncryptionManager` functions like `is_vault_locked`, `has_master_password`, `set_master_password`, `unlock_vault`, and the newly added `set_client_id_credential`.
- **Architectural Impact**: Provides a secure and controlled API for the frontend to interact with the Vault.
- **Call Sites**: Frontend (`useDiscordAuth.ts` and potentially Setup/Unlock views).
- **Dependency Graph**: Depends on `AppHandle`, `State`, `AppError`, `Logger`, `EncryptionManager`, and `VaultState`.

#### **Overall Module Cohesion & Logic Integrity for `src-tauri/src/core/vault`:**

- **Cohesion:** High. Each file within `vault` has a clear, specialized role, contributing to the overall secure storage functionality.
- **Logic Integrity:** Sound. The logic implements a robust security model with OS-keyring primary storage, encrypted disk fallback, master password protection (Argon2id, AES-GCM), and `zeroize` for memory safety.
- **External Reference Accuracy:** Correctly uses `keyring` crate for OS integration and internal `Crypto` module for cryptographic operations.
- **Dependency Management:** Dependencies are well-managed and appropriate for secure operations.
- **Data Flow Consistency:** Data (identities, credentials, keys) flows securely through the system, always encrypted when stored persistently. `AppError` is consistently used for error reporting.
- **Security Implementation:** Excellent. Multi-backend storage, encryption at rest, optional master password with strong hashing/derivation, in-memory zeroization.
- **Scalability:** The design supports multiple identities and credentials without inherent bottlenecks, though performance of underlying keyring/filesystem operations could be a factor with very large numbers of entries.

---

---

## 4. Deep Project Analysis (Incremental)

### 4.1. Authentication Subsystem (`src-tauri/src/auth`)

This subsystem is the entry point for the application, handling all aspects of Discord authentication through multiple strategies.

#### **File: `identity.rs`**

- **Purpose**: Core identity and session manager. Handles token validation and persistence.
- **Logic Flow**: `login_with_token_internal` -> `validate_token` (Structural Regex -> API Check) -> `Vault` Storage -> Emit `auth_success`.
- **Architectural Impact**: Acts as the gatekeeper. Implements structural and network-level token validation. Supports multi-account switching.
- **Call Sites**:
  - Internal: Finalizes flows in `oauth.rs`, `rpc.rs`, `qr.rs`.
  - Frontend: `list_identities`, `logout`, `login_with_user_token`, `save_discord_credentials`, `switch_identity`.
- **Dependency Graph**: Relies on `Vault` for storage, `ApiHandle` for requests, and `AppError` for standardized failures.

#### **File: `oauth.rs`**

- **Purpose**: Implements the official Discord OAuth2 flow with PKCE.
- **Logic Flow**: Start Local Server -> Open Browser -> Await Code -> Exchange for Token -> Call `identity.rs`.
- **Architectural Impact**: The most secure login method. Self-contained via temporary local HTTP server and dynamic port range fallback (58123-58129).
- **Call Sites**: Frontend `start_oauth_flow`.
- **Dependency Graph**: Uses `oauth2` crate, `socket2` for low-level networking, and `identity.rs` for finalization.

#### **File: `rpc.rs`**

- **Purpose**: "Instant Link" strategy. Combines on-disk token forensics with a local RPC handshake.
- **Logic Flow**: Try Token Forensics -> (if fail) Connect to Discord Client RPC (Ports 6463-6472) -> Handshake -> Exchange Code -> Call `identity.rs`.
- **Architectural Impact**: High-convenience but fragile. Heavily dependent on the local environment and client process state.
- **Call Sites**: Frontend `login_with_rpc`.
- **Dependency Graph**: Relies on `SessionAuditor` for forensics and `tokio_tungstenite` for RPC WebSocket communication.

#### **File: `qr.rs`**

- **Purpose**: Discord QR code login flow.
- **Logic Flow**: WS Handshake -> RSA Key Exchange -> Emit QR URL -> User Scans -> Decrypt Token -> Call `identity.rs`.
- **Architectural Impact**: Sophisticated implementation of an undocumented protocol. Uses `FingerprintManager` to generate realistic headers to prevent gateway blocking.
- **Call Sites**: Frontend `start_qr_login_flow`.
- **Dependency Graph**: Low-level crypto (`rsa`, `sha2`) and `tokio_tungstenite`.

#### **File: `status.rs`**

- **Purpose**: Diagnostic tool for Discord's local presence.
- **Logic Flow**: Process Scan (`sysinfo`) -> Port Probing -> `client_id` Extrapolation Test.
- **Architectural Impact**: Provides environmental awareness to the frontend, enabling proactive UI states (e.g., disabling RPC login if client not found).
- **Call Sites**: Frontend `check_discord_status`.

#### **File: `state.rs`, `status.rs`, `types.rs`, `mod.rs`**

- **Purpose**: Infrastructure and definitions.
- **Structural Context**: `state.rs` provides the `AuthState` Tauri state. `types.rs` defines the `DiscordUser` model and an exhaustive `DiscordError` mapping for high-fidelity error reporting.
  \*\*
