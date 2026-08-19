# `layers/` — apps secundárias (multi-app no monolito)

Para projetos com **mais de um frontend** (ex.: operador + kiosk + app de delivery),
todos compartilhando o MESMO `server/` e `shared/`. Não é monorepo — é um monolito
com vários frontends.

## Como funciona

Cada layer é uma **aplicação separada**:

- `index.html` próprio + rotas próprias (TanStack Router file-based).
- Montada no `index.ts` da raiz como **import de HTML**:

  ```ts
  import kiosk from '@/layers/kiosk/index.html';
  routes = { '/kiosk/*': kiosk, '/*': dashboard };
  ```

- **Customer-facing** (kiosk, QR de mesa) **não passa pelo auth guard** do dashboard.

## Regras

- Compartilhe componentes entre layers via `shared/` — não duplique.
- Mantenha a mesma paleta/estilo do dashboard.
