import type { EmbedType, EmbedMedia } from '../types';

const ALLOWED_HOSTNAMES = new Set([
  'loom.com',
  'www.loom.com',
  'youtube.com',
  'www.youtube.com',
  'youtu.be',
  'calendly.com',
  'typeform.com',
  'www.typeform.com',
]);

function isAllowedUrl(url: string): boolean {
  if (!url) return false;
  try {
    const u = new URL(url);
    const scheme = u.protocol.toLowerCase();
    if (scheme === 'javascript:' || scheme === 'data:') return false;
    return ALLOWED_HOSTNAMES.has(u.hostname.toLowerCase());
  } catch {
    return false;
  }
}

export function detectEmbedType(url: string): EmbedType | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    if (host.includes('loom.com')) return 'loom';
    if (host.includes('youtube.com') || host.includes('youtu.be')) return 'youtube';
    if (host.includes('calendly.com')) return 'calendly';
    if (host.includes('typeform.com')) return 'typeform';
    return 'iframe';
  } catch {
    return null;
  }
}

export function getEmbedUrl(embed: EmbedMedia): string {
  // Convert Loom share URLs to embed URLs
  // Convert YouTube watch URLs to embed URLs
  // Calendly and Typeform URLs can be used as-is
  const url = embed.url;
  if (embed.type === 'youtube') {
    // https://www.youtube.com/watch?v=ID -> https://www.youtube.com/embed/ID
    // https://youtu.be/ID -> https://www.youtube.com/embed/ID
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?/]+)/);
    if (ytMatch) {
      const embedUrl = `https://www.youtube.com/embed/${ytMatch[1]}`;
      return isAllowedUrl(embedUrl) ? embedUrl : '';
    }
  }
  if (embed.type === 'loom') {
    // https://www.loom.com/share/ID -> https://www.loom.com/embed/ID
    const loomMatch = url.match(/loom\.com\/share\/([^?/]+)/);
    if (loomMatch) {
      const embedUrl = `https://www.loom.com/embed/${loomMatch[1]}`;
      return isAllowedUrl(embedUrl) ? embedUrl : '';
    }
  }
  return isAllowedUrl(url) ? url : '';
}

export function getEmbedLabel(type: EmbedType): string {
  const labels: Record<EmbedType, string> = {
    loom: 'Loom Video',
    youtube: 'YouTube Video',
    calendly: 'Calendly Booking',
    typeform: 'Typeform',
    iframe: 'Embedded Content',
  };
  return labels[type];
}

export function getEmbedIcon(type: EmbedType): string {
  const icons: Record<EmbedType, string> = {
    loom: '📹',
    youtube: '▶️',
    calendly: '📅',
    typeform: '📝',
    iframe: '🔗',
  };
  return icons[type];
}
