import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router';
import { RequireAuth } from '@/components/RequireAuth';
import { RequireRole } from '@/components/RequireRole';
import { RouteError } from '@/components/RouteError';
import { AppShell } from '@/layouts/AppShell';

// Route-level code splitting (dynamic imports for lean initial bundle)
const Landing = lazy(() => import('@/pages/Landing'));
const LeadGate = lazy(() => import('@/pages/LeadGate'));
const Terms = lazy(() => import('@/pages/Terms'));
const Login = lazy(() => import('@/pages/Login'));
const AuthVerify = lazy(() => import('@/pages/AuthVerify'));
const DelegateAnswer = lazy(() => import('@/pages/DelegateAnswer'));
const InviteAccept = lazy(() => import('@/pages/InviteAccept'));
const Catalog = lazy(() => import('@/pages/Catalog'));
const Onboarding = lazy(() => import('@/pages/Onboarding'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Maturity = lazy(() => import('@/pages/Maturity'));
const Areas = lazy(() => import('@/pages/Areas'));
const AreaDetail = lazy(() => import('@/pages/AreaDetail'));
const Documents = lazy(() => import('@/pages/Documents'));
const Team = lazy(() => import('@/pages/Team'));
const Estimator = lazy(() => import('@/pages/Estimator'));
const PaymentCheckout = lazy(() => import('@/pages/PaymentCheckout'));
const PaymentResult = lazy(() => import('@/pages/PaymentResult'));
const Results = lazy(() => import('@/pages/Results'));
const Review = lazy(() => import('@/pages/Review'));
const Consultant = lazy(() => import('@/pages/Consultant'));
const ConsultantClient = lazy(() => import('@/pages/ConsultantClient'));
const Settings = lazy(() => import('@/pages/Settings'));
const NotFound = lazy(() => import('@/pages/NotFound'));

function PageLoader() {
  return (
    <div className="flex min-h-[40vh] w-full items-center justify-center p-8">
      <div className="h-7 w-7 animate-spin rounded-full border-3 border-primary border-t-transparent" />
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Landing />} errorElement={<RouteError />} />
        <Route path="/start" element={<LeadGate />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/login" element={<Login />} />
        <Route path="/auth/verify" element={<AuthVerify />} />
        <Route path="/delegate/:token" element={<DelegateAnswer />} />
        <Route path="/invite/:token" element={<InviteAccept />} />
        <Route path="/catalog" element={<Catalog />} />

        {/* Protected */}
        <Route
          path="/onboarding"
          element={
            <RequireAuth>
              <Onboarding />
            </RequireAuth>
          }
        />
        <Route
          element={
            <RequireAuth>
              <AppShell />
            </RequireAuth>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/maturity" element={<Maturity />} />
          <Route path="/areas" element={<Areas />} />
          <Route path="/areas/:areaKey" element={<AreaDetail />} />
          <Route path="/documents" element={<Documents />} />
          <Route path="/team" element={<Team />} />
          <Route path="/estimator" element={<Estimator />} />
          <Route path="/payment/checkout" element={<PaymentCheckout />} />
          <Route path="/payment/:status" element={<PaymentResult />} />
          <Route path="/results" element={<Results />} />
          <Route path="/review" element={<Review />} />
          <Route
            path="/consultant"
            element={
              <RequireRole roles={['consultant']}>
                <Consultant />
              </RequireRole>
            }
          />
          <Route
            path="/consultant/clients/:clientId"
            element={
              <RequireRole roles={['consultant']}>
                <ConsultantClient />
              </RequireRole>
            }
          />
          <Route path="/settings" element={<Settings />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
