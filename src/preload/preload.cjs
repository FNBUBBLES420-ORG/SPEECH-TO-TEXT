const { contextBridge, ipcRenderer } = require('electron');

const invoke = (channel, payload) => ipcRenderer.invoke(channel, payload);
const on = (channel, callback) => {
  const listener = (_event, payload) => callback(payload);
  ipcRenderer.on(channel, listener);
  return () => ipcRenderer.removeListener(channel, listener);
};

contextBridge.exposeInMainWorld('captionPulse', {
  app: {
    bootstrap: () => invoke('app:get-bootstrap'),
    diagnostics: () => invoke('diagnostics:get'),
    openLogs: () => invoke('diagnostics:open-logs'),
    quit: () => invoke('app:quit')
  },
  settings: {
    update: (patch) => invoke('settings:update', patch),
    resetCategory: (category) => invoke('settings:reset-category', category),
    resetAll: () => invoke('settings:reset-all'),
    saveNow: () => invoke('settings:save-now'),
    export: () => invoke('settings:export'),
    import: () => invoke('settings:import')
  },
  transcription: {
    start: (options) => invoke('transcription:start', options),
    pause: () => invoke('transcription:pause'),
    resume: () => invoke('transcription:resume'),
    stop: () => invoke('transcription:stop'),
    submitAudio: (chunk) => invoke('transcription:submit-audio', chunk),
    onStatus: (callback) => on('transcription:status', callback),
    onSegment: (callback) => on('transcription:segment', callback),
    onToggle: (callback) => on('transcription:toggle', callback),
    onPauseResume: (callback) => on('transcription:pause-resume', callback),
    onCopyLatest: (callback) => on('transcript:copy-latest', callback)
  },
  transcripts: {
    list: () => invoke('transcripts:list'),
    get: (id) => invoke('transcripts:get', id),
    save: (transcript) => invoke('transcripts:save', transcript),
    rename: (payload) => invoke('transcripts:rename', payload),
    delete: (id) => invoke('transcripts:delete', id),
    export: (payload) => invoke('transcripts:export', payload)
  },
  models: {
    list: () => invoke('models:list'),
    download: (id) => invoke('models:download', id),
    cancel: (id) => invoke('models:cancel', id),
    remove: (id) => invoke('models:remove', id),
    onProgress: (callback) => on('models:progress', callback)
  },
  obs: {
    chooseOutput: () => invoke('obs:choose-output'),
    updateOutput: (text) => invoke('obs:update-output', text)
  },
  displays: {
    list: () => invoke('display:list')
  },
  caption: {
    toggle: () => invoke('caption:toggle'),
    update: (payload) => invoke('caption:update', payload),
    onUpdate: (callback) => on('caption:update', callback),
    onToggle: (callback) => on('caption:toggle', callback)
  },
  updates: {
    check: () => invoke('updates:check'),
    download: (asset) => invoke('updates:download', asset),
    openDownloadFolder: (filePath) => invoke('updates:open-download-folder', filePath),
    runInstaller: (filePath) => invoke('updates:run-installer', filePath),
    openReleasePage: (url) => invoke('updates:open-release-page', url),
    onDownloadProgress: (callback) => on('updates:download-progress', callback)
  },
  privacy: {
    clear: (scope) => invoke('privacy:clear', scope)
  },
  navigation: {
    onOpen: (callback) => on('navigation:open', callback)
  }
});
