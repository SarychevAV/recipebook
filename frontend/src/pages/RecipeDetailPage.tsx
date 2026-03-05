import { useParams, Link } from 'react-router-dom';
import { AppLayout } from '../components/shared/AppLayout';
import { RecipeDetail } from '../features/recipes/RecipeDetail';
import { useRecipe } from '../hooks/useRecipes';

export default function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, isError } = useRecipe(id ?? '');

  return (
    <AppLayout>
      {isLoading && (
        <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
          <div className="h-4 w-32 rounded-full bg-gray-100 animate-pulse" />
          <div className="flex gap-8">
            <div className="w-5/12 h-72 rounded-2xl bg-gray-100 animate-pulse" />
            <div className="flex-1 space-y-3">
              <div className="h-8 w-3/4 rounded-xl bg-gray-100 animate-pulse" />
              <div className="h-4 w-1/2 rounded-xl bg-gray-100 animate-pulse" />
              <div className="h-4 w-full rounded-xl bg-gray-100 animate-pulse" />
              <div className="h-4 w-full rounded-xl bg-gray-100 animate-pulse" />
            </div>
          </div>
        </div>
      )}

      {isError && (
        <div className="max-w-5xl mx-auto px-6 py-20 text-center">
          <p className="text-4xl mb-3">😕</p>
          <p className="text-sm text-gray-500 mb-4">Рецепт не найден или не удалось загрузить.</p>
          <Link
            to="/"
            className="text-sm font-medium text-orange-600 hover:text-orange-700"
          >
            На главную
          </Link>
        </div>
      )}

      {!isLoading && !isError && data && (
        <RecipeDetail recipe={data.data} />
      )}
    </AppLayout>
  );
}
