export function initShare(): void {
  document.querySelectorAll<HTMLButtonElement>('[data-share]').forEach((button) => {
    button.addEventListener('click', async () => {
      const url = window.location.href;
      const status = button.parentElement?.querySelector('[data-share-status]');
      const confirm = (message: string) => {
        button.classList.add('is-confirmed');
        if (status) status.textContent = message;
        window.setTimeout(() => button.classList.remove('is-confirmed'), 1800);
      };

      try {
        if (navigator.share) {
          await navigator.share({ title: document.title, text: 'Mira este horóscopo semanal en Ranking Zodiacal', url });
          confirm('Compartido');
        } else if (navigator.clipboard) {
          await navigator.clipboard.writeText(url);
          confirm('Enlace copiado');
        } else if (status) {
          status.textContent = 'Copia el enlace desde tu navegador';
        }
      } catch {
        if (status) status.textContent = 'Puedes copiar el enlace desde tu navegador';
      }
    });
  });
}
