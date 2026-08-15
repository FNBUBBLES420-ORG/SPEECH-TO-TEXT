import { LANGUAGE_OPTIONS } from '../../shared/constants.js';

const api = window.captionPulse;

const sections = [
  ['dashboard', 'Dashboard', 'Overview', '⌂'],
  ['live', 'Live Transcription', 'Workspace', '◉'],
  ['transcripts', 'Transcripts', 'Library', '▤'],
  ['obs', 'OBS / Streaming', 'Output', '▣'],
  ['models', 'Models', 'Local Whisper', '⬡'],
  ['audio', 'Audio', 'Microphone', '≋'],
  ['accessibility', 'Accessibility', 'Access', '◇'],
  ['settings', 'Settings', 'Preferences', '⚙'],
  ['about', 'About', 'Project', 'i']
];

const state = {
  active: 'dashboard',
  settings: null,
  models: [],
  transcripts: [],
  displays: [],
  diagnostics: {},
  segments: [],
  listening: false,
  paused: false,
  startedAt: 0,
  elapsedTimer: null,
  stream: null,
  audioContext: null,
  analyser: null,
  workletNode: null,
  meterTimer: null,
  latestText: '',
  currentTranscriptView: null,
  latestRelease: null,
  downloadedUpdate: null
};

const content = document.querySelector('#content');
const nav = document.querySelector('#nav');
const title = document.querySelector('#section-title');
const eyebrow = document.querySelector('#section-eyebrow');
const engineStatus = document.querySelector('#engine-status');

boot();

async function boot() {
  renderNav();
  const bootstrap = await api.app.bootstrap();
  state.settings = bootstrap.settings;
  state.models = bootstrap.models;
  state.transcripts = bootstrap.transcripts;
  state.diagnostics = bootstrap.diagnostics;
  state.displays = await api.displays.list();
  applyTheme();
  render();
  bindGlobalEvents();
  if (!state.settings.general.firstRunComplete) renderFirstRun();
}

function renderNav() {
  nav.innerHTML = sections
    .map(
      ([id, label, group, icon]) =>
        `<button class="nav-button ${state.active === id ? 'active' : ''}" data-section="${id}" aria-current="${state.active === id ? 'page' : 'false'}"><span class="nav-icon" aria-hidden="true">${icon}</span><span>${label}</span><small>${group}</small></button>`
    )
    .join('');
}

nav.addEventListener('click', (event) => {
  const button = event.target.closest('[data-section]');
  if (!button) return;
  state.active = button.dataset.section;
  state.currentTranscriptView = null;
  render();
});

function bindGlobalEvents() {
  document.querySelector('#theme-toggle').addEventListener('click', async () => {
    const current = state.settings.appearance.theme;
    const theme = current === 'dark' ? 'light' : 'dark';
    state.settings = await api.settings.update({ appearance: { theme } });
    applyTheme();
  });
  document.querySelector('#exit-app').addEventListener('click', async () => {
    if (await confirmAction('Exit application?', 'This will stop transcription and close all app windows.')) {
      await stopListening().catch(() => {});
      await api.app.quit();
    }
  });

  api.transcription.onStatus((payload) => {
    state.listening = Boolean(payload.listening);
    state.paused = Boolean(payload.paused);
    engineStatus.textContent = payload.message || (state.listening ? 'Listening' : 'Idle');
    render();
  });

  api.transcription.onSegment((segment) => addSegment(segment));
  api.transcription.onToggle(() => (state.listening ? stopListening() : startListening()));
  api.transcription.onPauseResume(() => (state.paused ? resumeListening() : pauseListening()));
  api.transcription.onCopyLatest(() => copyLatest());
  api.caption.onToggle(() => api.caption.toggle());
  api.navigation.onOpen((section) => {
    state.active = section;
    render();
  });
  api.models.onProgress((progress) => {
    toast(`Downloading model: ${Math.round((progress.received / progress.total) * 100 || 0)}%`);
  });
  api.updates.onDownloadProgress((progress) => {
    const percent = Math.round((progress.received / progress.total) * 100 || 0);
    const meter = document.querySelector('#update-download-meter span');
    const label = document.querySelector('#update-download-label');
    if (meter) meter.style.width = `${percent}%`;
    if (label) label.textContent = `Downloading ${progress.fileName}: ${percent}%`;
  });
}

function render() {
  renderNav();
  const section = sections.find(([id]) => id === state.active) || sections[0];
  eyebrow.textContent = section[2];
  title.textContent = section[1];
  const renderers = {
    dashboard: renderDashboard,
    live: renderLive,
    transcripts: renderTranscripts,
    obs: renderObs,
    models: renderModels,
    audio: renderAudio,
    accessibility: renderAccessibility,
    settings: renderSettings,
    about: renderAbout
  };
  renderers[state.active]();
}

