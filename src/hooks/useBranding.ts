import { useLocalStorage } from './useLocalStorage';

export interface BrandingSettings {
  companyName: string;
  tagline: string;
  logoUrl: string;       // base64 data URL or empty
  accentColor: string;   // hex color, e.g. "#f59e0b"
}

const DEFAULT_BRANDING: BrandingSettings = {
  companyName: '',
  tagline: '',
  logoUrl: '',
  accentColor: '#f59e0b',
};

export function useBranding(): { branding: BrandingSettings; setBranding: (value: BrandingSettings | ((prev: BrandingSettings) => BrandingSettings)) => void } {
  const [branding, setBranding] = useLocalStorage<BrandingSettings>('embark-branding', DEFAULT_BRANDING);
  return { branding, setBranding };
}
