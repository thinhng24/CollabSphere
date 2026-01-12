/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_API_BASE_URL: string;
  readonly VITE_SIGNALR_URL: string;
  readonly VITE_AUTH_TOKEN_KEY: string;
  readonly VITE_AUTH_USER_KEY: string;
  readonly VITE_APP_NAME: string;
  readonly VITE_APP_VERSION: string;
  readonly VITE_ENABLE_NOTIFICATIONS: string;
  readonly VITE_ENABLE_FILE_UPLOAD: string;
  readonly VITE_ENABLE_VIDEO_CALL: string;
  readonly VITE_ENABLE_VOICE_CALL: string;
  readonly VITE_MAX_FILE_SIZE: string;
  readonly VITE_ALLOWED_FILE_TYPES: string;
  readonly VITE_DEBUG_MODE: string;
  readonly VITE_MOCK_API: string;
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly SSR: boolean;
  readonly MODE: string;
  readonly BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
