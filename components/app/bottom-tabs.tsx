import * as React from 'react';
import { cn } from '@/lib/utils';

export interface TabItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: string | number;
  href?: string;
  active?: boolean;
  onClick?: () => void;
}

export interface BottomTabsProps extends Omit<React.ComponentProps<'div'>, 'onSelect'> {
  items: TabItem[];
  activeId?: string;
  onSelect?: (id: string) => void;
}

export function BottomTabs({
  items,
  activeId,
  onSelect,
  className,
  ...props
}: BottomTabsProps) {
  return (
    <div
      data-slot="bottom-tabs"
      role="tablist"
      aria-label="Mobile Navigation"
      className={cn(
        'flex items-center justify-around border-t border-border bg-background/95 backdrop-blur-md px-2 py-1 safe-area-pb transition-colors',
        className
      )}
      {...props}
    >
      {items.map((item) => {
        const isActive = item.active ?? (activeId === item.id);

        const handleClick = () => {
          if (item.onClick) item.onClick();
          if (onSelect) onSelect(item.id);
        };

        const content = (
          <div className="relative flex flex-col items-center justify-center gap-0.5 py-1 px-2">
            <div className="relative">
              <span className="text-current">{item.icon}</span>
              {item.badge !== undefined && item.badge !== null && item.badge !== 0 && (
                <span className="absolute -top-1.5 -right-2.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                  {item.badge}
                </span>
              )}
            </div>
            <span className="text-[11px] font-medium leading-none tracking-tight">
              {item.label}
            </span>
          </div>
        );

        if (item.href) {
          return (
            <a
              key={item.id}
              href={item.href}
              role="tab"
              aria-selected={isActive}
              onClick={handleClick}
              className={cn(
                'group relative flex min-h-[48px] flex-1 flex-col items-center justify-center rounded-lg transition-colors select-none',
                isActive
                  ? 'text-primary font-semibold'
                  : 'text-muted-foreground hover:text-foreground active:scale-95'
              )}
            >
              {content}
            </a>
          );
        }

        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={handleClick}
            className={cn(
              'group relative flex min-h-[48px] flex-1 flex-col items-center justify-center rounded-lg transition-colors select-none outline-none focus-visible:ring-2 focus-visible:ring-ring',
              isActive
                ? 'text-primary font-semibold'
                : 'text-muted-foreground hover:text-foreground active:scale-95'
            )}
          >
            {content}
          </button>
        );
      })}
    </div>
  );
}
