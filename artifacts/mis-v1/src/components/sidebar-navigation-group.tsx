import { type ReactNode, useEffect, useState } from 'react';
import { ChevronRight, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type SidebarNavigationGroupProps = {
  id: string;
  label: string | null;
  icon?: LucideIcon;
  active: boolean;
  location: string;
  section?: boolean;
  children: ReactNode;
};

export function SidebarNavigationGroup({
  id, label, icon: Icon, active, location, section = false, children,
}: SidebarNavigationGroupProps) {
  const [expanded, setExpanded] = useState(active);

  // Reveal the destination on navigation, but allow the current group to be
  // collapsed without navigating away or closing the mobile sidebar.
  useEffect(() => {
    if (active) setExpanded(true);
  }, [active, location]);

  if (!label) return <div className="space-y-0.5">{children}</div>;

  return (
    <div className="space-y-0.5">
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls={id}
        onClick={() => setExpanded(value => !value)}
        className={cn(
          'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          section
            ? 'text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:bg-muted hover:text-foreground'
            : active
              ? 'bg-primary text-sm font-medium text-primary-foreground'
              : 'text-sm text-muted-foreground hover:bg-muted hover:text-foreground',
        )}
      >
        {Icon && <Icon className="h-4 w-4 shrink-0" />}
        <span className="flex-1">{label}</span>
        <ChevronRight
          aria-hidden="true"
          className={cn('h-3.5 w-3.5 shrink-0 transition-transform', expanded && 'rotate-90')}
        />
      </button>
      <div id={id} hidden={!expanded}>{children}</div>
    </div>
  );
}
