import { getSign } from '../zodiac/signs';

export const SIGN_STORAGE_KEY = 'ranking-zodiacal-sign';

export function readSavedSign(): string | null {
  try {
    return window.localStorage.getItem(SIGN_STORAGE_KEY);
  } catch {
    return null;
  }
}

function saveSign(slug: string): void {
  try {
    window.localStorage.setItem(SIGN_STORAGE_KEY, slug);
  } catch {
    // The saved sign is a convenience; navigation must work without storage.
  }
}

function markSavedSigns(savedSign: string | null): void {
  document.querySelectorAll<HTMLElement>('[data-sign-choice]').forEach((choice) => {
    const isSaved = savedSign === choice.dataset.signSlug;
    choice.classList.toggle('is-saved', isSaved);
    choice.dataset.saved = String(isSaved);
  });
}

function showSavedSignLink(savedSign: string | null): void {
  const sign = savedSign ? getSign(savedSign) : undefined;
  document.querySelectorAll<HTMLAnchorElement>('[data-saved-sign-link]').forEach((link) => {
    if (!sign) return;
    link.href = `/horoscopo/${sign.slug}/`;
    link.setAttribute('aria-label', `Tu signo: ${sign.name}`);
    link.querySelector('[data-saved-sign-symbol]')!.textContent = sign.symbol;
    link.querySelector('[data-saved-sign-name]')!.textContent = sign.name;
    link.hidden = false;
  });
}

export function initSignPreference(): void {
  document.querySelectorAll<HTMLElement>('[data-sign-choice]').forEach((choice) => {
    choice.addEventListener('click', () => {
      if (choice.dataset.signSlug) saveSign(choice.dataset.signSlug);
    });
  });
  const savedSign = readSavedSign();
  markSavedSigns(savedSign);
  showSavedSignLink(savedSign);
}
