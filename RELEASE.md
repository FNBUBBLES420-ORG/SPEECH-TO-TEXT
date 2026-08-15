# Speech-to-Text Application v2.0.0 Windows EXE Release

This release is for end users installing the Windows `.exe` version of Speech-to-Text Application.

Speech-to-Text Application is a privacy-focused desktop app for live speech-to-text, captions, saved transcripts, and OBS/Streamlabs text output. It is designed for accessibility, streaming, meetings, classes, presentations, content creation, and everyday transcription.

## Installer Asset

Use the Windows installer attached to this release:

```text
V201-Speech-To-Text-2.0.0.exe
```

## Install

1. Download the `.exe` installer.
2. Run the installer.
3. Review the installation prompt.
4. Click **I Agree** to continue.
5. Watch the installation progress page while files and setup steps are shown in the live details area.
6. On the final page, choose whether to launch the app after setup finishes.
7. If you do not launch it from the installer, open **Speech-to-Text Application** from the Start Menu or desktop shortcut.

The app installs for the current Windows user under:

```text
%LOCALAPPDATA%\Programs\Speech-to-Text Application
```

The installer creates a current-user registry key:

```text
HKCU\Software\FNBUBBLES420 Org\Speech-to-Text Application
```

The installer shows a live details area during setup so users can see install actions while the progress bar runs.

## First Run

1. Open the application.
2. Go to **Models** and download or select a Whisper model.
3. Go to **Audio** and select your microphone.
4. Use **Test microphone** to confirm audio input is working.
5. Go to **Live Transcription**.
6. Click **Start Listening**.

## Main Features

- Live local speech-to-text transcription.
- Local Whisper transcription support.
- Microphone selection, refresh, testing, and live audio meter.
- Transcript saving and transcript library.
- Export transcripts as TXT, SRT, VTT, or JSON.
- OBS/Streamlabs text-file output.
- Optional caption window for OBS Window Capture or second displays.
- Caption controls for font size, alignment, opacity, background, and max lines.
- Dark, light, and system themes.
- Accessibility settings including high contrast, reduced motion, large controls, interface scale, and transcript font size.
- System tray menu.
- Manual update checks from GitHub Releases.
- Local settings save-state, backup export, and backup import.

## Manual Updates

Updates are manual.

The app does not:

- Check for updates at startup.
- Download updates in the background.
- Install updates silently.
- Restart itself for updates.
- Install a background update service.
- Create scheduled update tasks.

To check for updates:

1. Open **Settings**.
2. Click **Check for updates**.
3. The app checks the newest available GitHub release tag.
4. If a newer installer is available, click **Download update**.
5. The installer downloads to your Downloads folder.
6. Run the installer yourself.
7. Complete the normal Windows installation prompts.

Your saved settings are stored on your PC and are kept when installing a newer version.

## Save Settings

The app saves user settings locally in your Windows application data folder.

In **Settings > Privacy and storage**, you can:

- Save settings now.
- Export settings backup.
- Import settings backup.

Use export before major changes if you want an extra backup.

## OBS / Streamlabs Setup

1. Open **OBS / Streaming** in the app.
2. Choose a writable text output file.
3. Open OBS or Streamlabs.
4. Add a Text Source.
5. Point the Text Source to the same file.
6. Start live transcription.

The app updates the selected file so OBS or Streamlabs can display captions.

## Caption Window

Use the caption window when you want captions displayed in a separate window.

Common uses:

- OBS Window Capture.
- Second monitor captions.
- Presentations.
- Accessibility display.

Available options include:

- Always on top.
- Click-through.
- Font size.
- Text alignment.
- Background.
- Opacity.
- Maximum lines.
- Monitor selection.

## Troubleshooting

### Windows Warns About The Installer

If Windows SmartScreen appears, confirm that you downloaded the installer from the official GitHub Releases page before continuing.

### No Microphone Shows Up

- Open **Audio**.
- Click **Refresh devices**.
- Check Windows microphone privacy settings.
- Make sure another app is not exclusively using the microphone.
- Restart the application.

### Microphone Permission Is Denied

- Open Windows Settings.
- Enable microphone access for desktop apps.
- Restart Speech-to-Text Application.

### Transcription Starts But No Text Appears

- Make sure a Whisper model is installed.
- Make sure the selected microphone is receiving audio.
- Check the live audio meter.
- Try a different microphone.
- Restart the application after installing model dependencies.

### OBS Text Does Not Update

- Confirm the OBS output file path is selected in the app.
- Confirm OBS is using the same text file.
- Choose a folder your Windows user account can write to.
- Restart OBS if it cached the old file state.

### Caption Window Is Missing

- Open **OBS / Streaming**.
- Use the caption window show/hide control.
- Check monitor selection.
- Disable click-through if you need to move the window.

### Settings Are Missing After Update

- Open **Settings > Privacy and storage**.
- Use **Import settings backup** if you exported one.
- The app also attempts to restore from its local settings backup automatically.

## Privacy

Speech-to-Text Application is designed to be local-first.

Default behavior:

- No telemetry.
- No analytics.
- No ads.
- No tracking.
- No profiling.
- No automatic cloud transcript upload.
- No automatic update checks.
- No silent update installation.

Microphone access is only used after you start listening.

## Uninstall

Use Windows installed apps settings:

1. Open Windows Settings.
2. Go to **Apps > Installed apps**.
3. Find **Speech-to-Text Application**.
4. Click **Uninstall**.
5. Follow the uninstall prompts.

The uninstaller removes the app install directory and the app registry key.

## Version

```text
Application version: 2.0.0
Release type: Windows EXE installer
Platform: Windows 10 / Windows 11
Install scope: Current user
Install location: LocalAppData
```

## Author

FNBUBBLES420 Org

## License

MIT License. See `LICENSE` for full license terms.
