import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from '../components/shared/AppLayout';
import { useMyRecipes, useSubmitForReview } from '../hooks/useRecipes';
import { getErrorMessage } from '../lib/utils';
import type { RecipeSummaryDto, RecipeStatus } from '../types/recipe';

const STATUS_CONFIG: Record<RecipeStatus, { label: string; className: string }> = {
  DRAFT:          { label: 'Черновик',      className: 'bg-gray-100 text-gray-600' },
  PENDING_REVIEW: { label: 'На проверке',   className: 'bg-amber-100 text-amber-700' },
  PUBLISHED:      { label: 'Опубликован',   className: 'bg-green-100 text-green-700' },
  REJECTED:       { label: 'Отклонён',      className: 'bg-red-100 text-red-600' },
};

function StatusBadge({ status }: { status: RecipeStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}

function RecipeRow({ recipe }: { recipe: RecipeSummaryDto }) {
  const [error, setError] = useState('');
  const submitMutation = useSubmitForReview(recipe.id);

  async function handleSubmit() {
    setError('');
    try {
      await submitMutation.mutateAsync();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  const canSubmit = recipe.status === 'DRAFT' || recipe.status === 'REJECTED';
  const canEdit = recipe.status !== 'PENDING_REVIEW';

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 flex gap-4">
      {/* Thumbnail */}
      <div className="w-20 h-20 shrink-0 rounded-xl overflow-hidden bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center">
        {recipe.photoUrl ? (
          <img src={recipe.photoUrl} alt={recipe.title} className="w-full h-full object-cover" />
        ) : (
          <span className="text-2xl select-none">🍽️</span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1.5 flex-wrap">
          <Link
            to={`/recipes/${recipe.id}`}
            className="font-semibold text-gray-900 text-sm hover:text-orange-600 transition-colors truncate"
          >
            {recipe.title}
          </Link>
          <StatusBadge status={recipe.status} />
        </div>

        {recipe.description && (
          <p className="text-xs text-gray-400 line-clamp-1 mb-2">{recipe.description}</p>
        )}

        {recipe.status === 'REJECTED' && recipe.rejectionReason && (
          <p className="text-xs text-red-500 bg-red-50 rounded-lg px-2.5 py-1.5 mb-2">
            Причина отклонения: {recipe.rejectionReason}
          </p>
        )}

        {error && (
          <p className="text-xs text-red-500 mb-2">{error}</p>
        )}

        <div className="flex items-center gap-2">
          {canEdit && (
            <Link
              to={`/recipes/${recipe.id}/edit`}
              className="text-xs font-medium px-2.5 py-1 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
            >
              Редактировать
            </Link>
          )}
          {canSubmit && (
            <button
              onClick={handleSubmit}
              disabled={submitMutation.isPending}
              className="text-xs font-medium px-2.5 py-1 rounded-lg bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-60 transition-colors"
            >
              {submitMutation.isPending ? 'Отправляем…' : 'Отправить на проверку'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MyRecipesPage() {
  const { data, isLoading, isError } = useMyRecipes();
  const recipes = data?.data.content ?? [];

  return (
    <AppLayout>
      <div className="px-4 py-5 md:px-8 md:py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 md:mb-8">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">Мои рецепты</h1>
            <p className="text-sm text-gray-400 mt-0.5">Ваши кулинарные творения</p>
          </div>
          <Link
            to="/recipes/new"
            className="flex items-center gap-2 px-3 md:px-4 py-2.5 rounded-xl bg-orange-500 text-sm font-semibold text-white hover:bg-orange-600 transition-colors"
          >
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span className="hidden sm:inline">Новый рецепт</span>
          </Link>
        </div>

        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 rounded-2xl bg-gray-100 animate-pulse" />
            ))}
          </div>
        )}

        {isError && (
          <div className="text-center py-16">
            <p className="text-sm text-red-500">Не удалось загрузить рецепты. Попробуйте снова.</p>
          </div>
        )}

        {!isLoading && !isError && recipes.length === 0 && (
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

        {!isLoading && recipes.length > 0 && (
          <div className="space-y-3">
            {recipes.map(recipe => (
              <RecipeRow key={recipe.id} recipe={recipe} />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
