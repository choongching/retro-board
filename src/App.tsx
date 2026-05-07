import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from './lib/auth';
import { Home } from './screens/Home';
import { Join } from './screens/Join';
import { Board } from './screens/Board';
import { SignIn } from './screens/SignIn';
import { AuthCallback } from './screens/AuthCallback';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/join" element={<Join />} />
          <Route path="/join/:code" element={<Join />} />
          <Route path="/r/:code" element={<Board />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
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
    </BrowserRouter>
  );
}
