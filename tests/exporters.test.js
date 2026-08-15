import { describe, expect, it } from 'vitest';
import { exportTranscript } from '../src/shared/exporters.js';

const transcript = {
  title: 'Demo',
  segments: [
    { text: 'Hello world', startMs: 0, endMs: 1200 },
    { text: 'Second line', startMs: 1300, endMs: 3000 }
  ]
};

describe('export generation', () => {
  it('exports plain text', () => {
    expect(exportTranscript(transcript, 'txt')).toBe('Hello world\nSecond line');
  });

  it('exports SRT timestamps', () => {
    expect(exportTranscript(transcript, 'srt')).toContain('00:00:00,000 --> 00:00:01,200');
  });

  it('exports VTT header', () => {
    expect(exportTranscript(transcript, 'vtt').startsWith('WEBVTT')).toBe(true);
  });

  it('rejects unsupported formats', () => {
    expect(() => exportTranscript(transcript, 'docx')).toThrow(/Unsupported/);
  });
});