function renderDashboard() {
  content.innerHTML = `
    <section class="command-center">
      <div class="command-copy">
        <span class="status-dot ${state.listening ? 'on' : ''}"></span>
        <p class="eyebrow">Local caption workstation</p>
        <h2>${state.listening ? 'Listening for speech' : 'Ready when you are'}</h2>
        <p>Live captions, transcript storage, OBS output, and caption display controls run locally by default.</p>
      </div>
      <div class="command-actions">
        <button class="primary" id="dash-start">${state.listening ? 'Stop listening' : 'Start listening'}</button>
        <button id="dash-models">Manage models</button>
        <button id="dash-obs">OBS output</button>
      </div>
    </section>
    <section class="metrics-grid">
      ${metricCard('Session', state.listening ? (state.paused ? 'Paused' : 'Listening') : 'Idle', 'Current microphone session state')}
      ${metricCard('Transcripts', String(state.transcripts.length), 'Saved local transcript records')}
      ${metricCard('Models', `${state.models.filter((m) => m.installed).length}/${state.models.length}`, `Default model: ${state.settings.transcription.defaultModel}`)}
      ${metricCard('Privacy', 'Local-first', 'No telemetry or automatic update checks')}
    </section>
    <section class="dashboard-grid">
      <article class="panel workflow-panel">
        <h2>Today’s workflow</h2>
        <ol class="workflow-list">
          <li><span>1</span><div><strong>Pick audio</strong><p>Use the Audio page to select and test a microphone.</p></div></li>
          <li><span>2</span><div><strong>Install a model</strong><p>Download a Whisper model into local app data.</p></div></li>
          <li><span>3</span><div><strong>Caption live</strong><p>Start listening, save transcripts, or publish to OBS.</p></div></li>
        </ol>
      </article>
      <article class="panel health-panel">
        <h2>System readiness</h2>
        ${readinessRow('Whisper model', state.models.some((model) => model.installed), state.models.some((model) => model.installed) ? 'Installed' : 'Install a model')}
        ${readinessRow('OBS text file', state.settings.obs.enabled, state.settings.obs.outputPath || 'Not configured')}
        ${readinessRow('Manual updates', true, 'Only checks after button press')}
        ${readinessRow('Storage', true, 'Application data folder')}
      </article>
    </section>`;
  document.querySelector('#dash-start').addEventListener('click', () =>
    state.listening ? stopListening() : startListening()
  );
  document.querySelector('#dash-models').addEventListener('click', () => {
    state.active = 'models';
    render();
  });
  document.querySelector('#dash-obs').addEventListener('click', () => {
    state.active = 'obs';
    render();
  });
}

function metricCard(label, value, detail) {
  return `
    <article class="metric-card">
      <span>${label}</span>
      <strong>${value}</strong>
      <p>${detail}</p>
    </article>`;
}

function readinessRow(label, ok, detail) {
  return `
    <div class="readiness-row">
      <span class="readiness-indicator ${ok ? 'ok' : ''}" aria-hidden="true"></span>
      <div><strong>${label}</strong><p>${escapeHtml(detail)}</p></div>
    </div>`;
}

function renderLive() {
  content.innerHTML = `
    <div class="live-layout">
      <section class="panel">
        <div class="toolbar">
          <button class="primary" id="start">${state.listening ? 'Stop' : 'Start Listening'}</button>
          <button id="pause" ${!state.listening ? 'disabled' : ''}>${state.paused ? 'Resume' : 'Pause'}</button>
          <button id="clear">Clear</button>
          <button id="copy">Copy</button>
          <button id="save">Save</button>
          <select id="export-format" aria-label="Export format"><option value="txt">TXT</option><option value="srt">SRT</option><option value="vtt">VTT</option><option value="json">JSON</option></select>
          <button id="export">Export</button>
        </div>
        <div class="transcript-box" id="transcript" tabindex="0">${renderSegments()}</div>
      </section>
      <aside class="panel">
        <h2>Session</h2>
        <p>Status: <strong>${state.listening ? (state.paused ? 'Paused' : 'Listening') : 'Idle'}</strong></p>
        <p>Elapsed: <strong id="elapsed">00:00</strong></p>
        <p>Language: <strong>${state.settings.transcription.language}</strong></p>
        <p>Model: <strong>${state.settings.transcription.defaultModel}</strong></p>
        <p>Segments: <strong>${state.segments.length}</strong></p>
        <div class="field"><label>Audio level</label><div class="meter"><span id="audio-level"></span></div></div>
        <label class="switch"><input id="auto-scroll" type="checkbox" ${state.settings.transcription.autoScroll ? 'checked' : ''}/> Auto-scroll</label>
      </aside>
    </div>`;
  document.querySelector('#start').addEventListener('click', () =>
    state.listening ? stopListening() : startListening()
  );
  document.querySelector('#pause').addEventListener('click', () =>
    state.paused ? resumeListening() : pauseListening()
  );
  document.querySelector('#clear').addEventListener('click', () => {
    state.segments = [];
    state.latestText = '';
    renderLive();
  });
  document.querySelector('#copy').addEventListener('click', copyLatest);
  document.querySelector('#save').addEventListener('click', saveCurrentTranscript);
  document.querySelector('#export').addEventListener('click', () =>
    exportCurrentTranscript(document.querySelector('#export-format').value)
  );
  document.querySelector('#auto-scroll').addEventListener('change', async (event) => {
    state.settings = await api.settings.update({
      transcription: { autoScroll: event.target.checked }
    });
  });
  updateElapsed();
}

