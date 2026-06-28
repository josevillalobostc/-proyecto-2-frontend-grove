import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { router } from './router';

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1e2433',
            color: '#e5e7eb',
            border: '1px solid #2d3748',
            borderRadius: '10px',
            fontSize: '14px',
          },
          success: {
            iconTheme: { primary: '#4ade80', secondary: '#0f1117' },
          },
          error: {
            iconTheme: { primary: '#f87171', secondary: '#0f1117' },
          },
        }}
      />
    </AuthProvider>
  );
}
