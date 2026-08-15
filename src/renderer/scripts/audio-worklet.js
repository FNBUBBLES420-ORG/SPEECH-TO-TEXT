class PcmCaptureProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.buffer = [];
    this.targetSamples = sampleRate * 3;
  }

  process(inputs) {
    const input = inputs[0]?.[0];
    if (!input) return true;
    this.buffer.push(...input);
    if (this.buffer.length >= this.targetSamples) {
      const chunk = this.downsampleTo16Khz(Float32Array.from(this.buffer.splice(0, this.targetSamples)));
      this.port.postMessage(chunk, [chunk.buffer]);
    }
    return true;
  }

  downsampleTo16Khz(samples) {
    if (sampleRate === 16000) return samples;
    const ratio = sampleRate / 16000;
    const length = Math.floor(samples.length / ratio);
    const result = new Float32Array(length);
    for (let index = 0; index < length; index += 1) {
      result[index] = samples[Math.floor(index * ratio)];
    }
    return result;
  }
}

registerProcessor('pcm-capture-processor', PcmCaptureProcessor);
