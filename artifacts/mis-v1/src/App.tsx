import { type ReactNode, useEffect, useRef, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { toast } from '@/hooks/use-toast';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import DiscoveryPage from '@/pages/discovery';
import HomePage from '@/pages/home';
import BusinessTrackingPage from '@/pages/business';
import AllocatedFilesPage from '@/pages/business/allocated-files';
import RiskRegisterPage from '@/pages/risk';
import LoginPage from '@/pages/login';
import UsersPage from '@/pages/admin/users';
import ProfilesPage from '@/pages/admin/profiles';
import BusinessRequirementsPage from '@/pages/admin/business-requirements';
import MedicalUnderwritingPage from '@/pages/medical-underwriting';
import CashierPage from '@/pages/cashier';
import PricingReviewPage from '@/pages/pricing-review';
import RecordFilingPage from '@/pages/business/record-filing';
import GiAllocatePage from '@/pages/business/gi-allocate';
import BusinessStatusPage from '@/pages/business/business-status';
import NotificationsPage from '@/pages/notifications';
import { AuthProvider, useAuth } from '@/lib/auth-context';
import {
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
  Link,
  Redirect,
} from 'wouter';
import {
  Home, FileText, Shield, Database, Bell, Banknote,
  ChevronRight, LogOut, User, Users, Settings, SlidersHorizontal, Menu, X,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, retry: 1 } },
});

// ─── Navigation structure ─────────────────────────────────────────────────────
type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  bpoOnly?: boolean;
  bpoReviewOnly?: boolean;
  medicalOnly?: boolean;
  pricingOnly?: boolean;
  cashierOnly?: boolean;
  dpuOnly?: boolean;
  giOnly?: boolean;
  children?: NavItem[];
};

const NAV_SECTIONS: Array<{
  label: string | null;
  adminOnly?: boolean;
  cashierOnly?: boolean;
  items: NavItem[];
}> = [
  {
    label: null,
    items: [
      { href: '/',          label: 'Home',              icon: Home },
      {
        href: '/business',
        label: 'Business Tracking',
        icon: FileText,
        children: [
          { href: '/business', label: 'Register Queue', icon: FileText },
          { href: '/business/bpo-retail', label: 'BPO Review Retail', icon: FileText, bpoReviewOnly: true },
          { href: '/business/bpo-corporate-sme', label: 'BPO Review Corporates/SME', icon: FileText, bpoReviewOnly: true },
          { href: '/business/medical-review', label: 'Medical Review', icon: Shield, medicalOnly: true },
          { href: '/business/pricing', label: 'Pricing Review', icon: FileText, pricingOnly: true },
          { href: '/business/allocated', label: 'Allocated Files', icon: FileText, bpoOnly: true },
          { href: '/business/cashier', label: 'Cashier Review', icon: Banknote, cashierOnly: true },
          { href: '/business/record-filing', label: 'Record Filing', icon: FileText, dpuOnly: true },
          { href: '/business/gi-allocate', label: 'GI-Allocate', icon: FileText, giOnly: true },
          { href: '/business/gi-allocated', label: 'GI-Allocated', icon: FileText, giOnly: true },
          { href: '/business/status', label: 'Business Status', icon: FileText },
        ],
      },
      { href: '/risk',      label: 'Risk Register',     icon: Shield },
      { href: '/discovery', label: 'DB Discovery',      icon: Database },
      { href: '/notifications', label: 'Notifications', icon: Bell },
    ],
  },
  {
    label: 'Administration',
    adminOnly: true,
    items: [
      { href: '/admin/users',    label: 'User Enrollment',    icon: Users },
      { href: '/admin/profiles', label: 'Profiles & Access',  icon: Settings },
    ],
  },
  {
    label: 'Parameter Settings',
    adminOnly: true,
    items: [
      { href: '/admin/business-requirements', label: 'Configure Business Req', icon: SlidersHorizontal },
    ],
  },
];

