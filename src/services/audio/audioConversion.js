export function floatTo16BitPcm(floatSamples) {
  const output = new Int16Array(floatSamples.length);
  for (let index = 0; index < floatSamples.length; index += 1) {
    const sample = Math.max(-1, Math.min(1, floatSamples[index]));
    output[index] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
  }
  return output.buffer;
}

export function hasSpeech(floatSamples, threshold = 0.02) {
  if (!floatSamples?.length) return false;
  let sum = 0;
  for (const sample of floatSamples) sum += sample * sample;
  const rms = Math.sqrt(sum / floatSamples.length);
  return rms >= threshold;
}
