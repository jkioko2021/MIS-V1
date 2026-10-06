import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
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
  ChevronRight, LogOut, User, Users, Settings, SlidersHorizontal,
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
  children?: NavItem[];
};

const NAV_SECTIONS: Array<{
  label: string | null;
  adminOnly?: boolean;
  medicalOnly?: boolean;
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
          { href: '/business/bpo-retail', label: 'BPO Review-Retail', icon: FileText, bpoReviewOnly: true },
          { href: '/business/bpo-corporate-sme', label: 'BPO Review-Corporates/SME', icon: FileText, bpoReviewOnly: true },
          { href: '/business/allocated', label: 'Allocation Files', icon: FileText, bpoOnly: true },
        ],
      },
      { href: '/risk',      label: 'Risk Register',     icon: Shield },
      { href: '/discovery', label: 'DB Discovery',      icon: Database },
      { href: '/notifications', label: 'Notifications', icon: Bell },
    ],
  },
  {
    label: 'Cashier',
    cashierOnly: true,
    items: [
      { href: '/cashier', label: 'Cashier Review', icon: Banknote },
    ],
  },
  {
    label: 'Medical Underwriting',
    medicalOnly: true,
    items: [
      { href: '/medical-underwriting', label: 'Medical Underwriting Review', icon: Shield },
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
function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  // Show admin section only for profile 1 (SuperAdmin) or 2 (System Admin)
  const isAdmin = user && (user.profileId === 1 || user.profileId === 2);
  const canSeeMedical = isAdmin || user?.profileId === 5 || user?.profileName?.trim().toLowerCase() === 'medical uw';
  const canSeeCashier = isAdmin || user?.profileId === 6
    || ['finance', 'cashier'].includes(user?.profileName?.trim().toLowerCase() ?? '');
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
    <aside className="w-56 shrink-0 border-r bg-muted/30 flex flex-col h-screen sticky top-0">
      <div className="p-4 border-b">
        <p className="font-bold text-sm">AAR MIS</p>
        <p className="text-xs text-muted-foreground">Management Information System</p>
      </div>

      <nav className="flex-1 p-2 space-y-4 overflow-y-auto">
        {NAV_SECTIONS.map((section, si) => {
          if (section.adminOnly && !isAdmin) return null;
          if (section.medicalOnly && !canSeeMedical) return null;
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
                const active = location === href || (href !== '/' && location.startsWith(href));
                const visibleChildren = item.children?.filter(child =>
                  (!child.bpoOnly || canSeeAllocatedFiles)
                  && (!child.bpoReviewOnly || canSeeBpoReviewQueues),
                ) ?? [];
                return (
                  <div key={href}>
                    <Link
                      href={href}
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
            onClick={() => logout()}
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
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}

// ─── Protected router ─────────────────────────────────────────────────────────
function ProtectedRouter() {
  const { user, loading } = useAuth();

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

  if (!user) return <LoginPage />;

  return (
    <RoutedErrorBoundary>
      <AppLayout>
        <Switch>
          <Route path="/"                 component={HomePage} />
          <Route path="/business/allocated" component={AllocatedFilesPage} />
          <Route path="/business/bpo-retail">
            {() => <BusinessTrackingPage initialQueue="bpo-retail" />}
          </Route>
          <Route path="/business/bpo-corporate-sme">
            {() => <BusinessTrackingPage initialQueue="bpo-corporate-sme" />}
          </Route>
          <Route path="/business">
            {() => <BusinessTrackingPage />}
          </Route>
          <Route path="/risk"             component={RiskRegisterPage} />
          <Route path="/medical-underwriting" component={MedicalUnderwritingPage} />
          <Route path="/cashier" component={CashierPage} />
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
