export const defaultSettings = Object.freeze({
  general: {
    firstRunComplete: false,
    closeBehavior: 'tray',
    trayEnabled: true,
    launchOnStartup: false
  },
  appearance: {
    theme: 'system',
    interfaceScale: 1,
    largeControls: false
  },
  audio: {
    selectedDeviceId: 'default',
    sensitivity: 0.45,
    autoReconnect: true,
    testDurationSeconds: 10
  },
  transcription: {
    engine: 'local-whisper',
    defaultModel: 'base',
    language: 'auto',
    vadEnabled: true,
    vadThreshold: 0.02,
    autoScroll: true,
    persistRecordings: false
  },
  obs: {
    enabled: false,
    outputPath: '',
    captionWindow: {
      enabled: false,
      alwaysOnTop: false,
      clickThrough: false,
      fontSize: 32,
      alignment: 'center',
      background: '#000000',
      opacity: 0.72,
      maxLines: 3,
      monitorId: '',
      bounds: null
    }
  },
  accessibility: {
    highContrast: false,
    reducedMotion: false,
    transcriptFontSize: 18,
    captionFontSize: 32
  },
  shortcuts: {
    startStop: 'CommandOrControl+Shift+S',
    pauseResume: 'CommandOrControl+Shift+P',
    showHide: 'CommandOrControl+Shift+H',
    captionWindow: 'CommandOrControl+Shift+C',
    copyLatest: 'CommandOrControl+Shift+L'
  },
  privacy: {
    telemetry: false,
    analytics: false,
    saveTranscripts: true
  },
  storage: {
    preferredExportDirectory: ''
  },
  advanced: {
    logLevel: 'info'
  }
});
