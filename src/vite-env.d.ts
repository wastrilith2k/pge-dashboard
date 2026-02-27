/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_WATTTIME_USERNAME: string;
  readonly VITE_WATTTIME_PASSWORD: string;
  readonly VITE_EIA_API_KEY: string;
  readonly VITE_DEMO_MODE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
