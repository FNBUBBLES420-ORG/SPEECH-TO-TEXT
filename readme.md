# Speech-to-Text Application

Privacy-focused live transcription and captioning for Windows.

Speech-to-Text Application is a modern Electron desktop app for local-first speech-to-text, live captions, transcript management, and OBS/Streamlabs caption output. It is designed for deaf and hard-of-hearing users, accessibility needs, streamers, gamers, content creators, meetings, classes, presentations, and everyday transcription.

## Features

- Live transcription workspace with start, pause, resume, stop, clear, copy, save, and export controls.
- Local Whisper-based transcription architecture using `@fugood/whisper.node`.
- Voice activity detection to reduce unnecessary processing during silence.
- Microphone selection, refresh, microphone test, live audio meter, sensitivity, and reconnect settings.
- Transcript library with local metadata, open, rename, search, delete, copy, save, and export.
- Export formats: TXT, SRT, VTT, and JSON.
- OBS/Streamlabs live text-file output.
- Optional caption window for OBS Window Capture, second monitors, presentations, and accessibility displays.
- Caption controls for font size, alignment, background, opacity, max lines, monitor selection, always-on-top, and click-through.
- Accessibility settings for high contrast, reduced motion, large controls, interface scale, and transcript font size.
- Dark, light, and system theme modes.
- Configurable global shortcuts.
- System tray menu.
- Manual update checks and manual installer downloads from GitHub Releases.
- Settings save-state with local backup, export, and import.
- Local diagnostics and logs.

## How To Use

### First Run

1. Open the application.
2. Review the first-run setup wizard.
3. Go to **Models** and download a Whisper model.
4. Go to **Audio** and select or test your microphone.
5. Go to **Live Transcription** and click **Start Listening**.

### Live Transcription

1. Open **Live Transcription**.
2. Click **Start Listening**.
3. Speak into the selected microphone.
4. Use **Pause**, **Resume**, or **Stop** as needed.
5. Use **Copy**, **Save**, or **Export** for transcript text.

### Transcripts

Open **Transcripts** to manage saved transcript records.

Available actions:

- Open
- Rename
- Search
- Delete
- Copy
- Export

Delete actions require confirmation.

### OBS / Streaming

1. Open **OBS / Streaming**.
2. Choose a live caption text-file output location.
3. In OBS or Streamlabs, add that file as a Text Source.
4. Start transcription.

The application updates the text file safely so OBS can read it.

### Caption Window

Use the caption window for OBS Window Capture, second monitors, accessibility displays, or live presentations.

Caption window options include:

- Always on top
- Click-through
- Font size
- Text alignment
- Background color
- Opacity
- Maximum displayed lines
- Monitor selection
- Saved window position and size

### Manual Updates

Updates are manual by design.

The app does not:

- Check for updates at startup
- Download updates in the background
- Install updates silently
- Restart itself for updates
- Install an update service
- Create scheduled update tasks

To update:

1. Open **Settings**.
2. Click **Check for updates**.
3. The app checks the newest available GitHub release tag.
4. If a newer installer such as `V201-Speech-To-Text*.exe` is available, click **Download update**.
5. The installer is saved to Downloads.
6. Run the installer yourself and complete the normal Windows prompts.

### Saving Settings

Settings are saved on the user’s PC under the Windows app-data folder. Normal application updates keep these settings.

In **Settings > Privacy and storage**, users can:

- Save settings now
- Export settings backup
- Import settings backup

The app also maintains a local `settings.backup.json` file.

## Keyboard Shortcuts

- Start/Stop transcription: `Ctrl+Shift+S`
- Pause/Resume: `Ctrl+Shift+P`
- Show/Hide application: `Ctrl+Shift+H`
- Show/Hide caption window: `Ctrl+Shift+C`
- Copy latest transcript: `Ctrl+Shift+L`

Shortcuts can be changed in Settings.

## Privacy

Default privacy behavior:

- No telemetry
- No analytics
- No advertising
- No tracking
- No profiling
- No automatic cloud upload
- No automatic update checks
- No transcript upload
- No permanent microphone recording storage unless explicitly enabled in the future

Microphone access is used only after the user starts listening.

## Storage Locations

User data is stored outside the source repository and outside the install directory.

Common stored data:

- Settings
- Settings backup
- Transcript metadata and transcript files
- Logs
- Downloaded models
- OBS output path preference
- Caption window preferences

Open **About > Diagnostics > Open logs folder** to inspect logs.

## Troubleshooting

### No Microphone Appears

- Open **Audio**.
- Click **Refresh devices**.
- Check Windows microphone privacy permissions.
- Make sure another application is not exclusively using the microphone.

### Microphone Permission Denied

- Open Windows Settings.
- Enable microphone access for desktop apps.
- Restart the application.

### Transcription Starts But No Text Appears

- Install a Whisper model from **Models**.
- Make sure the selected model is installed.
- Check that your microphone is receiving audio in **Audio**.
- Confirm the `@fugood/whisper.node` optional native package installed successfully.

### OBS Text Source Does Not Update

- Open **OBS / Streaming**.
- Choose a writable text file path.
- Point OBS/Streamlabs Text Source to that same file.
- Make sure the app has permission to write to the selected folder.

### Caption Window Does Not Show

- Open **OBS / Streaming**.
- Click **Show / Hide** under Caption Window.
- Check monitor selection.
- Disable click-through temporarily if you need to move the window.

### Update Check Fails

- The app still works offline.
- Check internet connection.
- Check GitHub availability.
- Try again later from **Settings**.

### Settings Missing After Update

- Open **Settings > Privacy and storage**.
- Use **Import settings backup** if you exported a backup.
- The app also attempts to restore from local `settings.backup.json` automatically.

## Installation

The Windows installer installs for the current user under LocalAppData:

```text
%LOCALAPPDATA%\Programs\Speech-to-Text Application
```

The installer writes an HKCU registry key:

```text
HKCU\Software\FNBUBBLES420 Org\Speech-to-Text Application
```

The uninstaller removes the registry key and install directory.

## Development

Requirements:

- Windows 10/11
- Node.js 22 or newer
- npm

Install dependencies:

```powershell
npm install
```

Run the app:

```powershell
npm run dev
```

Run lint:

```powershell
npm run lint
```

Run tests:

```powershell
npm test
```

Build Windows installer:

```powershell
npm run build
```

Create distribution build:

```powershell
npm run dist
```

## Author

FNBUBBLES420 Org

## Repository

https://github.com/FNBUBBLES420-ORG/SPEECH-TO-TEXT

## License

See [LICENSE](LICENSE).
