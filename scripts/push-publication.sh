#!/usr/bin/env bash
set -euo pipefail

# main puede avanzar mientras se genera y valida el contenido.
for attempt in 1 2 3; do
  git fetch origin main
  if ! git rebase origin/main; then
    git rebase --abort
    echo "La publicación tiene conflictos con main. Revisa el contenido antes de reintentar." >&2
    exit 1
  fi

  if git push origin HEAD:main; then
    exit 0
  fi

  echo "No se pudo publicar (intento ${attempt}/3)." >&2
done

echo "No se pudo publicar después de tres intentos. Revisa los errores de Git." >&2
exit 1