function renderTranscripts() {
  content.innerHTML = `
    <section class="panel">
      <div class="toolbar"><input id="search" placeholder="Search transcripts" aria-label="Search transcripts" /></div>
      <div id="transcript-list" class="grid">${renderTranscriptCards(state.transcripts)}</div>
    </section>
    <section id="transcript-viewer" class="panel" ${state.currentTranscriptView ? '' : 'hidden'}>${renderTranscriptViewer()}</section>`;
  document.querySelector('#search').addEventListener('input', (event) => {
    const q = event.target.value.toLowerCase();
    document.querySelector('#transcript-list').innerHTML = renderTranscriptCards(
      state.transcripts.filter((item) => item.title.toLowerCase().includes(q))
    );
    bindTranscriptButtons();
  });
  bindTranscriptButtons();
}

function renderObs() {
  content.innerHTML = `
    <div class="grid">
      <section class="panel">
        <h2>Live text file</h2>
        <p class="muted">Use this file as an OBS or Streamlabs Text Source.</p>
        <p>${state.settings.obs.outputPath || 'No file selected'}</p>
        <button id="choose-obs">Choose file</button>
      </section>
      <section class="panel">
        <h2>Caption window</h2>
        <div class="field"><label>Font size</label><input id="caption-size" type="range" min="18" max="80" value="${state.settings.obs.captionWindow.fontSize}" /></div>
        <div class="field"><label>Alignment</label><select id="caption-align"><option>left</option><option>center</option><option>right</option></select></div>
        <div class="field"><label>Background</label><input id="caption-bg" type="color" value="${state.settings.obs.captionWindow.background}" /></div>
        <div class="field"><label>Opacity</label><input id="caption-opacity" type="range" min="0.1" max="1" step="0.01" value="${state.settings.obs.captionWindow.opacity}" /></div>
        <div class="field"><label>Maximum lines</label><input id="caption-lines" type="number" min="1" max="8" value="${state.settings.obs.captionWindow.maxLines}" /></div>
        <div class="field"><label>Monitor</label><select id="caption-monitor"><option value="">Primary monitor</option>${state.displays.map((display) => `<option value="${display.id}">${display.label}${display.primary ? ' (Primary)' : ''}</option>`).join('')}</select></div>
        <label class="switch"><input id="caption-top" type="checkbox" ${state.settings.obs.captionWindow.alwaysOnTop ? 'checked' : ''}/> Always on top</label>
        <label class="switch"><input id="caption-click" type="checkbox" ${state.settings.obs.captionWindow.clickThrough ? 'checked' : ''}/> Click-through</label>
        <button id="caption-toggle">Show / Hide</button>
      </section>
    </div>`;
  document.querySelector('#caption-align').value = state.settings.obs.captionWindow.alignment;
  document.querySelector('#caption-monitor').value = state.settings.obs.captionWindow.monitorId;
  document.querySelector('#choose-obs').addEventListener('click', async () => {
    const result = await api.obs.chooseOutput();
    if (!result.canceled) {
      state.settings.obs.enabled = true;
      state.settings.obs.outputPath = result.filePath;
      toast('OBS output file selected.');
      renderObs();
    }
  });
  document.querySelector('#caption-toggle').addEventListener('click', () => api.caption.toggle());
  document.querySelector('#caption-size').addEventListener('input', updateCaptionSettings);
  document.querySelector('#caption-align').addEventListener('change', updateCaptionSettings);
  document.querySelector('#caption-bg').addEventListener('input', updateCaptionSettings);
  document.querySelector('#caption-opacity').addEventListener('input', updateCaptionSettings);
  document.querySelector('#caption-lines').addEventListener('change', updateCaptionSettings);
  document.querySelector('#caption-monitor').addEventListener('change', updateCaptionSettings);
  document.querySelector('#caption-top').addEventListener('change', updateCaptionSettings);
  document.querySelector('#caption-click').addEventListener('change', updateCaptionSettings);
}

function renderModels() {
  content.innerHTML = `<div class="grid">${state.models
    .map(
      (model) => `
      <article class="card">
        <h3>${model.name}</h3>
        <p>${model.recommendedUse}</p>
        <p class="muted">${model.size} - ${model.installed ? 'Installed' : 'Not installed'}</p>
        <div class="toolbar">
          <button data-model-download="${model.id}">Download</button>
          <button data-model-remove="${model.id}" ${model.installed ? '' : 'disabled'}>Remove</button>
          <button data-model-default="${model.id}">Set default</button>
        </div>
      </article>`
    )
    .join('')}</div>`;
  content.querySelectorAll('[data-model-download]').forEach((button) =>
    button.addEventListener('click', async () => {
      await api.models.download(button.dataset.modelDownload);
      state.models = await api.models.list();
      renderModels();
    })
  );
  content.querySelectorAll('[data-model-remove]').forEach((button) =>
    button.addEventListener('click', async () => {
      await api.models.remove(button.dataset.modelRemove);
      state.models = await api.models.list();
      renderModels();
    })
  );
  content.querySelectorAll('[data-model-default]').forEach((button) =>
    button.addEventListener('click', async () => {
      state.settings = await api.settings.update({
        transcription: { defaultModel: button.dataset.modelDefault }
      });
      toast('Default model updated.');
    })
  );
}

