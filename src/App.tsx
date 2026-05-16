import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from './lib/auth';
import { ErrorBoundary } from './components/ErrorBoundary';
import { RetroWordmark } from './components/RetroWordmark';
import { Home } from './screens/Home';

// Lazy-loaded routes so the anonymous landing chunk stays small.
// React.lazy expects a default export, so we adapt each named export.
const Join = lazy(() => import('./screens/Join').then((m) => ({ default: m.Join })));
const Board = lazy(() => import('./screens/Board').then((m) => ({ default: m.Board })));
const SignIn = lazy(() => import('./screens/SignIn').then((m) => ({ default: m.SignIn })));
const AuthCallback = lazy(() => import('./screens/AuthCallback').then((m) => ({ default: m.AuthCallback })));

function RouteFallback() {
  return (
    <div style={{
      height: '100vh', width: '100%',
      display: 'grid', placeItems: 'center',
      background: 'var(--color-bg)',
    }}>
      <RetroWordmark size="lg" />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <AuthProvider>
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/join" element={<Join />} />
              <Route path="/join/:code" element={<Join />} />
              <Route path="/r/:code" element={<Board />} />
              <Route path="/signin" element={<SignIn />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </Suspense>
          <Toaster
            position="bottom-center"
            theme="light"
            toastOptions={{
              style: {
                background: 'var(--color-text)',
                color: 'var(--color-bg)',
                border: 'none',
                borderRadius: '10px',
                fontSize: '13px',
                padding: '10px 14px',
                boxShadow: 'var(--shadow-lg)',
              },
            }}
          />
        </AuthProvider>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
