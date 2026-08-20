import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ScreenHeader({
  title,
  subtitle,
  onBack,
  right,
  className,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  onBack?: () => void;
  right?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      data-slot="screen-header"
      className={cn(
        'sticky top-0 z-30 flex items-center gap-2 border-b border-border bg-background/95 px-3 py-2.5 backdrop-blur-md transition-colors',
        className
      )}
    >
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          aria-label="Voltar"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-muted active:scale-95"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      )}
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-base font-semibold leading-tight text-foreground">{title}</h1>
        {subtitle && <p className="truncate text-xs text-muted-foreground leading-tight">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}

export function ActionRow({
  icon,
  title,
  subtitle,
  badge,
  onClick,
  className,
}: {
  icon?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  badge?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-3 rounded-xl border border-border/60 bg-card p-3 text-left transition-all hover:bg-muted/50 active:scale-[0.99]',
        className
      )}
    >
      {icon && <div className="flex shrink-0 items-center justify-center text-primary">{icon}</div>}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium text-foreground">{title}</span>
          {badge}
        </div>
        {subtitle && <p className="text-xs text-muted-foreground truncate">{subtitle}</p>}
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground/60 shrink-0" />
    </button>
  );
}