function renderAudio() {
  content.innerHTML = `
    <section class="panel">
      <div class="toolbar"><button id="refresh-devices">Refresh devices</button><button id="test-mic">Test microphone</button></div>
      <div class="field"><label>Input device</label><select id="devices"><option value="default">Default microphone</option></select></div>
      <div class="field"><label>Sensitivity</label><input id="sensitivity" type="range" min="0" max="1" step="0.01" value="${state.settings.audio.sensitivity}" /></div>
      <label class="switch"><input id="reconnect" type="checkbox" ${state.settings.audio.autoReconnect ? 'checked' : ''}/> Automatic reconnect</label>
      <div class="field"><label>Live level</label><div class="meter"><span id="audio-level"></span></div></div>
    </section>`;
  document.querySelector('#refresh-devices').addEventListener('click', listDevices);
  document.querySelector('#test-mic').addEventListener('click', testMicrophone);
  document.querySelector('#sensitivity').addEventListener('change', async (event) => {
    state.settings = await api.settings.update({ audio: { sensitivity: event.target.value } });
  });
  document.querySelector('#reconnect').addEventListener('change', async (event) => {
    state.settings = await api.settings.update({ audio: { autoReconnect: event.target.checked } });
  });
  listDevices();
}

function renderAccessibility() {
  content.innerHTML = `
    <section class="panel settings-grid">
      <label class="switch"><input id="contrast" type="checkbox" ${state.settings.accessibility.highContrast ? 'checked' : ''}/> High contrast</label>
      <label class="switch"><input id="motion" type="checkbox" ${state.settings.accessibility.reducedMotion ? 'checked' : ''}/> Reduced motion</label>
      <div class="field"><label>Transcript font size</label><input id="font" type="range" min="14" max="34" value="${state.settings.accessibility.transcriptFontSize}" /></div>
      <div class="field"><label>Interface scale</label><input id="scale" type="range" min="0.85" max="1.3" step="0.05" value="${state.settings.appearance.interfaceScale}" /></div>
    </section>`;
  bindSettingInput('#contrast', 'accessibility', 'highContrast', 'checked');
  bindSettingInput('#motion', 'accessibility', 'reducedMotion', 'checked');
  bindSettingInput('#font', 'accessibility', 'transcriptFontSize', 'value', applyTheme);
  bindSettingInput('#scale', 'appearance', 'interfaceScale', 'value', applyTheme);
}

