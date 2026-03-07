import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';

const LoginPage = lazy(() => import('../pages/LoginPage'));
const RegisterPage = lazy(() => import('../pages/RegisterPage'));
const FeedPage = lazy(() => import('../pages/FeedPage'));
const RecipeDetailPage = lazy(() => import('../pages/RecipeDetailPage'));
const CreateRecipePage = lazy(() => import('../pages/CreateRecipePage'));
const EditRecipePage = lazy(() => import('../pages/EditRecipePage'));
const MyRecipesPage = lazy(() => import('../pages/MyRecipesPage'));

function PageLoader() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
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
  {
    element: <ProtectedRoute />,
    children: [
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
        path: '/recipes/new',
        element: (
          <Suspense fallback={<PageLoader />}>
            <CreateRecipePage />
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
    ],
  },
]);
