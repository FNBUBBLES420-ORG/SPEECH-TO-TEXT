export const APP_NAME = 'Speech-to-Text Application';
export const ORG_NAME = 'FNBUBBLES420 Org';
export const TRUSTED_RELEASE_HOSTS = new Set(['github.com']);
export const OFFICIAL_REPOSITORY = 'FNBUBBLES420-ORG/SPEECH-TO-TEXT';
export const OFFICIAL_RELEASE_URL = `https://github.com/${OFFICIAL_REPOSITORY}/releases`;
export const GITHUB_RELEASES_API_URL = `https://api.github.com/repos/${OFFICIAL_REPOSITORY}/releases`;

export const SUPPORTED_EXPORT_FORMATS = new Set(['txt', 'srt', 'vtt', 'json']);

export const MODEL_CATALOG = [
  {
    id: 'tiny',
    name: 'Whisper tiny',
    size: '75 MB',
    bytes: 78643200,
    recommendedUse: 'Fast captions on modest hardware',
    fileName: 'ggml-tiny.bin',
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.bin'
  },
  {
    id: 'base',
    name: 'Whisper base',
    size: '142 MB',
    bytes: 148897792,
    recommendedUse: 'Balanced everyday transcription',
    fileName: 'ggml-base.bin',
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.bin'
  },
  {
    id: 'small',
    name: 'Whisper small',
    size: '466 MB',
    bytes: 488636416,
    recommendedUse: 'Better accuracy for meetings and classes',
    fileName: 'ggml-small.bin',
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.bin'
  }
];

export const LANGUAGE_OPTIONS = [
  ['auto', 'Automatic detection'],
  ['en', 'English'],
  ['es', 'Spanish'],
  ['fr', 'French'],
  ['de', 'German'],
  ['it', 'Italian'],
  ['pt', 'Portuguese'],
  ['nl', 'Dutch'],
  ['pl', 'Polish'],
  ['uk', 'Ukrainian'],
  ['ru', 'Russian'],
  ['ja', 'Japanese'],
  ['ko', 'Korean'],
  ['zh', 'Chinese'],
  ['ar', 'Arabic'],
  ['hi', 'Hindi']
];
