# Changelog

## 2.0.0

### Added

- Rebuilt the legacy Python/CustomTkinter prototype as a modern Electron + JavaScript desktop application.
- Added secure Electron architecture with isolated renderer, preload bridge, explicit IPC APIs, and sandboxed renderer settings.
- Added a redesigned desktop control-center UI with sidebar navigation, custom title bar, operational dashboard, readiness states, workflow panels, and improved spacing.
- Added generated Windows icon assets for desktop, taskbar, title bar, tray, installer, and uninstaller.
- Added Live Transcription workspace with start, pause, resume, stop, clear, copy, save, and export controls.
- Added local Whisper transcription architecture using `@fugood/whisper.node`.
- Added microphone capture using 16 kHz PCM audio with voice activity detection.
- Added Model Manager with model catalog, download progress, cancel, remove, default model selection, app-data storage, and size verification.
- Added transcript storage in user app data with metadata, open, rename, delete, copy, save, search, and export support.
- Added transcript export formats: TXT, SRT, VTT, and JSON.
- Added OBS / Streaming support with safe live text-file output.
- Added caption window with always-on-top, click-through, opacity, font size, alignment, background, maximum lines, monitor selection, and window bounds persistence.
- Added accessibility controls for high contrast, reduced motion, transcript font size, interface scaling, and large controls.
- Added configurable global shortcuts and a system tray menu.
- Added explicit Exit button and quit IPC path so users can fully close the application.
- Added structured local logging and diagnostics.
- Added first-run setup wizard.
- Added manual update checking from official GitHub Releases.
- Added manual update downloads from the newest available release tag after explicit user action.
- Added support for release installer assets named like `V201-Speech-To-Text*.exe` or `.msi`.
- Added settings save state in user app data so preferences survive normal application updates.
- Added automatic `settings.backup.json` backup and startup restore fallback.
- Added Settings controls to save settings now, export a settings backup, and import a settings backup.
- Added Windows NSIS installer configuration for current-user LocalAppData installation.
- Added HKCU registry key creation and uninstall cleanup.
- Added installer agreement prompt text for the user-facing “I Agree” installation step.
- Added ESLint, Prettier, Vitest, npm scripts, and GitHub Actions CI.
- Added tests for settings validation, settings save-state, transcript storage, export generation, path validation, IPC validation, model metadata, audio/VAD helpers, manual update version comparison, trusted release URL validation, newest release tag selection, and update asset selection.

### Fixed

- Fixed Electron startup when `ELECTRON_RUN_AS_NODE=1` is set by clearing it only for the child Electron process.
- Fixed app close behavior by adding a real full-exit path instead of only minimizing to tray.
- Fixed tray Settings behavior so it restores and focuses the main window before navigating.
- Fixed installer uninstall behavior so the HKCU registry key and install directory are removed during uninstall.
- Fixed installer LocalAppData behavior by forcing current-user install mode.
- Fixed the previous placeholder UI that looked generated and sparse.
- Fixed update checks so they scan the newest available version tag rather than relying only on GitHub’s `/latest` endpoint.
- Fixed update download safety by validating trusted GitHub release URLs and installer file types.
- Fixed manual update checks to use the new official `FNBUBBLES420-ORG/SPEECH-TO-TEXT` release source.
- Fixed manual update error text so private, missing, or unpublished releases show a clear message instead of the raw Electron IPC error.
- Fixed settings resilience by backing up settings and restoring them if the main store is missing.
- Fixed local transcription audio handling by sending raw PCM samples instead of mislabeled recorded blobs.
- Fixed live microphone capture by loading the renderer audio worklet from the correct packaged path.
- Fixed Start Listening so microphone capture only begins after the local transcription backend is ready, with cleanup if startup fails.
- Fixed path validation to use directory containment checks instead of unsafe string-prefix checks.

### Updated

- Updated README documentation for privacy, local transcription, OBS integration, manual update downloads, settings persistence, installer behavior, and development workflow.
- Updated `to-do.txt` into an honest implementation and verification checklist.
- Updated installer resources with application icons and installation agreement text.
- Updated the Windows installer to show the NSIS live details area, progress bar, setup step messages, and a user choice for launching the app after setup finishes.
- Updated Windows build scripts to patch electron-builder's NSIS install section so file extraction details are printed during installation instead of leaving the details area blank.
- Updated app packaging to include generated icon assets and `build/installer.nsh`.
- Updated the manual update flow so downloads are still user-initiated, but the app can save the selected installer to Downloads and let the user run it manually.
- Updated Settings UI with persistent save/export/import controls.
- Updated diagnostics and storage documentation to clarify that user settings live outside the application install directory.

### Removed

- Removed obsolete Python GUI files.
- Removed obsolete Python dependency files.
- Removed obsolete batch setup scripts.
- Removed checked-in temporary transcription output.
- Removed the legacy Google speech-recognition default path.

### Verified

- `npm install` completed with current dependency ranges.
- `npm.cmd run lint` passed.
- `npm.cmd test` passed.
- `npm.cmd run build` passed.
- Silent installer verification passed for LocalAppData installation, HKCU registry key creation, uninstaller presence, registry cleanup, and install-directory cleanup.
