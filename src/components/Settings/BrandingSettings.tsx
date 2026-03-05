import { useRef } from 'react';
import { useBranding } from '../../hooks/useBranding';

export function BrandingSettings() {
  const { branding, setBranding } = useBranding();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result;
      if (typeof result === 'string') {
        setBranding(prev => ({ ...prev, logoUrl: result }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setBranding(prev => ({ ...prev, logoUrl: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Portal Branding
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Customize how your client portal appears. These settings apply to the client-facing portal view.
        </p>

        {/* Company Name */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Company Name
            </label>
            <input
              type="text"
              value={branding.companyName}
              onChange={e => setBranding(prev => ({ ...prev, companyName: e.target.value }))}
              placeholder="Your Company Name"
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 dark:focus:ring-violet-400 transition-colors"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Replaces "Embark" in the portal header when set.
            </p>
          </div>

          {/* Tagline */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Tagline
            </label>
            <input
              type="text"
              value={branding.tagline}
              onChange={e => setBranding(prev => ({ ...prev, tagline: e.target.value }))}
              placeholder="Client Onboarding Portal"
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 dark:focus:ring-violet-400 transition-colors"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Shown as a subtitle beneath the company name in the portal header.
            </p>
          </div>

          {/* Accent Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Accent Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={branding.accentColor}
                onChange={e => setBranding(prev => ({ ...prev, accentColor: e.target.value }))}
                className="w-10 h-10 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer bg-transparent p-0.5"
              />
              <input
                type="text"
                value={branding.accentColor}
                onChange={e => {
                  const val = e.target.value;
                  if (/^#[0-9a-fA-F]{0,6}$/.test(val)) {
                    setBranding(prev => ({ ...prev, accentColor: val }));
                  }
                }}
                placeholder="#f59e0b"
                className="w-32 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-violet-500 dark:focus:ring-violet-400 transition-colors"
              />
              <button
                onClick={() => setBranding(prev => ({ ...prev, accentColor: '#f59e0b' }))}
                className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 underline transition-colors"
              >
                Reset
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Applied to primary action buttons and progress bars in the portal.
            </p>
          </div>

          {/* Logo Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Logo
            </label>
            {branding.logoUrl ? (
              <div className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                <img
                  src={branding.logoUrl}
                  alt="Company logo"
                  className="h-12 w-auto max-w-[120px] object-contain rounded"
                />
                <div className="flex flex-col gap-1.5">
                  <p className="text-xs text-gray-600 dark:text-gray-400">Logo uploaded</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs px-2.5 py-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                    >
                      Replace
                    </button>
                    <button
                      onClick={handleRemoveLogo}
                      className="text-xs px-2.5 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-md hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-violet-400 dark:hover:border-violet-500 hover:bg-violet-50 dark:hover:bg-violet-900/10 transition-colors cursor-pointer"
              >
                <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-sm text-gray-500 dark:text-gray-400">Click to upload a logo</span>
                <span className="text-xs text-gray-400 dark:text-gray-500">PNG, JPG, SVG, WebP supported</span>
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleLogoChange}
              className="hidden"
            />
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Portal Header Preview</h4>
        <div
          className="rounded-xl overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700"
          style={{ background: `linear-gradient(to right, ${branding.accentColor}cc, ${branding.accentColor}99)` }}
        >
          <div className="px-6 py-5">
            <div className="flex items-center gap-4">
              {branding.logoUrl ? (
                <img
                  src={branding.logoUrl}
                  alt="Logo preview"
                  className="h-12 w-auto max-w-[100px] object-contain rounded bg-white/20 p-1"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              )}
              <div>
                <p className="text-white font-black text-xl leading-tight">
                  {branding.companyName || 'Embark'}
                </p>
                {branding.tagline && (
                  <p className="text-white/80 text-sm mt-0.5">{branding.tagline}</p>
                )}
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <div
                className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white"
                style={{ backgroundColor: 'rgba(255,255,255,0.25)' }}
              >
                Primary Button
              </div>
              <div className="h-2 flex-1 self-center rounded-full bg-white/30">
                <div
                  className="h-2 rounded-full bg-white/70"
                  style={{ width: '60%' }}
                />
              </div>
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
          Preview of how the portal header will appear to your clients.
        </p>
      </div>
    </div>
  );
}
