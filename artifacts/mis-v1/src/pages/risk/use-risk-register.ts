import { useIsMutating, useQueryClient } from '@tanstack/react-query';
import {
  getGetRiskRegisterHistoryQueryKey,
  getGetRiskRegisterOptionsQueryKey,
  getGetRiskRegisterRecordQueryKey,
  getGetRiskRegisterSummaryQueryKey,
  getGetRiskRegisterReadinessQueryKey,
  getListRiskRegisterRecordsQueryKey,
  useAssignRiskRegisterTeam,
  useCloseRiskRegisterPeriod,
  useCreateRiskRegisterRecord,
  useDecideRiskRegisterWorkflow,
  useGetRiskRegisterHistory,
  useGetRiskRegisterOptions,
  useGetRiskRegisterRecord,
  useGetRiskRegisterSummary,
  useGetRiskRegisterReadiness,
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
      mutationKey: ['risk-register-write'],
      onMutate: async () => {
        await client.cancelQueries({
          predicate: query => query.queryKey.some(part => typeof part === 'string' && part.startsWith('/api/risk-register/readiness/')),
        });
        await client.invalidateQueries({
          predicate: query => query.queryKey.some(part => typeof part === 'string' && part.startsWith('/api/risk-register/readiness/')),
          refetchType: 'none',
        });
      },
      onSettled: () => client.invalidateQueries({
        predicate: query => query.queryKey.some(part => typeof part === 'string' && part.startsWith('/api/risk-register/readiness/')),
      }),
      onSuccess: () => client.invalidateQueries({
        predicate: query => query.queryKey.some(part =>
          typeof part === 'string' && (part.startsWith('/api/risk-register') || part === 'risk-register'),
        ),
      }),
    },
  };
}

export function useRiskReadiness(username: string, departCode: string, periodId: number, enabled = true) {
  const mutating = useIsMutating({ mutationKey: ['risk-register-write'] }) > 0;
  const key = identityKey(username, getGetRiskRegisterReadinessQueryKey(departCode, periodId));
  const query = useGetRiskRegisterReadiness(departCode, periodId, { query: {
    enabled: enabled && Boolean(username && departCode && periodId) && !mutating,
    queryKey: key, staleTime: 10_000, gcTime: 0, refetchInterval: 10_000,
    refetchOnMount: 'always', refetchOnWindowFocus: 'always',
  } });
  return { ...query, mutating };
}

export function useRiskOptions(username: string, fresh = false) {
  const key = identityKey(username, getGetRiskRegisterOptionsQueryKey());
  return useGetRiskRegisterOptions({ query: { ...finiteQuery, ...(fresh ? { staleTime: 0, refetchOnMount: 'always' as const } : {}), enabled: Boolean(username), queryKey: key } });
}

export function useRiskRecords(username: string, params: NonNullable<Parameters<typeof useListRiskRegisterRecords>[0]>, enabled = true, fresh = false) {
  const key = identityKey(username, getListRiskRegisterRecordsQueryKey(params));
  return useListRiskRegisterRecords(params, { query: { ...finiteQuery, ...(fresh ? { staleTime: 0, refetchOnMount: 'always' as const } : {}), enabled, queryKey: key } });
}

export function useRiskRecord(username: string, riskCode: string) {
  const key = identityKey(username, getGetRiskRegisterRecordQueryKey(riskCode));
  return useGetRiskRegisterRecord(riskCode, { query: { ...finiteQuery, enabled: !!riskCode, queryKey: key } });
}

export function useRiskSummary(username: string, params: { access?: 'view' | 'update' | 'review'; depart_code?: string; period_id?: number }, enabled = true, fresh = false) {
  const key = identityKey(username, getGetRiskRegisterSummaryQueryKey(params));
  return useGetRiskRegisterSummary(params, { query: { ...finiteQuery, ...(fresh ? { staleTime: 0, refetchOnMount: 'always' as const } : {}), enabled, queryKey: key } });
}

export function useRiskHistory(username: string, params: { depart_code?: string; period_id?: number }, enabled = true) {
  const key = identityKey(username, getGetRiskRegisterHistoryQueryKey(params));
  return useGetRiskRegisterHistory(params, { query: { ...finiteQuery, enabled, queryKey: key } });
}

export function useCreateRisk() { return useCreateRiskRegisterRecord(useRiskMutationOptions()); }
export function useUpdateRisk() { return useUpdateRiskRegisterRecord(useRiskMutationOptions()); }
export function useSaveRiskCause() { return useSaveRiskRegisterRootCause(useRiskMutationOptions()); }
export function useRiskWorkflow() { return useDecideRiskRegisterWorkflow(useRiskMutationOptions()); }
export function useOpenRiskPeriod() { return useOpenRiskRegisterPeriod(useRiskMutationOptions()); }
export function useCloseRiskPeriod() { return useCloseRiskRegisterPeriod(useRiskMutationOptions()); }
export function useAssignRiskTeam() { return useAssignRiskRegisterTeam(useRiskMutationOptions()); }
