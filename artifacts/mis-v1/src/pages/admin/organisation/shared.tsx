import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import type { OrganisationAgent, OrganisationNode, SalesLevel } from '@workspace/api-client-react';

export const LEVELS: SalesLevel[] = ['NATIONAL', 'REGION', 'BRANCH', 'UNIT'];
export const LEVEL_LABEL: Record<SalesLevel, string> = {
  NATIONAL: 'National',
  REGION: 'Region',
  BRANCH: 'Branch',
  UNIT: 'Unit',
};
export const INPUT_CLASS = 'h-10 w-full rounded-md border border-input bg-background px-3 text-sm';

export function identityQueryKey(key: readonly unknown[], user?: { id: number; profileId: number } | null) {
  return [...key, user?.id ?? null, user?.profileId ?? null] as const;
}

export function errorMessage(error: unknown) {
  if (error && typeof error === 'object' && 'data' in error) {
    const data = (error as { data?: unknown }).data;
    if (data && typeof data === 'object' && 'error' in data && typeof data.error === 'string')
      return data.error;
  }
  if (error instanceof Error && error.message) return error.message;
  return 'The request could not be completed. Your information is retained; try again.';
}

export function errorStatus(error: unknown) {
  return error && typeof error === 'object' && 'status' in error
    ? Number((error as { status?: unknown }).status)
    : 0;
}

export function prettyDate(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date);
}

export function pathNames(path: OrganisationNode['path'] | OrganisationAgent['hierarchy']) {
  return path.map((item) => item.name).join(' / ');
}

export function agentPath(agent: OrganisationAgent) {
  return pathNames(agent.hierarchy) || 'No organisation assignment';
}

export function ErrorNotice({ error, retry }: { error: unknown; retry: () => void }) {
  return <Alert variant="destructive" className="m-4">
    <AlertCircle className="h-4 w-4" />
    <AlertTitle>Could not load organisation data</AlertTitle>
    <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <span>{errorMessage(error)}</span>
      <Button variant="outline" size="sm" onClick={retry}>Try again</Button>
    </AlertDescription>
  </Alert>;
}
