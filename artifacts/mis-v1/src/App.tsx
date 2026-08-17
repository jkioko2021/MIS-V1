import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import DiscoveryPage from '@/pages/discovery';
import HomePage from '@/pages/home';
import BusinessTrackingPage from '@/pages/business';
import RiskRegisterPage from '@/pages/risk';
import LoginPage from '@/pages/login';
import UsersPage from '@/pages/admin/users';
import ProfilesPage from '@/pages/admin/profiles';
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
  Home, FileText, Shield, Database,
  ChevronRight, LogOut, User, Users, Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, retry: 1 } },
});

// ─── Navigation structure ─────────────────────────────────────────────────────
const NAV_SECTIONS = [
  {
    label: null,
    items: [
      { href: '/',          label: 'Home',              icon: Home },
      { href: '/business',  label: 'Business Tracking', icon: FileText },
      { href: '/risk',      label: 'Risk Register',     icon: Shield },
      { href: '/discovery', label: 'DB Discovery',      icon: Database },
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
];

// ─── Sidebar ──────────────────────────────────────────────────────────────────
function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  // Show admin section only for profile 1 (SuperAdmin) or 2 (System Admin)
  const isAdmin = user && (user.profileId === 1 || user.profileId === 2);

  return (
    <aside className="w-56 shrink-0 border-r bg-muted/30 flex flex-col h-screen sticky top-0">
      <div className="p-4 border-b">
        <p className="font-bold text-sm">AAR MIS</p>
        <p className="text-xs text-muted-foreground">Management Information System</p>
      </div>

      <nav className="flex-1 p-2 space-y-4 overflow-y-auto">
        {NAV_SECTIONS.map((section, si) => {
          if (section.adminOnly && !isAdmin) return null;
          return (
            <div key={si} className="space-y-0.5">
              {section.label && (
                <p className="px-3 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  {section.label}
                </p>
              )}
              {section.items.map(({ href, label, icon: Icon }) => {
                const active = location === href || (href !== '/' && location.startsWith(href));
                return (
                  <Link
                    key={href}
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
          <Route path="/business"         component={BusinessTrackingPage} />
          <Route path="/risk"             component={RiskRegisterPage} />
          <Route path="/discovery"        component={DiscoveryPage} />
          <Route path="/admin/users"      component={UsersPage} />
          <Route path="/admin/profiles"   component={ProfilesPage} />
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
