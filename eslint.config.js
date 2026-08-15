import js from '@eslint/js';

export default [
  js.configs.recommended,
  {
    ignores: ['node_modules/', 'release/', 'coverage/'],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: {
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        AbortController: 'readonly',
        AudioContext: 'readonly',
        AudioWorkletNode: 'readonly',
        AudioWorkletProcessor: 'readonly',
        MediaRecorder: 'readonly',
        Blob: 'readonly',
        URL: 'readonly',
        clearInterval: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        setTimeout: 'readonly',
        console: 'readonly',
        fetch: 'readonly',
        globalThis: 'readonly',
        matchMedia: 'readonly',
        process: 'readonly',
        registerProcessor: 'readonly',
        require: 'readonly',
        sampleRate: 'readonly',
        structuredClone: 'readonly',
        Buffer: 'readonly',
        Uint8Array: 'readonly'
      }
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }]
    }
  }
];
