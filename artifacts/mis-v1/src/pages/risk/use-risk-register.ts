import { useQueryClient } from '@tanstack/react-query';
import {
  getGetRiskRegisterHistoryQueryKey,
  getGetRiskRegisterOptionsQueryKey,
  getGetRiskRegisterRecordQueryKey,
  getGetRiskRegisterSummaryQueryKey,
  getListRiskRegisterRecordsQueryKey,
  useAssignRiskRegisterTeam,
  useCloseRiskRegisterPeriod,
  useCreateRiskRegisterRecord,
  useDecideRiskRegisterWorkflow,
  useGetRiskRegisterHistory,
  useGetRiskRegisterOptions,
  useGetRiskRegisterRecord,
  useGetRiskRegisterSummary,
  useListRiskRegisterRecords,
  useOpenRiskRegisterPeriod,
  useSaveRiskRegisterRootCause,
  useUpdateRiskRegisterRecord,
} from '@workspace/api-client-react';

const identityKey = (username: string, key: readonly unknown[]) => [...key, 'actor', username];
const finiteQuery = { staleTime: 20_000, refetchInterval: 60_000, refetchOnWindowFocus: true } as const;

function useRiskMutationOptions() {
  const client = useQueryClient();
  return {
    mutation: {
      onSuccess: () => client.invalidateQueries({
        predicate: query => query.queryKey.some(part =>
          typeof part === 'string' && (part.startsWith('/api/risk-register') || part === 'risk-register'),
        ),
      }),
    },
  };
}

export function useRiskOptions(username: string) {
  const key = identityKey(username, getGetRiskRegisterOptionsQueryKey());
  return useGetRiskRegisterOptions({ query: { ...finiteQuery, queryKey: key } });
}

export function useRiskRecords(username: string, params: { depart_code?: string; period_id?: number; view?: 'all' | 'open' | 'submitted' | 'reviewed' | 'signed' | 'closed'; search?: string }, enabled = true) {
  const key = identityKey(username, getListRiskRegisterRecordsQueryKey(params));
  return useListRiskRegisterRecords(params, { query: { ...finiteQuery, enabled, queryKey: key } });
}

export function useRiskRecord(username: string, riskCode: string) {
  const key = identityKey(username, getGetRiskRegisterRecordQueryKey(riskCode));
  return useGetRiskRegisterRecord(riskCode, { query: { ...finiteQuery, enabled: !!riskCode, queryKey: key } });
}

export function useRiskSummary(username: string, params: { depart_code?: string; period_id?: number }) {
  const key = identityKey(username, getGetRiskRegisterSummaryQueryKey(params));
  return useGetRiskRegisterSummary(params, { query: { ...finiteQuery, queryKey: key } });
}

export function useRiskHistory(username: string, params: { depart_code?: string; period_id?: number }) {
  const key = identityKey(username, getGetRiskRegisterHistoryQueryKey(params));
  return useGetRiskRegisterHistory(params, { query: { ...finiteQuery, queryKey: key } });
}

export function useCreateRisk() { return useCreateRiskRegisterRecord(useRiskMutationOptions()); }
export function useUpdateRisk() { return useUpdateRiskRegisterRecord(useRiskMutationOptions()); }
export function useSaveRiskCause() { return useSaveRiskRegisterRootCause(useRiskMutationOptions()); }
export function useRiskWorkflow() { return useDecideRiskRegisterWorkflow(useRiskMutationOptions()); }
export function useOpenRiskPeriod() { return useOpenRiskRegisterPeriod(useRiskMutationOptions()); }
export function useCloseRiskPeriod() { return useCloseRiskRegisterPeriod(useRiskMutationOptions()); }
export function useAssignRiskTeam() { return useAssignRiskRegisterTeam(useRiskMutationOptions()); }
