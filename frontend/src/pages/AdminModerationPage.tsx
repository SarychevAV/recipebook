import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from '../components/shared/AppLayout';
import { usePendingRecipes, useApproveRecipe, useRejectRecipe } from '../hooks/useRecipes';
import { getErrorMessage } from '../lib/utils';
import type { RecipeSummaryDto } from '../types/recipe';

function RejectModal({
  recipe,
  onClose,
  onReject,
}: {
  recipe: RecipeSummaryDto;
  onClose: () => void;
  onReject: (reason: string) => Promise<void>;
}) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!reason.trim()) {
      setError('Укажите причину отклонения');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await onReject(reason.trim());
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4">
        <h3 className="font-bold text-gray-900 mb-1">Отклонить рецепт?</h3>
        <p className="text-sm text-gray-500 mb-4">«{recipe.title}» — укажите причину отклонения:</p>
        <textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          rows={3}
          placeholder="Например: недостаточно подробные инструкции"
          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-800 outline-none focus:border-orange-400 resize-none mb-3"
        />
        {error && <p className="text-xs text-red-500 mb-3">{error}</p>}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Отмена
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-2 rounded-xl bg-red-500 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-60 transition-colors"
          >
            {loading ? 'Отклоняем…' : 'Отклонить'}
          </button>
        </div>
      </div>
    </div>
  );
}

function PendingRecipeCard({
  recipe,
  onApprove,
  onReject,
}: {
  recipe: RecipeSummaryDto;
  onApprove: () => void;
  onReject: () => void;
}) {
  const [approveError, setApproveError] = useState('');
  const approveMutation = useApproveRecipe();

  async function handleApprove() {
    setApproveError('');
    try {
      await approveMutation.mutateAsync(recipe.id);
    } catch (err) {
      setApproveError(getErrorMessage(err));
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 flex gap-4">
      {/* Thumbnail */}
      <div className="w-24 h-24 shrink-0 rounded-xl overflow-hidden bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center">
        {recipe.photoUrl ? (
          <img src={recipe.photoUrl} alt={recipe.title} className="w-full h-full object-cover" />
        ) : (
          <span className="text-3xl select-none">🍽️</span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <Link
            to={`/recipes/${recipe.id}`}
            className="font-semibold text-gray-900 text-sm hover:text-orange-600 transition-colors"
          >
            {recipe.title}
          </Link>
          <span className="text-xs text-gray-400 shrink-0">
            {new Date(recipe.createdAt).toLocaleDateString('ru-RU')}
          </span>
        </div>

        <p className="text-xs text-gray-500 mb-1">Автор: {recipe.ownerUsername}</p>

        {recipe.description && (
          <p className="text-xs text-gray-400 line-clamp-2 mb-2">{recipe.description}</p>
        )}

        {recipe.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {recipe.tags.map(tag => (
              <span key={tag.id} className="text-xs px-2 py-0.5 rounded-full bg-orange-50 text-orange-600">
                {tag.name}
              </span>
            ))}
          </div>
        )}

        {approveError && <p className="text-xs text-red-500 mb-2">{approveError}</p>}

        <div className="flex items-center gap-2">
          <button
            onClick={() => { void handleApprove(); onApprove(); }}
            disabled={approveMutation.isPending}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-green-500 text-white hover:bg-green-600 disabled:opacity-60 transition-colors"
          >
            {approveMutation.isPending ? 'Одобряем…' : 'Одобрить'}
          </button>
          <button
            onClick={onReject}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
          >
            Отклонить
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminModerationPage() {
  const { data, isLoading, isError } = usePendingRecipes();
  const rejectMutation = useRejectRecipe();
  const recipes = data?.data.content ?? [];
  const [rejectTarget, setRejectTarget] = useState<RecipeSummaryDto | null>(null);

  return (
    <AppLayout>
      <div className="px-4 py-5 md:px-8 md:py-8">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Модерация рецептов</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {isLoading ? '…' : `${recipes.length} рецептов ожидают проверки`}
          </p>
        </div>

        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
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
            <p className="text-5xl mb-4">✅</p>
            <p className="text-base font-medium text-gray-700 mb-1">Очередь пуста</p>
            <p className="text-sm text-gray-400">Все рецепты проверены</p>
          </div>
        )}

        {!isLoading && recipes.length > 0 && (
          <div className="space-y-3">
            {recipes.map(recipe => (
              <PendingRecipeCard
                key={recipe.id}
                recipe={recipe}
                onApprove={() => {}}
                onReject={() => setRejectTarget(recipe)}
              />
            ))}
          </div>
        )}
      </div>

      {rejectTarget && (
        <RejectModal
          recipe={rejectTarget}
          onClose={() => setRejectTarget(null)}
          onReject={reason => rejectMutation.mutateAsync({ id: rejectTarget.id, reason })}
        />
      )}
    </AppLayout>
  );
}
