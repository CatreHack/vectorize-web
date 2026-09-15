#!/usr/bin/env bash
# Build del frontend y publicacion en la rama gh-pages de GitHub Pages.
#
# Uso:
#   ./deploy.sh https://vectorize-api.onrender.com
#
# Requiere: GITHUB_TOKEN en ~/.hermes/.env (o en el entorno).
set -euo pipefail

API_BASE="${1:-${VITE_API_BASE:-}}"
if [ -z "$API_BASE" ]; then
  echo "ERROR: falta la URL del backend. Uso: ./deploy.sh https://tu-backend.onrender.com" >&2
  exit 1
fi

REPO="CatreHack/vectorize-web"
SITE_BASE="/vectorize-web/"

# Leer token si no esta en el entorno
if [ -z "${GITHUB_TOKEN:-}" ] && [ -f "$HOME/.hermes/.env" ]; then
  GITHUB_TOKEN=$(grep '^GITHUB_TOKEN=' "$HOME/.hermes/.env" | cut -d= -f2)
fi
if [ -z "${GITHUB_TOKEN:-}" ]; then
  echo "ERROR: falta GITHUB_TOKEN" >&2
  exit 1
fi

cd "$(dirname "$0")"

echo "==> Instalando dependencias"
npm install --no-audit --no-fund

echo "==> Build con API_BASE=$API_BASE"
VITE_API_BASE="$API_BASE" VITE_BASE="$SITE_BASE" npm run build

# GitHub Pages necesita .nojekyll para no ignorar archivos con _ o rutas raras
touch dist/.nojekyll

echo "==> Publicando en gh-pages"
cd dist
git init -q
git config user.name "CatreHack"
git config user.email "formandoe23@gmail.com"
git add -A
git commit -q -m "Deploy: build con backend $API_BASE"
git branch -M gh-pages
git remote add origin "https://CatreHack:${GITHUB_TOKEN}@github.com/${REPO}.git"
git push -f origin gh-pages
git remote set-url origin "https://github.com/${REPO}.git"

echo "==> Listo: https://catrehack.github.io${SITE_BASE}"
