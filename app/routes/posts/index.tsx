import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

import { useAuth, useCollection, useGlobal } from '@/shared/stores';

export const Route = createFileRoute('/posts/')({ component: PostsPage });

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/**
 * Golden path: como as três peças se encaixam.
 *
 * - `useGlobal('site-settings')` → dado global (siteName/tagline).
 * - `useCollection('posts')`    → lista + paginação + create/remove reativos.
 * - `useAuth()`                 → login (create exige `authenticated`).
 *
 * Tudo tipado fim-a-fim a partir do `Config` gerado pelo Payload.
 */
function PostsPage() {
  const { data: settings, findGlobal } = useGlobal('site-settings');
  const { user, login, logout } = useAuth();
  const { docs: posts, status, hasNextPage, find, loadMore, refresh, create, remove } = useCollection('posts');

  const [title, setTitle] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    // `find` sem `where`: o access control do config decide o que volta —
    // anônimo só recebe `published`, admin recebe tudo.
    void find({ limit: 5, sort: '-createdAt' });
    void findGlobal();
  }, [find, findGlobal]);

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault();
    await login({ email, password });
    setPassword('');
    // Re-busca com as novas permissões (agora aparecem os drafts).
    void refresh();
  }

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;
    // `slug` é required no tipo (slugField) — gerado aqui a partir do título.
    await create({ title, slug: slugify(title), status: 'draft' });
    setTitle('');
  }

  return (
    <main className="mx-auto max-w-2xl space-y-6 p-8">
      <header>
        <h1 className="text-3xl font-bold">{settings?.siteName ?? 'Posts'}</h1>
        {settings?.tagline && <p className="text-muted-foreground">{settings.tagline}</p>}
      </header>

      <section className="rounded border p-4">
        {user ? (
          <div className="flex items-center justify-between">
            <span>
              Logado como <strong>{user.email}</strong>
            </span>
            <button type="button" onClick={logout}>
              Sair
            </button>
          </div>
        ) : (
          <form onSubmit={handleLogin} className="flex gap-2">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email" required />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="senha"
              required
            />
            <button type="submit">Entrar</button>
          </form>
        )}
      </section>

      <section className="rounded border p-4">
        <h2 className="mb-2 font-semibold">Criar post</h2>
        <form onSubmit={handleCreate} className="flex gap-2">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título" required />
          <button type="submit">Criar</button>
        </form>
      </section>

      <section>
        <h2 className="mb-2 font-semibold">Posts ({posts.length})</h2>
        {status === 'loading' && <p className="text-muted-foreground">Carregando…</p>}
        {status === 'error' && <p className="text-destructive">Erro ao carregar.</p>}
        <ul className="divide-y">
          {posts.map((post) => (
            <li key={post.id} className="flex items-center justify-between py-2">
              <span>
                {post.title} <span className="text-muted-foreground">· {post.status}</span>
              </span>
              <button type="button" onClick={() => void remove(post.id)}>
                Remover
              </button>
            </li>
          ))}
        </ul>
        {hasNextPage && (
          <button type="button" onClick={() => void loadMore()} className="mt-2">
            Carregar mais
          </button>
        )}
      </section>
    </main>
  );
}
