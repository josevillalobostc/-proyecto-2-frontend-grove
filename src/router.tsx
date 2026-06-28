import React, { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Spinner from './components/ui/Spinner';
import ErrorBoundary from './components/ErrorBoundary';

const LoginPage = lazy(() => import('./pages/LoginPage'));
const GraphPage = lazy(() => import('./pages/GraphPage'));
const FlashcardsPage = lazy(() => import('./pages/FlashcardsPage'));
const ClustersPage = lazy(() => import('./pages/ClustersPage'));
const LearningPathPage = lazy(() => import('./pages/LearningPathPage'));
const ConceptsPage = lazy(() => import('./pages/ConceptsPage'));
const ConceptDetailPage = lazy(() => import('./pages/ConceptDetailPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

const withSuspense = (Component: React.ComponentType) => (
  <ErrorBoundary>
    <Suspense fallback={<Spinner fullScreen />}>
      <Component />
    </Suspense>
  </ErrorBoundary>
);

export const router = createBrowserRouter([
  {
    path: '/login',
    element: withSuspense(LoginPage),
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <Layout />,
        children: [
          { path: '/graph', element: withSuspense(GraphPage) },
          { path: '/flashcards', element: withSuspense(FlashcardsPage) },
          { path: '/clusters', element: withSuspense(ClustersPage) },
          { path: '/learning-path', element: withSuspense(LearningPathPage) },
          { path: '/concepts', element: withSuspense(ConceptsPage) },
          { path: '/concepts/:id', element: withSuspense(ConceptDetailPage) },
          { path: '/profile', element: withSuspense(ProfilePage) },
          { path: '/notifications', element: withSuspense(NotificationsPage) },
        ],
      },
    ],
  },
  { path: '/', element: <Navigate to="/graph" replace /> },
  { path: '*', element: withSuspense(NotFoundPage) },
]);
