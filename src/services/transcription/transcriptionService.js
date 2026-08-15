import crypto from 'node:crypto';
import { floatTo16BitPcm, hasSpeech } from '../audio/audioConversion.js';

export class TranscriptionService {
  constructor(services, mainWindow) {
    this.services = services;
    this.mainWindow = mainWindow;
    this.active = false;
    this.paused = false;
    this.backend = null;
  }

  async start(options = {}) {
    if (this.active) return { active: true };
    this.active = true;
    this.paused = false;
    this.services.obs.setListening(true);
    this.backend = await createWhisperBackend(this.services, options);
    this.emit('transcription:status', {
      listening: true,
      paused: false,
      engineReady: this.backend.ready,
      message: this.backend.ready
        ? 'Local Whisper engine ready.'
        : 'Local Whisper backend is not installed or no model is selected.'
    });
    return { active: true, backend: this.backend.name, ready: this.backend.ready };
  }

  pause() {
    this.paused = true;
    this.emit('transcription:status', { listening: this.active, paused: true });
    return true;
  }

  resume() {
    this.paused = false;
    this.emit('transcription:status', { listening: this.active, paused: false });
    return true;
  }

  stop() {
    this.active = false;
    this.paused = false;
    this.backend?.release?.();
    this.backend = null;
    this.services.obs.setListening(false);
    this.emit('transcription:status', { listening: false, paused: false });
    return true;
  }

  async submitAudio(chunk) {
    if (!this.active || this.paused) return { ignored: true };
    const settings = this.services.settings.get();
    if (settings.transcription.vadEnabled && !hasSpeech(chunk.samples, settings.transcription.vadThreshold)) {
      return { ignored: true, reason: 'silence' };
    }
    if (!this.backend?.ready) {
      return { ignored: true, reason: 'backend-unavailable' };
    }
    const result = await this.backend.transcribe(chunk);
    if (result?.text) {
      this.emit('transcription:segment', result);
      await this.services.obs.writeCaptionText(result.text);
    }
    return result;
  }

  emit(channel, payload) {
    this.mainWindow.webContents.send(channel, payload);
  }
}

async function createWhisperBackend(services, options) {
  const modelId = options.model || services.settings.get().transcription.defaultModel;
  const models = await services.models.list();
  const model = models.find((item) => item.id === modelId);
  if (!model?.installed) return unavailableBackend('Install a local model before starting transcription.');

  try {
    const { initWhisper } = await import('@fugood/whisper.node');
    const context = await initWhisper({ model: model.path, useGpu: Boolean(options.useGpu) });
    return {
      name: '@fugood/whisper.node',
      ready: true,
      async transcribe(chunk) {
        const audioBuffer = floatTo16BitPcm(chunk.samples);
        const { promise } = context.transcribeData(audioBuffer, {
          language: options.language === 'auto' ? undefined : options.language,
          temperature: 0
        });
        const text = await promise;
        const resultText = String(text?.result || text || '').trim();
        return {
          id: crypto.randomUUID(),
          text: resultText,
          final: true,
          startMs: chunk.startMs || 0,
          endMs: chunk.endMs || 0,
          language: options.language || 'auto',
          model: model.id
        };
      },
      release: () => context.release()
    };
  } catch (error) {
    await services.logger.warn('Local Whisper binding unavailable', { message: error.message });
    return unavailableBackend('The local Whisper native binding could not be loaded.');
  }
}


function unavailableBackend(reason) {
  return {
    name: 'local-whisper',
    ready: false,
    reason,
    async transcribe() {
      return { ignored: true, reason };
    }
  };
}
