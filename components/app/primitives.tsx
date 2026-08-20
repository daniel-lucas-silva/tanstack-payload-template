import * as React from 'react';
import { BadgeCheck, Star, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AvatarBadge({
  name,
  color = '#6366f1',
  size = 40,
  online,
  className,
}: {
  name: string;
  color?: string;
  size?: number;
  online?: boolean;
  className?: string;
}) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  return (
    <span className={cn('relative inline-flex shrink-0', className)}>
      <span
        className="inline-flex items-center justify-center rounded-full font-semibold text-white shadow-xs select-none"
        style={{ backgroundColor: color, width: size, height: size, fontSize: size * 0.38 }}
        aria-hidden
      >
        {initials}
      </span>
      {online !== undefined && (
        <span
          className={cn(
            'absolute bottom-0 right-0 rounded-full border-2 border-background',
            online ? 'bg-emerald-500' : 'bg-muted-foreground/40'
          )}
          style={{ width: Math.max(8, size * 0.25), height: Math.max(8, size * 0.25) }}
        />
      )}
    </span>
  );
}

export function VerifiedBadge({
  verified,
  className,
}: {
  verified: boolean;
  className?: string;
}) {
  if (!verified) {
    return (
      <span
        className={cn(
          'inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-muted-foreground',
          className
        )}
      >
        Não verificado
      </span>
    );
  }
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary',
        className
      )}
    >
      <BadgeCheck className="h-3.5 w-3.5" />
      Verificado
    </span>
  );
}

export function StarRating({
  rating,
  total = 5,
  size = 14,
  showValue = true,
  className,
}: {
  rating: number;
  total?: number;
  size?: number;
  showValue?: boolean;
  className?: string;
}) {
  return (
    <div className={cn('inline-flex items-center gap-1 text-amber-500', className)}>
      {Array.from({ length: total }, (_, i) => (
        <Star
          key={i}
          className={cn(
            'fill-current',
            i < Math.floor(rating) ? 'text-amber-500' : 'text-muted-foreground/30'
          )}
          style={{ width: size, height: size }}
        />
      ))}
      {showValue && (
        <span className="text-xs font-semibold text-foreground ml-0.5">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}

export function FavoriteButton({
  isFavorite,
  onToggle,
  className,
}: {
  isFavorite: boolean;
  onToggle?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
      className={cn(
        'inline-flex h-8 w-8 items-center justify-center rounded-full bg-background/80 backdrop-blur-xs transition-transform active:scale-90 hover:bg-background shadow-xs',
        className
      )}
    >
      <Heart
        className={cn(
          'h-4 w-4 transition-colors',
          isFavorite ? 'fill-rose-500 text-rose-500' : 'text-muted-foreground'
        )}
      />
    </button>
  );
}