function renderSettings() {
  content.innerHTML = `
    <div class="grid">
      <section class="panel">
        <h2>Appearance</h2>
        <div class="field"><label>Theme</label><select id="theme"><option>system</option><option>dark</option><option>light</option></select></div>
        <label class="switch"><input id="large-controls" type="checkbox" ${state.settings.appearance.largeControls ? 'checked' : ''}/> Large controls</label>
        <button id="reset-appearance">Reset appearance</button>
      </section>
      <section class="panel">
        <h2>Transcription</h2>
        <div class="field"><label>Language</label><input id="language-search" list="language-list" value="${state.settings.transcription.language}" /><datalist id="language-list">${LANGUAGE_OPTIONS.map(([code, label]) => `<option value="${code}">${label}</option>`).join('')}</datalist></div>
        <label class="switch"><input id="vad" type="checkbox" ${state.settings.transcription.vadEnabled ? 'checked' : ''}/> Voice activity detection</label>
        <div class="field"><label>VAD threshold</label><input id="vad-threshold" type="range" min="0" max="1" step="0.01" value="${state.settings.transcription.vadThreshold}" /></div>
      </section>
      <section class="panel">
        <h2>General</h2>
        <div class="field"><label>Close behavior</label><select id="close-behavior"><option value="tray">Minimize to tray</option><option value="exit">Exit application</option></select></div>
        <label class="switch"><input id="tray-enabled" type="checkbox" ${state.settings.general.trayEnabled ? 'checked' : ''}/> System tray</label>
      </section>
      <section class="panel">
        <h2>Shortcuts</h2>
        ${Object.entries(state.settings.shortcuts).map(([key, value]) => `<div class="field"><label>${shortcutLabel(key)}</label><input data-shortcut="${key}" value="${value}" /></div>`).join('')}
      </section>
      <section class="panel">
        <h2>Privacy and storage</h2>
        <p class="muted">Settings are saved on this PC in your Windows app data folder and loaded again after updates.</p>
        <button id="save-settings">Save settings now</button>
        <button id="export-settings">Export settings backup</button>
        <button id="import-settings">Import settings backup</button>
        <button class="danger" data-clear="transcripts">Clear transcript history</button>
        <button class="danger" data-clear="logs">Clear logs</button>
        <button class="danger" data-clear="models">Clear downloaded models</button>
        <button class="danger" data-clear="settings">Reset all settings</button>
      </section>
      <section class="panel">
        <h2>Manual updates</h2>
        <p class="muted">Checks and downloads only happen when you press these buttons.</p>
        <button id="check-updates">Check for updates</button>
        <div id="update-result" class="update-result"></div>
      </section>
    </div>`;
  document.querySelector('#theme').value = state.settings.appearance.theme;
  document.querySelector('#close-behavior').value = state.settings.general.closeBehavior;
  document.querySelector('#theme').addEventListener('change', async (event) => {
    state.settings = await api.settings.update({ appearance: { theme: event.target.value } });
    applyTheme();
  });
  document.querySelector('#large-controls').addEventListener('change', async (event) => {
    state.settings = await api.settings.update({ appearance: { largeControls: event.target.checked } });
    applyTheme();
  });
  document.querySelector('#language-search').addEventListener('change', async (event) => {
    state.settings = await api.settings.update({ transcription: { language: event.target.value || 'auto' } });
  });
  document.querySelector('#vad').addEventListener('change', async (event) => {
    state.settings = await api.settings.update({ transcription: { vadEnabled: event.target.checked } });
  });
  document.querySelector('#vad-threshold').addEventListener('change', async (event) => {
    state.settings = await api.settings.update({ transcription: { vadThreshold: event.target.value } });
  });
  document.querySelector('#close-behavior').addEventListener('change', async (event) => {
    state.settings = await api.settings.update({ general: { closeBehavior: event.target.value } });
  });
  document.querySelector('#tray-enabled').addEventListener('change', async (event) => {
    state.settings = await api.settings.update({ general: { trayEnabled: event.target.checked } });
  });
  content.querySelectorAll('[data-shortcut]').forEach((input) =>
    input.addEventListener('change', async () => {
      state.settings = await api.settings.update({
        shortcuts: { [input.dataset.shortcut]: input.value.trim() }
      });
      toast('Shortcut saved. Restart the app if the global registration does not update immediately.');
    })
  );
  document.querySelector('#reset-appearance').addEventListener('click', async () => {
    state.settings = await api.settings.resetCategory('appearance');
    applyTheme();
    renderSettings();
  });
  document.querySelector('#save-settings').addEventListener('click', async () => {
    const result = await api.settings.saveNow();
    toast(`Settings saved on this PC: ${result.backupPath}`);
  });
  document.querySelector('#export-settings').addEventListener('click', async () => {
    const result = await api.settings.export();
    if (!result.canceled) toast('Settings backup exported.');
  });
  document.querySelector('#import-settings').addEventListener('click', async () => {
    if (!(await confirmAction('Import settings?', 'This will replace current settings with the selected backup.'))) {
      return;
    }
    const result = await api.settings.import();
    if (!result.canceled) {
      state.settings = result.settings;
      applyTheme();
      toast('Settings imported and saved.');
      renderSettings();
    }
  });
  content.querySelectorAll('[data-clear]').forEach((button) =>
    button.addEventListener('click', async () => {
      if (!(await confirmAction('Clear data?', 'This cannot be undone.'))) return;
      await api.privacy.clear(button.dataset.clear);
      toast('Data cleared.');
    })
  );
  document.querySelector('#check-updates').addEventListener('click', checkUpdates);
}

function renderAbout() {
  content.innerHTML = `
    <div class="grid">
      <section class="panel">
        <h2>Speech-to-Text Application</h2>
        <p>FNBUBBLES420 Org</p>
        <p class="muted">Version ${state.diagnostics.appVersion}</p>
        <p>Privacy-focused local live transcription for accessibility, streaming, meetings, classes, and everyday captions.</p>
      </section>
      <section class="panel">
        <h2>Diagnostics</h2>
        <p>Electron ${state.diagnostics.electronVersion}</p>
        <p>Node ${state.diagnostics.nodeVersion}</p>
        <p>${state.diagnostics.os}</p>
        <button id="open-logs">Open logs folder</button>
      </section>
    </div>`;
  document.querySelector('#open-logs').addEventListener('click', () => api.app.openLogs());
}

async function startListening() {
  try {
    const deviceId = state.settings.audio.selectedDeviceId;
    state.stream = await navigator.mediaDevices.getUserMedia({
      audio: deviceId === 'default' ? true : { deviceId: { exact: deviceId } }
    });
    const result = await api.transcription.start({
      model: state.settings.transcription.defaultModel,
      language: state.settings.transcription.language
    });
    if (!result.ready) toast('Install a local Whisper model before transcription will produce text.');
    state.listening = true;
    state.startedAt = Date.now();
    await startPcmCapture();
    renderLive();
  } catch (error) {
    toast(userMessage(error));
  }
}

