import { describe, expect, it } from 'vitest';
import { mergeSettings, validateSettings } from '../src/shared/validators.js';

describe('settings validation', () => {
  it('falls back from invalid theme and clamps numeric values', () => {
    const settings = mergeSettings({
      appearance: { theme: 'neon', interfaceScale: 9 },
      accessibility: { transcriptFontSize: 100 },
      audio: { sensitivity: -1 }
    });

    expect(settings.appearance.theme).toBe('system');
    expect(settings.appearance.interfaceScale).toBe(1.3);
    expect(settings.accessibility.transcriptFontSize).toBe(34);
    expect(settings.audio.sensitivity).toBe(0);
  });

  it('preserves valid nested caption window settings', () => {
    const settings = validateSettings(
      mergeSettings({ obs: { captionWindow: { alignment: 'right', opacity: 0.5, maxLines: 5 } } })
    );

    expect(settings.obs.captionWindow.alignment).toBe('right');
    expect(settings.obs.captionWindow.opacity).toBe(0.5);
    expect(settings.obs.captionWindow.maxLines).toBe(5);
  });
});
