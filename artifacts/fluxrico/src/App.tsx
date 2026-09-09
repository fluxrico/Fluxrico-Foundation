import { useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Route, Switch, Router as WouterRouter, useLocation } from 'wouter';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import Landing from '@/pages/landing';
import NotFound from '@/pages/not-found';
import SignUp from '@/pages/signup';
import SignIn from '@/pages/signin';
import ForgotPassword from '@/pages/forgot-password';
import ResetPassword from '@/pages/reset-password';
import Dashboard from '@/pages/dashboard';
import Navigator from '@/pages/navigator';
import NavigatorResult from '@/pages/navigator-result';
import Roadmap from '@/pages/roadmap';
import Library from '@/pages/library';
import Notifications from '@/pages/notifications';
import Profile from '@/pages/profile';
import Settings from '@/pages/settings';
import { NavigatorStateProvider } from '@/components/navigator-state';
import { WorkspaceStateProvider } from '@/lib/workspace-state';
import { AuthStateProvider } from '@/lib/auth-state';

const queryClient = new QueryClient();

// The former foundation screen lived here. It has been superseded by the
// marketing landing page; every internal product route is unchanged.
function Router() {
  return (
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/signup" component={SignUp} />
        <Route path="/signin" component={SignIn} />
        <Route path="/forgot-password" component={ForgotPassword} />
        <Route path="/reset-password" component={ResetPassword} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/navigator" component={Navigator} />
        <Route path="/navigator/result" component={NavigatorResult} />
        <Route path="/roadmap" component={Roadmap} />
        <Route path="/library" component={Library} />
        <Route path="/notifications" component={Notifications} />
        <Route path="/profile" component={Profile} />
        <Route path="/settings" component={Settings} />
        <Route component={NotFound} />
      </Switch>
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
          <AuthStateProvider>
            <NavigatorStateProvider>
              <WorkspaceStateProvider>
                <Router />
              </WorkspaceStateProvider>
            </NavigatorStateProvider>
          </AuthStateProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
