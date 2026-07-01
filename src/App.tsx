import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { router } from './router';

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
      <Toaster
        position="bottom-right"
        gutter={8}
        toastOptions={{
          duration: 3500,
          style: {
            background: '#1A1833',
            color: '#F0EDFF',
            border: '1px solid #2A2250',
            borderRadius: '10px',
            fontSize: '13.5px',
            fontFamily: 'Inter, system-ui, sans-serif',
            padding: '10px 14px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            maxWidth: 360,
          },
          success: {
            iconTheme: { primary: '#7C3AED', secondary: '#0f1117' },
            style: { borderColor: 'rgba(124,58,237,0.3)' },
          },
          error: {
            iconTheme: { primary: '#f87171', secondary: '#0f1117' },
            style: { borderColor: 'rgba(239,68,68,0.3)' },
          },
        }}
      />
    </AuthProvider>
  );
}
