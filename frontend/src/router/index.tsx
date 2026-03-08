import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { useAuth } from '../store/authStore';

const LoginPage = lazy(() => import('../pages/LoginPage'));
const RegisterPage = lazy(() => import('../pages/RegisterPage'));
const FeedPage = lazy(() => import('../pages/FeedPage'));
const RecipeDetailPage = lazy(() => import('../pages/RecipeDetailPage'));
const CreateRecipePage = lazy(() => import('../pages/CreateRecipePage'));
const EditRecipePage = lazy(() => import('../pages/EditRecipePage'));
const MyRecipesPage = lazy(() => import('../pages/MyRecipesPage'));
const AdminModerationPage = lazy(() => import('../pages/AdminModerationPage'));
const ProfilePage = lazy(() => import('../pages/ProfilePage'));

function PageLoader() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function AdminRoute() {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated || user?.role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <Suspense fallback={null}>
        <LoginPage />
      </Suspense>
    ),
  },
  {
    path: '/register',
    element: (
      <Suspense fallback={null}>
        <RegisterPage />
      </Suspense>
    ),
  },
  // Public routes
  {
    path: '/',
    element: (
      <Suspense fallback={<PageLoader />}>
        <FeedPage />
      </Suspense>
    ),
  },
  {
    path: '/explore',
    element: (
      <Suspense fallback={<PageLoader />}>
        <FeedPage />
      </Suspense>
    ),
  },
  {
    path: '/recipes/:id',
    element: (
      <Suspense fallback={<PageLoader />}>
        <RecipeDetailPage />
      </Suspense>
    ),
  },
  // Protected routes (any authenticated user)
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: '/recipes/new',
        element: (
          <Suspense fallback={<PageLoader />}>
            <CreateRecipePage />
          </Suspense>
        ),
      },
      {
        path: '/recipes/:id/edit',
        element: (
          <Suspense fallback={<PageLoader />}>
            <EditRecipePage />
          </Suspense>
        ),
      },
      {
        path: '/my-recipes',
        element: (
          <Suspense fallback={<PageLoader />}>
            <MyRecipesPage />
          </Suspense>
        ),
      },
      {
        path: '/profile',
        element: (
          <Suspense fallback={<PageLoader />}>
            <ProfilePage />
          </Suspense>
        ),
      },
    ],
  },
  // Admin-only routes
  {
    element: <AdminRoute />,
    children: [
      {
        path: '/admin/moderation',
        element: (
          <Suspense fallback={<PageLoader />}>
            <AdminModerationPage />
          </Suspense>
        ),
      },
    ],
  },
]);
