import { SUPPORTED_EXPORT_FORMATS } from './constants.js';

export function exportTranscript(transcript, format) {
  if (!SUPPORTED_EXPORT_FORMATS.has(format)) {
    throw new Error(`Unsupported export format: ${format}`);
  }

  if (format === 'json') {
    return JSON.stringify(transcript, null, 2);
  }

  if (format === 'txt') {
    return transcript.segments.map((segment) => segment.text).join('\n');
  }

  if (format === 'srt') {
    return transcript.segments
      .map((segment, index) =>
        [
          String(index + 1),
          `${formatSrtTime(segment.startMs)} --> ${formatSrtTime(segment.endMs ?? segment.startMs + 2000)}`,
          segment.text.trim()
        ].join('\n')
      )
      .join('\n\n');
  }

  return [
    'WEBVTT',
    '',
    ...transcript.segments.map((segment) =>
      [
        `${formatVttTime(segment.startMs)} --> ${formatVttTime(segment.endMs ?? segment.startMs + 2000)}`,
        segment.text.trim(),
        ''
      ].join('\n')
    )
  ].join('\n');
}

function formatSrtTime(ms = 0) {
  return formatTimestamp(ms, ',');
}

function formatVttTime(ms = 0) {
  return formatTimestamp(ms, '.');
}

function formatTimestamp(ms, separator) {
  const totalMs = Math.max(0, Math.floor(ms));
  const hours = Math.floor(totalMs / 3600000);
  const minutes = Math.floor((totalMs % 3600000) / 60000);
  const seconds = Math.floor((totalMs % 60000) / 1000);
  const millis = totalMs % 1000;
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}${separator}${String(millis).padStart(3, '0')}`;
}

function pad(number) {
  return String(number).padStart(2, '0');
}