async function startPcmCapture() {
  state.audioContext = new AudioContext();
  await state.audioContext.audioWorklet.addModule('./audio-worklet.js');
  const source = state.audioContext.createMediaStreamSource(state.stream);
  state.analyser = state.audioContext.createAnalyser();
  state.workletNode = new AudioWorkletNode(state.audioContext, 'pcm-capture-processor');
  source.connect(state.analyser);
  source.connect(state.workletNode);
  const silentOutput = state.audioContext.createGain();
  silentOutput.gain.value = 0;
  state.workletNode.connect(silentOutput);
  silentOutput.connect(state.audioContext.destination);
  state.workletNode.port.onmessage = async (event) => {
    const samples = event.data;
    await api.transcription.submitAudio({
      samples,
      sampleRate: 16000,
      startMs: Date.now() - state.startedAt - 3000,
      endMs: Date.now() - state.startedAt
    });
  };
}

async function pauseListening() {
  state.paused = true;
  state.audioContext?.suspend();
  await api.transcription.pause();
  renderLive();
}

async function resumeListening() {
  state.paused = false;
  state.audioContext?.resume();
  await api.transcription.resume();
  renderLive();
}

async function stopListening() {
  state.workletNode?.disconnect();
  state.stream?.getTracks().forEach((track) => track.stop());
  state.audioContext?.close();
  clearInterval(state.meterTimer);
  clearInterval(state.elapsedTimer);
  await api.transcription.stop();
  state.listening = false;
  state.paused = false;
  state.workletNode = null;
  state.audioContext = null;
  state.analyser = null;
  renderLive();
}

function addSegment(segment) {
  state.segments.push(segment);
  state.latestText = segment.text;
  api.obs.updateOutput(segment.text);
  api.caption.update({
    text: state.segments.slice(-state.settings.obs.captionWindow.maxLines).map((item) => item.text).join('\n'),
    ...state.settings.obs.captionWindow
  });
  if (state.active === 'live') renderLive();
}

function renderSegments() {
  if (!state.segments.length) return '<div class="empty">Start listening to build a transcript.</div>';
  return state.segments
    .map((segment) => `<p class="segment ${segment.final ? '' : 'pending'}">${escapeHtml(segment.text)}</p>`)
    .join('');
}

async function saveCurrentTranscript() {
  const transcript = currentTranscript();
  const saved = await api.transcripts.save(transcript);
  state.transcripts = await api.transcripts.list();
  toast(`Saved ${saved.title}`);
}

async function exportCurrentTranscript(format) {
  await api.transcripts.export({ transcript: currentTranscript(), format });
}

function currentTranscript() {
  return {
    title: `Live Transcript ${new Date().toLocaleString()}`,
    startTime: new Date(state.startedAt || Date.now()).toISOString(),
    durationMs: state.startedAt ? Date.now() - state.startedAt : 0,
    language: state.settings.transcription.language,
    model: state.settings.transcription.defaultModel,
    segments: state.segments,
    text: state.segments.map((segment) => segment.text).join('\n')
  };
}

function copyLatest() {
  navigator.clipboard.writeText(state.latestText || state.segments.map((segment) => segment.text).join('\n'));
  toast('Copied transcript text.');
}

function renderTranscriptCards(items) {
  if (!items.length) return '<div class="empty">No transcripts saved yet.</div>';
  return items
    .map(
      (item) => `
      <article class="card">
        <h3>${escapeHtml(item.title)}</h3>
        <p class="muted">${item.date} - ${Math.round((item.durationMs || 0) / 60000)} min - ${item.language}</p>
        <div class="toolbar">
          <button data-open="${item.id}">Open</button>
          <button data-copy="${item.id}">Copy</button>
          <button data-export="${item.id}">Export</button>
          <button data-rename="${item.id}">Rename</button>
          <button data-delete="${item.id}" class="danger">Delete</button>
        </div>
      </article>`
    )
    .join('');
}

function renderTranscriptViewer() {
  if (!state.currentTranscriptView) return '';
  return `
    <h2>${escapeHtml(state.currentTranscriptView.title)}</h2>
    <p class="muted">${state.currentTranscriptView.startTime} - ${state.currentTranscriptView.language} - ${state.currentTranscriptView.model}</p>
    <div class="transcript-box">${escapeHtml(state.currentTranscriptView.text || state.currentTranscriptView.segments.map((segment) => segment.text).join('\n'))}</div>`;
}

function bindTranscriptButtons() {
  content.querySelectorAll('[data-open]').forEach((button) =>
    button.addEventListener('click', async () => {
      state.currentTranscriptView = await api.transcripts.get(button.dataset.open);
      renderTranscripts();
    })
  );
  content.querySelectorAll('[data-copy]').forEach((button) =>
    button.addEventListener('click', async () => {
      const transcript = await api.transcripts.get(button.dataset.copy);
      await navigator.clipboard.writeText(transcript.text || transcript.segments.map((segment) => segment.text).join('\n'));
      toast('Copied transcript.');
    })
  );
  content.querySelectorAll('[data-export]').forEach((button) =>
    button.addEventListener('click', async () => {
      const transcript = await api.transcripts.get(button.dataset.export);
      await api.transcripts.export({ transcript, format: 'txt' });
    })
  );
  content.querySelectorAll('[data-delete]').forEach((button) =>
    button.addEventListener('click', async () => {
      if (!(await confirmAction('Delete transcript?', 'This transcript will be permanently deleted.'))) return;
      await api.transcripts.delete(button.dataset.delete);
      state.transcripts = await api.transcripts.list();
      renderTranscripts();
    })
  );
  content.querySelectorAll('[data-rename]').forEach((button) =>
    button.addEventListener('click', async () => {
      const title = await inputAction('Rename transcript', 'Title');
      if (!title) return;
      await api.transcripts.rename({ id: button.dataset.rename, title });
      state.transcripts = await api.transcripts.list();
      renderTranscripts();
    })
  );
}

