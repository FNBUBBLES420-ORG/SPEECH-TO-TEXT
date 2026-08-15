import { describe, expect, it } from 'vitest';
import { floatTo16BitPcm, hasSpeech } from '../src/services/audio/audioConversion.js';

describe('audio conversion and voice activity detection', () => {
  it('converts float samples to 16-bit PCM', () => {
    const pcm = new Int16Array(floatTo16BitPcm(Float32Array.from([-1, 0, 1])));
    expect(pcm[0]).toBe(-32768);
    expect(pcm[1]).toBe(0);
    expect(pcm[2]).toBe(32767);
  });

  it('detects silence below threshold', () => {
    expect(hasSpeech(Float32Array.from([0.001, -0.001, 0.001]), 0.02)).toBe(false);
    expect(hasSpeech(Float32Array.from([0.5, -0.5, 0.4]), 0.02)).toBe(true);
  });
});
