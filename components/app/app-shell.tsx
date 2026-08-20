import * as React from 'react';
import { cn } from '@/lib/utils';

export interface AppShellProps extends React.ComponentProps<'div'> {
  header?: React.ReactNode;
  sidebar?: React.ReactNode;
  bottomNav?: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  children: React.ReactNode;
}

const maxWidthClasses = {
  sm: 'max-w-screen-sm',
  md: 'max-w-screen-md',
  lg: 'max-w-screen-lg',
  xl: 'max-w-screen-xl',
  '2xl': 'max-w-screen-2xl',
  full: 'max-w-full',
};

export function AppShell({
  header,
  sidebar,
  bottomNav,
  footer,
  maxWidth = 'full',
  className,
  children,
  ...props
}: AppShellProps) {
  return (
    <div
      data-slot="app-shell"
      className={cn('flex min-h-dvh flex-col bg-background text-foreground', className)}
      {...props}
    >
      {header && <header data-slot="app-header" className="sticky top-0 z-40 w-full">{header}</header>}

      <div className="flex flex-1 w-full">
        {sidebar && (
          <aside data-slot="app-sidebar" className="hidden md:flex shrink-0">
            {sidebar}
          </aside>
        )}

        <main
          data-slot="app-main"
          className={cn(
            'flex-1 w-full mx-auto pb-16 md:pb-6',
            maxWidthClasses[maxWidth]
          )}
        >
          {children}
        </main>
      </div>

      {footer && <footer data-slot="app-footer">{footer}</footer>}

      {bottomNav && (
        <nav
          data-slot="app-bottom-nav"
          className="fixed bottom-0 left-0 right-0 z-40 md:hidden"
        >
          {bottomNav}
        </nav>
      )}
    </div>
  );
}
