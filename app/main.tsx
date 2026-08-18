import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { queryClient } from './lib/query-client';
import '../styles/index.css';
import { routeTree } from './routeTree.gen';

const router = createRouter({
  routeTree,
  context: { queryClient },
  scrollRestoration: true,
  defaultPreloadStaleTime: 0,
});

const elem = document.getElementById('root')!;
const app = (
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>
);

(import.meta.hot.data.root ??= createRoot(elem)).render(app);

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