async function listDevices() {
  try {
    await navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) =>
      stream.getTracks().forEach((track) => track.stop())
    );
    const devices = await navigator.mediaDevices.enumerateDevices();
    const select = document.querySelector('#devices');
    if (!select) return;
    select.innerHTML = '<option value="default">Default microphone</option>';
    devices
      .filter((device) => device.kind === 'audioinput')
      .forEach((device) => {
        select.insertAdjacentHTML(
          'beforeend',
          `<option value="${device.deviceId}">${escapeHtml(device.label || 'Microphone')}</option>`
        );
      });
    select.value = state.settings.audio.selectedDeviceId;
    select.addEventListener('change', async (event) => {
      state.settings = await api.settings.update({ audio: { selectedDeviceId: event.target.value } });
    });
  } catch (error) {
    toast(userMessage(error));
  }
}

async function testMicrophone() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    setupMeter(stream);
    setTimeout(() => stream.getTracks().forEach((track) => track.stop()), 10000);
    toast('Microphone test started.');
  } catch (error) {
    toast(userMessage(error));
  }
}

function setupMeter(stream) {
  state.audioContext = new AudioContext();
  const source = state.audioContext.createMediaStreamSource(stream);
  state.analyser = state.audioContext.createAnalyser();
  source.connect(state.analyser);
  const data = new Uint8Array(state.analyser.frequencyBinCount);
  clearInterval(state.meterTimer);
  state.meterTimer = setInterval(() => {
    state.analyser.getByteFrequencyData(data);
    const level = data.reduce((sum, value) => sum + value, 0) / data.length / 255;
    const meter = document.querySelector('#audio-level');
    if (meter) meter.style.width = `${Math.round(level * 100)}%`;
  }, 100);
}

function updateElapsed() {
  clearInterval(state.elapsedTimer);
  state.elapsedTimer = setInterval(() => {
    const elapsed = document.querySelector('#elapsed');
    if (!elapsed || !state.startedAt) return;
    const seconds = Math.floor((Date.now() - state.startedAt) / 1000);
    elapsed.textContent = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  }, 500);
}

function updateCaptionSettings() {
  const fontSize = Number(document.querySelector('#caption-size').value);
  const alignment = document.querySelector('#caption-align').value;
  const background = document.querySelector('#caption-bg').value;
  const opacity = Number(document.querySelector('#caption-opacity').value);
  const maxLines = Number(document.querySelector('#caption-lines').value);
  const monitorId = document.querySelector('#caption-monitor').value;
  const alwaysOnTop = document.querySelector('#caption-top').checked;
  const clickThrough = document.querySelector('#caption-click').checked;
  state.settings.obs.captionWindow.fontSize = fontSize;
  state.settings.obs.captionWindow.alignment = alignment;
  state.settings.obs.captionWindow.background = background;
  state.settings.obs.captionWindow.opacity = opacity;
  state.settings.obs.captionWindow.maxLines = maxLines;
  state.settings.obs.captionWindow.monitorId = monitorId;
  state.settings.obs.captionWindow.alwaysOnTop = alwaysOnTop;
  state.settings.obs.captionWindow.clickThrough = clickThrough;
  api.settings.update({ obs: { captionWindow: state.settings.obs.captionWindow } });
  api.caption.update({
    text: state.segments.slice(-state.settings.obs.captionWindow.maxLines).map((item) => item.text).join('\n'),
    ...state.settings.obs.captionWindow
  });
}

async function checkUpdates() {
  const box = document.querySelector('#update-result');
  box.innerHTML = '<p class="muted">Checking GitHub Releases...</p>';
  try {
    const result = await api.updates.check();
    state.latestRelease = result;
    state.downloadedUpdate = null;
    box.innerHTML = `
      <p>Current: ${result.currentVersion}</p>
      <p>Latest: ${result.latestVersion || 'Unknown'}</p>
      <p>${result.status === 'update-available' ? 'A newer version is available.' : 'The application is up to date.'}</p>
      ${
        result.updateAsset
          ? `<p>Installer: ${escapeHtml(result.updateAsset.name)}</p>
             <div class="meter" id="update-download-meter"><span></span></div>
             <p class="muted" id="update-download-label">Ready to download.</p>`
          : '<p class="muted">No Windows installer asset was found on this release.</p>'
      }
      <div class="toolbar">
        ${result.releaseUrl ? '<button id="open-release">View release</button>' : ''}
        ${
          result.status === 'update-available' && result.updateAsset
            ? '<button class="primary" id="download-update">Download update</button>'
            : ''
        }
      </div>`;
    document.querySelector('#open-release')?.addEventListener('click', () =>
      api.updates.openReleasePage(result.releaseUrl)
    );
    document.querySelector('#download-update')?.addEventListener('click', downloadUpdate);
  } catch (error) {
    box.textContent = userMessage(error);
  }
}

