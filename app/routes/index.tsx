import { Link, createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/')({ component: HomePage });

function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-3xl font-bold">Fullstack Payload Examples</h1>
      <p className="text-muted-foreground">Bun + Payload (API) + TanStack Router/Query/Store/Form/Virtual</p>
      <Link to="/posts" className="bg-primary text-primary-foreground rounded px-4 py-2">
        Ver exemplo (posts) →
      </Link>
    </main>
  );
}
