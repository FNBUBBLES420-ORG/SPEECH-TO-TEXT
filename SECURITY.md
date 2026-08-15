# Security Policy

## Supported Versions

Security fixes are provided for the current major release line.

| Version | Supported |
| --- | --- |
| 2.x | Yes |
| 1.x and older Python/CustomTkinter builds | No |

The legacy Python application has been replaced by the Electron application and is no longer supported.

## Reporting a Vulnerability

Please report security vulnerabilities privately through the GitHub repository security reporting process:

https://github.com/FNBUBBLES420-ORG/SPEECH-TO-TEXT/security/advisories

Do not post vulnerability details in public issues, discussions, pull requests, screenshots, or social media.

Include as much of the following as possible:

- Application version
- Operating system version
- Installer filename or release tag
- Steps to reproduce
- Expected result
- Actual result
- Security impact
- Whether microphone, transcript, model, update, installer, or filesystem behavior is involved
- Logs or screenshots with private transcript/audio data removed

## Response Expectations

The maintainers aim to:

- Acknowledge valid reports within 7 days.
- Triage severity and reproducibility as soon as practical.
- Provide a fix or mitigation plan for confirmed issues.
- Publish security notes in release documentation when appropriate.

Response times may vary for complex issues or reports that require local hardware, microphone, OBS, or Windows installer verification.

## Security Scope

Security-sensitive areas include:

- Electron main/preload/renderer isolation
- IPC validation
- File path validation
- Transcript storage
- Settings storage and import/export
- Model downloads
- Manual update checks and downloads
- Installer and uninstaller behavior
- Registry key creation and cleanup
- Microphone permission handling
- OBS text-file output
- Caption window click-through behavior
- Local logs and diagnostics

## Out Of Scope

The following are usually not treated as security vulnerabilities by themselves:

- General feature requests
- UI/UX preferences
- Missing translations
- Inaccurate transcription output from a local model
- User-selected writable file paths behaving as selected
- Issues caused by modified source code or unofficial builds
- Vulnerabilities in unsupported 1.x or older Python builds
- Reports that require automatic updates, telemetry, or cloud upload to exist

## Privacy And Data Handling

The application is designed to be local-first.

Default behavior:

- No telemetry
- No analytics
- No advertising
- No tracking
- No profiling
- No automatic cloud upload
- No transcript upload
- No automatic update checks at startup
- No background update downloads
- No silent update installation

Microphone access is used only after the user starts listening. Raw microphone audio is not intentionally logged.

Transcripts, settings, logs, models, and backups are stored locally in the user’s Windows application data locations unless the user explicitly exports or shares them.

## Manual Update Security

Updates are manual by design.

The application may check GitHub Releases only after the user clicks **Check for updates**. If a newer release is found, the user may choose to download an installer asset. Downloaded installers are saved to the user’s Downloads folder. The application does not silently run installers or restart itself for updates.

The app validates trusted GitHub release URLs and expected Windows installer file types before downloading or opening update installers.

Do not add:

- `electron-updater`
- Electron `autoUpdater`
- Background update services
- Scheduled update checks
- Silent installer execution
- Forced restarts

## Electron Security Requirements

The application should continue to follow these rules:

- `contextIsolation: true`
- `nodeIntegration: false`
- Sandboxed renderer where practical
- Preload-only renderer API exposure
- Never expose `ipcRenderer` directly
- Validate IPC arguments
- Validate filesystem paths
- Use native dialogs for user-selected files
- Block unexpected navigation
- Validate external URLs before opening them
- Do not use the remote module
- Do not use `eval()`
- Do not expose unrestricted Node.js APIs to renderer code
- Do not store secrets in source code

## Installer Security Requirements

The Windows installer is configured for current-user installation under LocalAppData.

Expected behavior:

- Install under `%LOCALAPPDATA%\Programs\Speech-to-Text Application`
- Create HKCU registry metadata for the current user
- Remove the app registry key during uninstall
- Remove the install directory during uninstall
- Do not install update services
- Do not create scheduled update tasks
- Do not require Node.js to be installed by the end user

## Dependency Security

Use current supported dependency versions where possible.

Before release:

```powershell
npm install
npm run lint
npm test
npm audit
npm run build
```

Address reasonable dependency vulnerabilities before publishing releases.

## Safe Use Statement

This application is for accessibility, live transcription, captions, OBS/Streamlabs text output, meetings, classes, streaming, and everyday speech-to-text.

It must not be used to:

- Inject into games
- Read or modify game memory
- Bypass anti-cheat systems
- Interfere with other applications
- Secretly record or upload audio

## Disclosure

Please give maintainers reasonable time to investigate and release a fix before public disclosure. Coordinated disclosure helps protect end users.
