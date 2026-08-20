import { createFileRoute, Link } from '@tanstack/react-router';
import { useForm } from '@tanstack/react-form';
import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Clock,
  Trash2,
  Send,
  CheckCircle2,
  Cloud,
  Lock,
  UserCheck,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

import { useAuth, useCollection, useGlobal, SyncStatusBadge } from '@/shared/stores';

export const Route = createFileRoute('/posts/')({ component: PostsPage });

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/**
 * Golden path com TanStack Form (@tanstack/react-form), Offline-First & Zero Delay:
 *
 * - `@tanstack/react-form`      → Validação tipada, controle reativo de campos e submissão limpa.
 * - `useGlobal('site-settings')` → Configurações do site via SDK/cache local.
 * - `useCollection('posts')`    → Lista imediata via IndexedDB + criação/remoção otimista (0ms).
 * - `useAuth('users')`          → Estado de autenticação reativo + auto-restauração de sessão.
 */
function PostsPage() {
  const { data: settings, findGlobal } = useGlobal('site-settings');
  const { user, login, logout, error: authError, status: authStatus } = useAuth();
  const {
    docs: posts,
    status: collectionStatus,
    hasNextPage,
    find,
    loadMore,
    refresh,
    create,
    remove,
    isFromCache,
  } = useCollection('posts');

  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    void find({ limit: 10, sort: '-createdAt' });
    void findGlobal();
  }, [find, findGlobal]);

  // ---------------------------------------------------------------------------
  // Formulário de Criação de Post com @tanstack/react-form
  // ---------------------------------------------------------------------------
  const postForm = useForm({
    defaultValues: {
      title: '',
      slug: '',
      status: 'draft' as 'draft' | 'published',
      excerpt: '',
    },
    onSubmit: async ({ value, formApi }) => {
      setFeedbackMsg(null);
      const title = value.title.trim();
      const slug = value.slug.trim() || slugify(title);
      const status = value.status;
      const excerpt = value.excerpt.trim() || undefined;

      try {
        // Criação otimista imediata (0ms de delay) via store reativo
        await create({
          title,
          slug,
          status,
          ...(excerpt ? { excerpt } : {}),
        });

        formApi.reset();
        setFeedbackMsg({
          type: 'success',
          text: 'Post criado com sucesso! (Salvo localmente e sincronizando em background)',
        });
      } catch (err: any) {
        setFeedbackMsg({
          type: 'error',
          text: `Erro ao criar post: ${err?.message || 'Falha desconhecida'}`,
        });
      }
    },
  });

  // ---------------------------------------------------------------------------
  // Formulário de Login com @tanstack/react-form
  // ---------------------------------------------------------------------------
  const loginForm = useForm({
    defaultValues: {
      email: 'admin@payloadcms.com',
      password: 'admin',
    },
    onSubmit: async ({ value }) => {
      setFeedbackMsg(null);
      try {
        await login({ email: value.email, password: value.password });
        void refresh();
      } catch (err: any) {
        setFeedbackMsg({
          type: 'error',
          text: `Erro de login: ${err?.message || 'Credenciais inválidas'}`,
        });
      }
    },
  });

  return (
    <main className="mx-auto max-w-2xl space-y-6 p-6 md:p-8 bg-zinc-950 min-h-screen text-zinc-100">
      {/* Header & Status */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Voltar ao Início
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            {settings?.siteName ?? 'Gerenciamento de Posts'}
          </h1>
          {settings?.tagline && <p className="text-xs text-zinc-400 mt-0.5">{settings.tagline}</p>}
        </div>
        <div className="flex items-center gap-2">
          <SyncStatusBadge />
          {isFromCache && (
            <span className="inline-flex items-center gap-1 rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">
              <Cloud className="h-3 w-3" /> Cache Local
            </span>
          )}
        </div>
      </header>

      {/* Auth Section */}
      <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
        {user ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <UserCheck className="h-4 w-4" />
              </div>
              <div>
                <span className="text-zinc-300">
                  Autenticado como <strong className="text-zinc-100">{user.email}</strong>
                </span>
                <span className="ml-2 rounded bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.5 text-[10px] font-mono text-indigo-300">
                  {user.roles?.join(', ') || 'user'}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => void logout()}
              className="self-start sm:self-auto rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-700 transition-colors"
            >
              Encerrar Sessão
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-300">
                <Lock className="h-3.5 w-3.5" /> Acesso Restrito (Autenticação do Payload)
              </span>
              <span className="text-[11px] text-zinc-400">Padrão: admin@payloadcms.com / admin</span>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                void loginForm.handleSubmit();
              }}
              className="flex flex-col sm:flex-row gap-2"
            >
              <loginForm.Field
                name="email"
                validators={{
                  onChange: ({ value }) => (!value ? 'Email é obrigatório' : undefined),
                }}
              >
                {(field) => (
                  <div className="flex-1 space-y-1">
                    <input
                      type="email"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="admin@payloadcms.com"
                      className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    {field.state.meta.errors && (
                      <p className="text-[10px] text-rose-400">{field.state.meta.errors[0]}</p>
                    )}
                  </div>
                )}
              </loginForm.Field>

              <loginForm.Field
                name="password"
                validators={{
                  onChange: ({ value }) => (!value ? 'Senha é obrigatória' : undefined),
                }}
              >
                {(field) => (
                  <div className="flex-1 space-y-1">
                    <input
                      type="password"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="admin"
                      className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    {field.state.meta.errors && (
                      <p className="text-[10px] text-rose-400">{field.state.meta.errors[0]}</p>
                    )}
                  </div>
                )}
              </loginForm.Field>

              <loginForm.Subscribe
                selector={(state) => [state.canSubmit, state.isSubmitting]}
              >
                {([canSubmit, isSubmitting]) => (
                  <button
                    type="submit"
                    disabled={!canSubmit || isSubmitting || authStatus === 'loading'}
                    className="rounded-lg bg-zinc-100 px-4 py-1.5 text-xs font-semibold text-zinc-900 hover:bg-white disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    {isSubmitting || authStatus === 'loading' ? 'Entrando...' : 'Entrar'}
                  </button>
                )}
              </loginForm.Subscribe>
            </form>

            {authError && (
              <p className="text-xs text-rose-400 flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5" /> {authError}
              </p>
            )}
          </div>
        )}
      </section>

      {/* TanStack React Form: Instant Create Section */}
      <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
              Novo Post (@tanstack/react-form)
            </h2>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Validação tipada no cliente e resposta otimista instantânea (0ms).
            </p>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            void postForm.handleSubmit();
          }}
          className="space-y-3"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Title Field */}
            <div className="sm:col-span-2 space-y-1">
              <label htmlFor="post-title" className="text-[11px] font-medium text-zinc-300">
                Título do Post <span className="text-rose-400">*</span>
              </label>
              <postForm.Field
                name="title"
                validators={{
                  onChange: ({ value }) => {
                    if (!value || value.trim().length < 2) {
                      return 'O título deve ter pelo menos 2 caracteres';
                    }
                    return undefined;
                  },
                }}
              >
                {(field) => (
                  <div>
                    <input
                      id="post-title"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => {
                        field.handleChange(e.target.value);
                        // Auto-gera o slug se o campo de slug estiver vazio
                        const currentSlug = postForm.getFieldValue('slug');
                        if (!currentSlug) {
                          postForm.setFieldValue('slug', slugify(e.target.value));
                        }
                      }}
                      placeholder="Ex: Introdução ao Payload CMS 3.88"
                      className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    {field.state.meta.errors && (
                      <p className="text-[10px] text-rose-400 mt-1">{field.state.meta.errors[0]}</p>
                    )}
                  </div>
                )}
              </postForm.Field>
            </div>

            {/* Status Select Field */}
            <div className="space-y-1">
              <label htmlFor="post-status" className="text-[11px] font-medium text-zinc-300">
                Status
              </label>
              <postForm.Field name="status">
                {(field) => (
                  <select
                    id="post-status"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value as 'draft' | 'published')}
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="draft">Rascunho (draft)</option>
                    <option value="published">Publicado (published)</option>
                  </select>
                )}
              </postForm.Field>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Slug Field */}
            <div className="space-y-1">
              <label htmlFor="post-slug" className="text-[11px] font-medium text-zinc-300">
                Slug (URL)
              </label>
              <postForm.Field name="slug">
                {(field) => (
                  <input
                    id="post-slug"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(slugify(e.target.value))}
                    placeholder="introducao-ao-payload-cms"
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs font-mono text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                )}
              </postForm.Field>
            </div>

            {/* Excerpt Field */}
            <div className="space-y-1">
              <label htmlFor="post-excerpt" className="text-[11px] font-medium text-zinc-300">
                Resumo (opcional)
              </label>
              <postForm.Field name="excerpt">
                {(field) => (
                  <input
                    id="post-excerpt"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Breve resumo da publicação..."
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                )}
              </postForm.Field>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <postForm.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}
            >
              {([canSubmit, isSubmitting]) => (
                <button
                  type="submit"
                  disabled={!canSubmit || isSubmitting}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors cursor-pointer"
                >
                  <Send className="h-3.5 w-3.5" />
                  {isSubmitting ? 'Gravando...' : 'Criar Post'}
                </button>
              )}
            </postForm.Subscribe>

            <span className="text-[11px] text-zinc-400">
              {user ? '✓ Sincronização direta habilitada' : 'ℹ️ Salva localmente; login sincroniza com o servidor'}
            </span>
          </div>
        </form>

        {feedbackMsg && (
          <div
            className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
              feedbackMsg.type === 'success'
                ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/50'
                : 'bg-rose-950/40 text-rose-300 border border-rose-800/50'
            }`}
          >
            {feedbackMsg.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            )}
            <span>{feedbackMsg.text}</span>
          </div>
        )}
      </section>

      {/* Posts List */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Posts Cadastrados ({posts.length})
          </h2>
          {collectionStatus === 'loading' && posts.length === 0 && (
            <span className="text-xs text-zinc-500">Carregando...</span>
          )}
        </div>

        {posts.length === 0 && collectionStatus !== 'loading' && (
          <div className="rounded-xl border border-dashed border-zinc-800 p-8 text-center text-xs text-zinc-500">
            Nenhum post cadastrado ainda. Use o formulário acima para criar o primeiro post com TanStack Form.
          </div>
        )}

        <ul className="divide-y divide-zinc-800/80 rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
          {posts.map((post) => {
            const isOptimistic = Boolean((post as any)._optimistic);
            return (
              <li
                key={post.id}
                className={`flex items-center justify-between p-4 transition-colors ${
                  isOptimistic ? 'bg-indigo-950/20' : 'hover:bg-zinc-900/60'
                }`}
              >
                <div className="space-y-1 pr-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-zinc-100">{post.title}</span>
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] uppercase font-mono ${
                        post.status === 'published'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                          : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {post.status}
                    </span>
                    {isOptimistic ? (
                      <span className="inline-flex items-center gap-1 text-[10px] text-indigo-400 font-mono">
                        <Clock className="h-3 w-3 animate-pulse" /> Salvando...
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-500/70">
                        <CheckCircle2 className="h-3 w-3" /> Sincronizado
                      </span>
                    )}
                  </div>
                  {post.excerpt && <p className="text-xs text-zinc-400">{post.excerpt}</p>}
                  <p className="text-[11px] text-zinc-500 font-mono">
                    Slug: /{post.slug} · ID: {String(post.id)}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => void remove(post.id)}
                  title="Remover post"
                  className="rounded p-2 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            );
          })}
        </ul>

        {hasNextPage && (
          <button
            type="button"
            onClick={() => void loadMore()}
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900/60 py-2.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            Carregar mais posts
          </button>
        )}
      </section>
    </main>
  );
}
