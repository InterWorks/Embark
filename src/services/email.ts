/**
 * Email service — clipboard adapter.
 * Future: replace with fetch('/api/email', { method: 'POST', body })
 */

export interface EmailOptions {
  to?: string;
  subject?: string;
  body: string;
}

export interface EmailResult {
  success: boolean;
  mode: 'clipboard';
  message: string;
}

export async function send(opts: EmailOptions): Promise<EmailResult> {
  const text = opts.body;
  try {
    await navigator.clipboard.writeText(text);
    return {
      success: true,
      mode: 'clipboard',
      message: 'Copied — paste into your email client',
    };
  } catch {
    // Fallback for environments without clipboard API
    const el = document.createElement('textarea');
    el.value = text;
    el.style.position = 'fixed';
    el.style.opacity = '0';
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    return {
      success: true,
      mode: 'clipboard',
      message: 'Copied — paste into your email client',
    };
  }
}
