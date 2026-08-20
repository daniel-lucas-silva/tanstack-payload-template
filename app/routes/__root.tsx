import { Outlet, createRootRoute } from '@tanstack/react-router';
import { OfflineBanner, UpdateBanner, InstallPrompt } from '@/shared/pwa';
import { SyncFloatingIndicator } from '@/shared/sync';

export const Route = createRootRoute({ component: RootLayout });

function RootLayout() {
  return (
    <>
      <OfflineBanner />
      <UpdateBanner />
      <Outlet />
      <InstallPrompt />
      <SyncFloatingIndicator />
    </>
  );
}
