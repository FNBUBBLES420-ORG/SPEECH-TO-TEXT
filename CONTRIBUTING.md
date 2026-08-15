# Contributing

Thanks for helping improve Speech-to-Text Application.

## Development Flow

1. Install dependencies with `npm install`.
2. Create focused changes in a feature branch.
3. Run `npm run lint` and `npm test`.
4. Update documentation when behavior changes.

Keep privacy and accessibility central. Do not add telemetry, analytics, advertising, tracking, automatic update checks, or cloud transcription defaults.

Do not downgrade dependencies to work around local environment issues. Fix startup and tooling configuration while preserving the current supported Electron ecosystem unless a security advisory requires a version change.

## Code Style

- Use modern JavaScript modules.
- Keep renderer, main process, services, settings, storage, and IPC concerns separated.
- Validate untrusted input before using it.
- Keep expensive work outside the renderer and main process.
- Prefer small, meaningful tests over broad shallow tests.