// ─── Sidebar ──────────────────────────────────────────────────────────────────
function Sidebar({ mobileOpen, onNavigate, onClose, navigationRef }: { mobileOpen: boolean; onNavigate: () => void; onClose: () => void; navigationRef: (element: HTMLElement | null) => void }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  // Show admin section only for profile 1 (SuperAdmin) or 2 (System Admin)
  const isAdmin = user && (user.profileId === 1 || user.profileId === 2);
  const canSeePricing = isAdmin || user?.profileName?.trim().toLowerCase() === 'pricing';
  const canSeeMedical = isAdmin || user?.profileId === 5 || user?.profileName?.trim().toLowerCase() === 'medical uw';
  const canSeeCashier = isAdmin || user?.profileId === 6
    || ['finance', 'cashier', 'superadmin', 'system admin'].includes(user?.profileName?.trim().toLowerCase() ?? '');
  const canSeeRecordFiling = isAdmin || user?.profileName?.trim().toLowerCase() === 'dpu';
  const giNames = ['gi', 'nonmedical', 'non medical', 'general insurance'];
  const canSeeGi = !!user && (isAdmin
    || giNames.includes((user.profileName ?? '').trim().toLowerCase())
    || giNames.includes((user.department ?? '').trim().toLowerCase()));
  const isBpoDepartment = (user?.department ?? '').trim().toUpperCase() === 'BPO';
  const canSeeAllocatedFiles = user && [
    'superadmin',
    'system admin',
    'bpo',
    'bpo admin',
    'bpo review',
    'membership admin',
  ].includes((user.profileName ?? '').trim().toLowerCase()) || isBpoDepartment;
  const canSeeBpoReviewQueues = user && [
    'superadmin',
    'system admin',
    'bpo',
    'bpo admin',
    'bpo review',
  ].includes((user.profileName ?? '').trim().toLowerCase()) || isBpoDepartment;

  return (
    <aside
      ref={navigationRef}
      id="mis-navigation"
      aria-label="Main navigation"
      role={mobileOpen ? 'dialog' : undefined}
      aria-modal={mobileOpen || undefined}
      className={`${mobileOpen ? 'flex translate-x-0' : 'hidden -translate-x-full'} fixed inset-y-0 left-0 z-[60] h-[100dvh] w-[min(18rem,calc(100vw-3rem))] shrink-0 flex-col border-r bg-background shadow-xl transition-transform duration-200 md:sticky md:top-0 md:bottom-auto md:z-auto md:flex md:h-screen md:w-56 md:translate-x-0 md:shadow-none`}
    >
      <div className="flex items-start justify-between border-b p-4">
        <div>
          <p className="text-sm font-bold">AAR MIS</p>
          <p className="text-xs text-muted-foreground">Management Information System</p>
        </div>
        <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted md:hidden" aria-label="Close navigation" data-testid="button-close-mobile-navigation">
          <X className="h-4 w-4" />
        </button>
      </div>

      <nav className="flex-1 p-2 space-y-4 overflow-y-auto">
        {NAV_SECTIONS.map((section, si) => {
          if (section.adminOnly && !isAdmin) return null;
          if (section.cashierOnly && !canSeeCashier) return null;
          return (
            <div key={si} className="space-y-0.5">
              {section.label && (
                <p className="px-3 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  {section.label}
                </p>
              )}
              {section.items.map((item) => {
                const { href, label, icon: Icon } = item;
                const bpoOnly = 'bpoOnly' in item && item.bpoOnly;
                if (bpoOnly && !canSeeAllocatedFiles) return null;
                if ('giOnly' in item && item.giOnly && !canSeeGi) return null;
                const active = location === href || (href !== '/' && location.startsWith(href));
                const visibleChildren = item.children?.filter(child =>
                  (!child.bpoOnly || canSeeAllocatedFiles)
                  && (!child.bpoReviewOnly || canSeeBpoReviewQueues)
                   && (!child.medicalOnly || canSeeMedical)
                  && (!child.pricingOnly || canSeePricing)
                  && (!child.cashierOnly || canSeeCashier)
                   && (!child.dpuOnly || canSeeRecordFiling)
                   && (!child.giOnly || canSeeGi),
                ) ?? [];
                return (
                  <div key={href}>
                    <Link
                      href={href}
                      onClick={onNavigate}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                        active
                          ? 'bg-primary text-primary-foreground font-medium'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                      )}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="flex-1">{label}</span>
                      {active && <ChevronRight className="w-3 h-3 opacity-60" />}
                    </Link>
                    {visibleChildren.length > 0 && (
                      <div className="ml-5 border-l border-border/70 pl-2">
                        {visibleChildren.map(child => {
                          const childActive = location === child.href
                            || (child.href !== '/business' && location.startsWith(`${child.href}/`));
                          const ChildIcon = child.icon;
                          return (
                            <Link
                              key={child.href}
                              href={child.href}
                              onClick={onNavigate}
                              className={cn(
                                'flex items-center gap-2 rounded-md px-3 py-1.5 text-xs transition-colors',
                                childActive
                                  ? 'bg-primary/10 font-semibold text-primary'
                                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                              )}
                            >
                              <ChildIcon className="h-3.5 w-3.5 shrink-0" />
                              <span className="flex-1">{child.label}</span>
                              {childActive && <ChevronRight className="h-3 w-3 opacity-60" />}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* User footer */}
      {user && (
        <div className="p-3 border-t space-y-2">
          <div className="flex items-center gap-2 px-1">
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <User className="w-3.5 h-3.5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user.username}</p>
            </div>
          </div>
          <button
            onClick={() => {
              logout().then(onNavigate).catch(() => {
                toast({ title: "Unable to sign out", description: "Please try again.", variant: "destructive" });
              });
            }}
            className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign out
          </button>
        </div>
      )}
      <div className="px-3 pb-2 text-xs text-muted-foreground">v2.0 · MIS Modernisation</div>
    </aside>
  );
}

function AppLayout({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigationRef = useRef<HTMLElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const wasOpen = useRef(false);

  useEffect(() => {
    if (mobileOpen) {
      navigationRef.current?.querySelector<HTMLElement>('button:not([disabled]), a[href]')?.focus();
    } else if (wasOpen.current) {
      triggerRef.current?.focus();
    }
    wasOpen.current = mobileOpen;
  }, [mobileOpen]);

  useEffect(() => {
    if (!mobileOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileOpen(false);
        return;
      }
      if (event.key !== 'Tab') return;
      const items = navigationRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled])');
      if (!items?.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [mobileOpen]);

  return (
    <div className="min-h-[100dvh] min-w-0 md:flex md:h-screen md:overflow-hidden">
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation overlay"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-50 bg-[#19332c]/45 md:hidden"
          data-testid="button-navigation-backdrop"
        />
      )}
      <Sidebar mobileOpen={mobileOpen} onNavigate={() => setMobileOpen(false)} onClose={() => setMobileOpen(false)} navigationRef={element => { navigationRef.current = element; }} />
      <main className="min-h-[100dvh] min-w-0 flex-1 overflow-y-auto md:min-h-0">
        <div className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur md:hidden">
          <button
            ref={triggerRef}
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
            aria-expanded={mobileOpen}
            aria-controls="mis-navigation"
            className="flex h-10 w-10 items-center justify-center rounded-lg text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            data-testid="button-open-mobile-navigation"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <p className="text-xs font-bold leading-4">AAR MIS</p>
            <p className="truncate text-[10px] text-muted-foreground">Management Information System</p>
          </div>
        </div>
        {children}
      </main>
    </div>
  );
}

// ─── Protected router ─────────────────────────────────────────────────────────
function ProtectedRouter() {
  const { user, loading, passwordExpired } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/20">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
      </div>
    );
  }

  if (!user || passwordExpired) return <LoginPage />;

  return (
    <RoutedErrorBoundary>
      <AppLayout>
        <Switch>
          <Route path="/"                 component={HomePage} />
          <Route path="/business/allocated">
            {() => <AllocatedFilesPage />}
          </Route>
          <Route path="/business/gi-allocate" component={GiAllocatePage} />
          <Route path="/business/gi-allocated">
            {() => <AllocatedFilesPage workspace="gi" />}
          </Route>
          <Route path="/business/status" component={BusinessStatusPage} />
          <Route path="/business/cashier" component={CashierPage} />
          <Route path="/business/medical-review" component={MedicalUnderwritingPage} />
          <Route path="/business/record-filing" component={RecordFilingPage} />
          <Route path="/business/bpo-retail">
            {() => <BusinessTrackingPage initialQueue="bpo-retail" />}
          </Route>
          <Route path="/business/bpo-corporate-sme">
            {() => <BusinessTrackingPage initialQueue="bpo-corporate-sme" />}
          </Route>
          <Route path="/business/pricing" component={PricingReviewPage} />
          <Route path="/business">
            {() => <BusinessTrackingPage />}
          </Route>
          <Route path="/risk"             component={RiskRegisterPage} />
          <Route path="/medical-underwriting">
            {() => <Redirect to="/business/medical-review" />}
          </Route>
          <Route path="/cashier">
            {() => <Redirect to="/business/cashier" />}
          </Route>
          <Route path="/notifications" component={NotificationsPage} />
          <Route path="/discovery"        component={DiscoveryPage} />
          <Route path="/admin/users"      component={UsersPage} />
          <Route path="/admin/profiles"   component={ProfilesPage} />
          <Route path="/admin/business-requirements" component={BusinessRequirementsPage} />
          <Route path="/admin">
            {() => <Redirect to="/admin/users" />}
          </Route>
          <Route component={NotFound} />
        </Switch>
      </AppLayout>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <AuthProvider>
            <ProtectedRouter />
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
