import * as React from 'react';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export interface TopNavProps extends Omit<React.ComponentProps<'header'>, 'title'> {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  onBack?: () => void;
  backLabel?: string;
  leftAction?: React.ReactNode;
  rightAction?: React.ReactNode;
}

export function TopNav({
  title,
  subtitle,
  onBack,
  backLabel = 'Voltar',
  leftAction,
  rightAction,
  className,
  ...props
}: TopNavProps) {
  return (
    <header
      data-slot="top-nav"
      className={cn(
        'sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-border bg-background/95 backdrop-blur-md px-4 safe-area-pt transition-colors',
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-2 min-w-0">
        {onBack && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onBack}
            aria-label={backLabel}
            className="-ml-1"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        {leftAction}
        {(title || subtitle) && (
          <div className="flex flex-col min-w-0">
            {title && (
              <h1 className="text-base font-semibold leading-tight text-foreground truncate">
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="text-xs text-muted-foreground leading-tight truncate">
                {subtitle}
              </p>
            )}
          </div>
        )}
      </div>

      {rightAction && (
        <div className="flex items-center gap-2 shrink-0">
          {rightAction}
        </div>
      )}
    </header>
  );
}
