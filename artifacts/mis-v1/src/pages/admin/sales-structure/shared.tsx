import type { ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { ArrowRight, GitBranch, Network, UsersRound } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function SalesStructureGuard({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  if (user?.profileId !== 1 && user?.profileId !== 2) {
    return (
      <div className="mx-auto flex min-h-[70dvh] max-w-3xl items-center justify-center p-6">
        <section className="w-full rounded-2xl border bg-card p-8 text-center shadow-sm">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-amber-100 text-amber-800">
            <Network className="h-5 w-5" />
          </div>
          <h1 className="mt-4 text-xl font-semibold tracking-tight">Administration access required</h1>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            Sales Structure setup is restricted to SuperAdmin and System Admin profiles.
          </p>
        </section>
      </div>
    );
  }
  return <>{children}</>;
}

export function SalesStructureHeader({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  const [location] = useLocation();
  const structureActive = location === '/admin/sales-structure';
  return (
    <div className="mx-auto max-w-[1480px] space-y-6 p-4 pb-12 sm:p-6 lg:p-8">
      <div className="relative overflow-hidden rounded-2xl border border-[#c7d8d2] bg-[#edf4ef] px-5 py-6 sm:px-8 sm:py-8">
        <div className="pointer-events-none absolute -right-8 -top-20 h-72 w-72 rounded-full border-[1px] border-[#c4d6ce] opacity-70" />
        <div className="pointer-events-none absolute -right-2 -top-14 h-56 w-56 rounded-full border-[1px] border-[#c4d6ce] opacity-70" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.17em] text-[#326556]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#2d7460]" />
              {eyebrow}
            </div>
            <h1 className="text-3xl font-semibold tracking-[-0.04em] text-[#173c34] sm:text-[2.55rem]">{title}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#4d6c62] sm:text-[15px]">{description}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {children}
          </div>
        </div>
        <div className="relative mt-7 flex flex-wrap items-center gap-1 border-t border-[#cbdad4] pt-4">
          <Link
            href="/admin/sales-structure"
            className={cn(
              'inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              structureActive ? 'bg-[#1f5849] text-white shadow-sm' : 'text-[#4d6c62] hover:bg-white/70',
            )}
            data-testid="link-sales-structure"
          >
            <GitBranch className="h-4 w-4" />
            Structure
          </Link>
          <Link
            href="/admin/sales-structure/managers"
            className={cn(
              'inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              !structureActive ? 'bg-[#1f5849] text-white shadow-sm' : 'text-[#4d6c62] hover:bg-white/70',
            )}
            data-testid="link-manager-enrollment"
          >
            <UsersRound className="h-4 w-4" />
            Manager enrollment
          </Link>
          <span className="ml-auto hidden items-center gap-2 pr-1 text-xs text-[#54766a] md:flex">
            AAR Insurance <ArrowRight className="h-3.5 w-3.5" /> Sales operations
          </span>
        </div>
      </div>
    </div>
  );
}

export function QuietButton({
  children,
  onClick,
  disabled,
  testId,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  testId: string;
}) {
  return (
    <Button variant="outline" onClick={onClick} disabled={disabled} data-testid={testId} className="gap-2 bg-card">
      {children}
    </Button>
  );
}
