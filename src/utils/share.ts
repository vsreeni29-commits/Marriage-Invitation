import { weddingConfig } from '../config/weddingConfig';

export type ShareResult = 'shared' | 'copied' | 'dismissed' | 'unavailable';

/**
 * Shares the invitation.
 *
 * Web Share where it exists (most phones — which is where the invitation will
 * actually be opened), clipboard everywhere else, and a truthful
 * "unavailable" if neither is permitted, so the UI can tell the guest what to
 * do instead of failing silently.
 */
export async function shareInvitation(): Promise<ShareResult> {
  const { site, couple } = weddingConfig;
  const url = typeof window !== 'undefined' ? window.location.href : site.url;

  const payload: ShareData = {
    title: `${couple.bride} & ${couple.groom}`,
    text: site.shareMessage,
    url,
  };

  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share(payload);
      return 'shared';
    } catch (error) {
      // A cancelled share sheet is a normal outcome, not a failure.
      if (error instanceof DOMException && error.name === 'AbortError') return 'dismissed';
      // Anything else (permission policy, unsupported payload) falls through.
    }
  }

  const clipboardText = `${site.shareMessage} ${url}`;

  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(clipboardText);
      return 'copied';
    } catch {
      // Clipboard blocked — fall through.
    }
  }

  return legacyCopy(clipboardText) ? 'copied' : 'unavailable';
}

/** Pre-clipboard-API browsers, and Safari when permissions are strict. */
function legacyCopy(text: string): boolean {
  try {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(area);
    return ok;
  } catch {
    return false;
  }
}
