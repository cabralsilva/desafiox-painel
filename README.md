# DESAFIOX Painel

Painel de gestão administrativa do DESAFIOX (web, Android e iOS via Capacitor).

Tema dark-first, identidade visual do app (`DESAFIO` + `X` em `#e10600`, fonte Gantari).

## Desenvolvimento

```bash
yarn
yarn dev:web
```

API local: `VITE_API_URL` (padrão `http://localhost:8086`).

Login administrativo: `POST /admin/signin` (Basic e-mail:senha contra contas em `/admin/account`).

## Nativo

```bash
npx cap add android
npx cap add ios
yarn build:android
npx cap run android
```