async function downloadUpdate() {
  const box = document.querySelector('#update-result');
  const asset = state.latestRelease?.updateAsset;
  if (!asset) return;
  try {
    const result = await api.updates.download(asset);
    state.downloadedUpdate = result;
    box.insertAdjacentHTML(
      'beforeend',
      `<div class="update-actions">
        <p>Downloaded: ${escapeHtml(result.fileName)}</p>
        <button id="show-update">Show in folder</button>
        <button class="primary" id="run-update">Run installer</button>
      </div>`
    );
    document.querySelector('#show-update').addEventListener('click', () =>
      api.updates.openDownloadFolder(result.filePath)
    );
    document.querySelector('#run-update').addEventListener('click', () =>
      api.updates.runInstaller(result.filePath)
    );
    toast('Update installer downloaded.');
  } catch (error) {
    toast(userMessage(error));
  }
}

function renderFirstRun() {
  const steps = [
    ['Welcome', 'Set up private local captions for accessibility, streaming, meetings, classes, and everyday transcription.'],
    ['Privacy', 'No telemetry, analytics, ads, automatic cloud upload, or automatic update checks are enabled.'],
    ['Microphone', 'Choose and test your microphone from the Audio section when you are ready.'],
    ['Transcription Model', 'Install a local Whisper model from Models. Local transcription is the default architecture.'],
    ['Accessibility', 'Adjust transcript size, contrast, motion, scaling, and caption display options.'],
    ['OBS / Streaming', 'OBS support is optional. You can choose a text file or use the caption window later.'],
    ['Finish', 'Setup is complete. You can revisit every option from Settings.']
  ];
  let index = 0;
  const dialog = document.querySelector('#first-run-dialog');
  const step = document.querySelector('#wizard-step');
  const titleElement = document.querySelector('#wizard-title');
  const copy = document.querySelector('#wizard-copy');
  const next = document.querySelector('#wizard-next');
  const skip = document.querySelector('#wizard-skip');
  const paint = () => {
    step.textContent = `Step ${index + 1} of ${steps.length}`;
    titleElement.textContent = steps[index][0];
    copy.textContent = steps[index][1];
    next.textContent = index === steps.length - 1 ? 'Finish' : 'Next';
  };
  const complete = async () => {
    state.settings = await api.settings.update({ general: { firstRunComplete: true } });
    dialog.close();
    state.active = 'live';
    render();
  };
  next.addEventListener('click', async (event) => {
    event.preventDefault();
    if (index === steps.length - 1) await complete();
    else {
      index += 1;
      paint();
    }
  });
  skip.addEventListener('click', async (event) => {
    event.preventDefault();
    await complete();
  });
  paint();
  dialog.showModal();
}

function bindSettingInput(selector, category, key, prop, after) {
  document.querySelector(selector).addEventListener('change', async (event) => {
    state.settings = await api.settings.update({ [category]: { [key]: event.target[prop] } });
    after?.();
  });
}

function applyTheme() {
  const theme = state.settings.appearance.theme;
  const light = theme === 'light' || (theme === 'system' && matchMedia('(prefers-color-scheme: light)').matches);
  document.body.classList.toggle('light', light);
  document.documentElement.style.setProperty(
    '--transcript-font',
    `${state.settings.accessibility.transcriptFontSize}px`
  );
  document.body.style.zoom = state.settings.appearance.interfaceScale;
  document.body.classList.toggle('large-controls', Boolean(state.settings.appearance.largeControls));
}

function shortcutLabel(key) {
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, (letter) => letter.toUpperCase());
}

function toast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.querySelector('#toast-region').append(toast);
  setTimeout(() => toast.remove(), 4200);
}

function confirmAction(titleText, messageText) {
  const dialog = document.querySelector('#confirm-dialog');
  document.querySelector('#confirm-title').textContent = titleText;
  document.querySelector('#confirm-message').textContent = messageText;
  dialog.showModal();
  return new Promise((resolve) => {
    dialog.addEventListener('close', () => resolve(dialog.returnValue === 'confirm'), { once: true });
  });
}

function inputAction(titleText, labelText, value = '') {
  const dialog = document.querySelector('#input-dialog');
  const input = document.querySelector('#input-value');
  document.querySelector('#input-title').textContent = titleText;
  document.querySelector('#input-label').textContent = labelText;
  input.value = value;
  dialog.showModal();
  input.focus();
  return new Promise((resolve) => {
    dialog.addEventListener(
      'close',
      () => resolve(dialog.returnValue === 'confirm' ? input.value.trim() : ''),
      { once: true }
    );
  });
}

function userMessage(error) {
  return error?.message || 'Something went wrong. Check diagnostics for details.';
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
