# Relatório 06 — Integração do TanStack Form (@tanstack/react-form) e Correção do Formulário de Posts

## Resumo das Alterações

1. **Migração para `@tanstack/react-form` em `app/routes/posts/index.tsx`**:
   - Criação de post utilizando `useForm` do `@tanstack/react-form` com validação tipada no cliente para `title`, `slug`, `status` ('draft' | 'published') e `excerpt`.
   - Auto-geração inteligente do `slug` quando o título é digitado.
   - Gerenciamento de estado dos campos (`canSubmit`, `isSubmitting`, `errors`) com feedback em tempo real.
   - Formulário de login também migrado para `@tanstack/react-form` com validações de email e senha.

2. **Correção da Persistência de Autenticação e Credenciais**:
   - Habilitado `baseInit: { credentials: 'include' }` no SDK do Payload (`shared/lib/sdk.ts`) para que os cookies de sessão e autenticação sejam enviados em todas as mutações no servidor.
   - Adicionado auto-rehydration da sessão em `shared/stores/auth.ts` (`me()`) no carregamento da página.
   - Integração com `create()` otimista (0ms de delay no cliente com sincronização em background).

3. **Verificação de Qualidade**:
   - `bunx oxlint --quiet` executado com 0 erros.
   - `bun run build` gerou os bundles do cliente, servidor e service worker com sucesso.
