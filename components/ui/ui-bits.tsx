import * as React from 'react';
import { Star, Heart, BadgeCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Stars({
  nota,
  avaliacoes,
  className,
}: {
  nota: number;
  avaliacoes?: number;
  className?: string;
}) {
  return (
    <span className={cn('inline-flex items-center gap-1 text-xs text-muted-foreground', className)}>
      <Star className="fill-amber-400 text-amber-400 h-3.5 w-3.5 shrink-0" strokeWidth={0} />
      <span className="text-foreground font-medium">{nota.toFixed(1).replace('.', ',')}</span>
      {avaliacoes !== undefined && <span className="text-muted-foreground">({avaliacoes})</span>}
    </span>
  );
}

export function Indicacoes({
  total,
  className,
}: {
  total: number;
  className?: string;
}) {
  return (
    <span className={cn('text-muted-foreground inline-flex items-center gap-1 text-xs', className)}>
      <Heart className="fill-rose-500 text-rose-500 h-3.5 w-3.5 shrink-0" strokeWidth={0} />
      <span>{total} indicações</span>
    </span>
  );
}

export function Verificado({
  compact = false,
  className,
}: {
  compact?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'bg-primary/10 text-primary border border-primary/20 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold',
        className,
      )}
    >
      <BadgeCheck className="h-3 w-3 shrink-0" />
      {compact ? 'Verificado' : 'Perfil Verificado'}
    </span>
  );
}

const statusTone = {
  neutro: 'bg-secondary text-secondary-foreground border border-border',
  primary: 'bg-primary/15 text-primary border border-primary/20',
  accent: 'bg-accent/15 text-accent border border-accent/20',
  sucesso: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20',
  alerta: 'bg-amber-500/15 text-amber-400 border border-amber-500/20',
  perigo: 'bg-rose-500/15 text-rose-400 border border-rose-500/20',
};

export function StatusBadge({
  children,
  tone = 'neutro',
  className,
}: {
  children: React.ReactNode;
  tone?: keyof typeof statusTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium',
        statusTone[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function SectionTitle({
  children,
  action,
  className,
}: {
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('mb-3 flex items-center justify-between gap-3', className)}>
      <h2 className="text-foreground text-sm font-semibold tracking-tight">{children}</h2>
      {action}
    </div>
  );
}
