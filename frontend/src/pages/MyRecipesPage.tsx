import { Link } from 'react-router-dom';
import { AppLayout } from '../components/shared/AppLayout';
import { RecipeCard } from '../features/recipes/RecipeCard';
import { useRecipes } from '../hooks/useRecipes';
import { useAuth } from '../store/authStore';

export default function MyRecipesPage() {
  const { user } = useAuth();
  // Filter by current user via search by username (backend supports q param)
  // Since the API doesn't have a "my recipes" endpoint, we use the general search
  // and show only recipes owned by the current user on the client side
  const { data, isLoading, isError } = useRecipes({ size: 100 });
  const allRecipes = data?.data.content ?? [];
  const myRecipes = allRecipes.filter(r => r.ownerId === user?.id);

  return (
    <AppLayout>
      <div className="px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Мои рецепты</h1>
            <p className="text-sm text-gray-400 mt-0.5">Ваши кулинарные творения</p>
          </div>
          <Link
            to="/recipes/new"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 text-sm font-semibold text-white hover:bg-orange-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Новый рецепт
          </Link>
        </div>

        {isLoading && (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-64 rounded-2xl bg-gray-100 animate-pulse" />
            ))}
          </div>
        )}

        {isError && (
          <div className="text-center py-16">
            <p className="text-sm text-red-500">Не удалось загрузить рецепты. Попробуйте снова.</p>
          </div>
        )}

        {!isLoading && !isError && myRecipes.length === 0 && (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">👨‍🍳</p>
            <p className="text-base font-medium text-gray-700 mb-2">Рецептов пока нет</p>
            <p className="text-sm text-gray-400 mb-6">
              Поделитесь первым рецептом с сообществом!
            </p>
            <Link
              to="/recipes/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-500 text-sm font-semibold text-white hover:bg-orange-600 transition-colors"
            >
              Создать первый рецепт
            </Link>
          </div>
        )}

        {!isLoading && myRecipes.length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {myRecipes.map(recipe => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
