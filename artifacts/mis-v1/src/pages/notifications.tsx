import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, Check, CircleAlert, Mail, RefreshCw } from 'lucide-react';
import { staffWorkspaceApi, type StaffNotification } from '@/lib/staff-workspace-api';
import { useAuth } from '@/lib/auth-context';

function emailLabel(state: StaffNotification['email_status']) {
  switch (state) {
    case 'SENT': return { label: 'Email sent', detail: 'The email provider accepted this message for delivery.', style: 'bg-[#e4f0e8] text-[#3f755d]' };
    case 'WAITING_CONFIGURATION': return { label: 'Waiting for configuration', detail: 'Email has not been sent; mail configuration is pending.', style: 'bg-[#fff3dc] text-[#8a6427]' };
    case 'PENDING': return { label: 'Queued', detail: 'Email is pending; delivery is not yet confirmed.', style: 'bg-[#e9eff2] text-[#526d78]' };
    case 'RETRY': return { label: 'Retry required', detail: 'Delivery is not confirmed and will require another attempt.', style: 'bg-[#fff0e7] text-[#945b38]' };
    case 'NO_RECIPIENT': return { label: 'No recipient', detail: 'No recipient was available; no email was sent.', style: 'bg-[#f2e9e4] text-[#815e4c]' };
    default: return { label: state || 'Unknown', detail: 'Email delivery state is unavailable.', style: 'bg-[#edf0ee] text-[#687a72]' };
  }
}
const dateText = (value: string) => new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });

export default function NotificationsPage() {
  const { user } = useAuth();
  const client = useQueryClient();
  const query = useQuery({ queryKey: ['staff-notifications', user?.username], queryFn: staffWorkspaceApi.notifications, staleTime: 10_000, refetchInterval: 15_000, enabled: !!user });
  const readMutation = useMutation({
    mutationFn: staffWorkspaceApi.markNotificationRead,
    onSuccess: (_data, notificationId) => {
      client.setQueryData(['staff-notifications'], (old: typeof query.data | undefined) => old && ({
        ...old,
        data: old.data.map(item => item.notification_id === notificationId ? { ...item, read_at: new Date().toISOString() } : item),
        unreadCount: Math.max(0, old.unreadCount - 1),
      }));
    },
    onError: () => { client.invalidateQueries({ queryKey: ['staff-notifications'] }); },
  });
  const notifications: StaffNotification[] = query.data?.data ?? [];
  return <main className="min-h-[100dvh] bg-[#f1f6f2] px-4 py-5 text-[#203c3a] sm:px-6 sm:py-7">
    <div className="mx-auto max-w-5xl">
      <header className="mb-7 flex flex-wrap items-end justify-between gap-4"><div><p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.2em] text-[#557e74]"><span className="h-px w-6 bg-[#8eaea2]" /> AAR MIS / Staff updates</p><h1 className="mt-2 text-[30px] font-semibold tracking-[-.045em] text-[#193a38] sm:text-[36px]">Notifications</h1><p className="mt-1 text-sm text-[#758681]">Operational updates connected to your staff account.</p></div><div className="flex items-center gap-3"><span className="rounded-full border border-[#d9e5df] bg-[#f9fcfa] px-3 py-2 text-xs font-semibold text-[#56736a]" data-testid="text-unread-notification-count">{query.data?.unreadCount ?? 0} unread</span><button type="button" onClick={() => query.refetch()} disabled={query.isFetching} className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#d9e5df] bg-[#f9fcfa] text-[#56736a] disabled:opacity-50" aria-label="Refresh notifications" data-testid="button-refresh-notifications"><RefreshCw size={15} className={query.isFetching ? 'animate-spin' : ''} /></button></div></header>
      {readMutation.isError && <div role="alert" className="mb-4 flex items-center gap-2 rounded-xl border border-[#ead0c6] bg-[#fff4ee] px-4 py-3 text-xs font-medium text-[#90533f]"><CircleAlert size={15} /> Could not mark this notification as read. Refresh and retry.</div>}
      <section className="overflow-hidden rounded-2xl border border-[#dce7e1] bg-[#fbfdfb] shadow-[0_14px_44px_-38px_rgba(23,65,58,.45)]">
        {query.isLoading ? <div className="space-y-3 p-5">{[0,1,2,3].map(i => <div key={i} className="h-32 animate-pulse rounded-xl bg-[#edf3ef]" />)}</div> : query.isError ? <div className="flex min-h-72 flex-col items-center justify-center p-8 text-center"><CircleAlert size={24} className="mb-3 text-[#a15b42]" /><p className="font-semibold text-[#65483e]">Notifications could not load</p><p className="mt-1 text-sm text-[#8a7770]">{query.error instanceof Error ? query.error.message : 'Try again in a moment.'}</p><button onClick={() => query.refetch()} className="mt-4 rounded-lg border border-[#d8c8c0] px-4 py-2 text-sm font-semibold text-[#704c40]" data-testid="button-retry-notifications">Retry</button></div> : notifications.length ? <div className="divide-y divide-[#e8efeb]">{notifications.map(notification => {
          const delivery = emailLabel(notification.email_status);
          return <article key={notification.notification_id} className={`p-5 sm:p-6 ${notification.read_at ? '' : 'bg-[#f7faf8]'}`} data-testid={`card-notification-${notification.notification_id}`}>
            <div className="flex items-start gap-4"><span className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${notification.read_at ? 'bg-[#edf3ef] text-[#7a9288]' : 'bg-[#dcece4] text-[#3b7569]'}`}><Bell size={18} /></span><div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2"><h2 className="text-sm font-semibold text-[#294842]">{notification.title}</h2>{!notification.read_at && <span className="rounded-full bg-[#dfeee6] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#3b7569]">New</span>}</div><p className="mt-1 font-mono text-[10px] text-[#789087]">{notification.file_no} <span className="mx-1.5">·</span>{dateText(notification.created_at)}</p></div>
                {!notification.read_at && <button type="button" disabled={readMutation.isPending} onClick={() => readMutation.mutate(notification.notification_id)} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#cfddd6] bg-white px-3 text-xs font-semibold text-[#416d61] hover:bg-[#eff6f2] disabled:opacity-50" data-testid={`button-mark-notification-read-${notification.notification_id}`}><Check size={13} /> Mark read</button>}
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[#526b64]">{notification.message}</p>
              <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2"><span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ${delivery.style}`}><Mail size={12} />{delivery.label}</span><span className="text-[10px] text-[#788c84]">{delivery.detail}</span></div>
            </div></div>
          </article>;
        })}</div> : <div className="flex min-h-80 flex-col items-center justify-center px-8 text-center"><div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e5efe9] text-[#558276]"><Bell size={23} /></div><p className="text-base font-semibold text-[#34564e]">You are up to date</p><p className="mt-2 max-w-sm text-sm leading-6 text-[#81918a]">New operational notifications for your staff account will appear here.</p></div>}
      </section>
      <p className="mt-4 text-[10px] leading-5 text-[#84948e]">Email state is shown as reported by the MIS service. Pending and waiting states do not indicate successful delivery.</p>
    </div>
  </main>;
}
