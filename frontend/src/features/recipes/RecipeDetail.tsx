import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import type { RecipeDto } from '../../types/recipe';
import { useAuth } from '../../store/authStore';
import { useDeleteRecipe, useSubmitForReview, useFavoriteRecipe } from '../../hooks/useRecipes';
import { getErrorMessage } from '../../lib/utils';

function parseSteps(instructions: string): string[] {
  return instructions
    .split('\n')
    .map(s => s.trim())
    .filter(Boolean);
}

function BookmarkIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function DotsIcon() {
  return (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <circle cx="5" cy="12" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="19" cy="12" r="2" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4h6v2" />
    </svg>
  );
}

interface Props {
  recipe: RecipeDto;
}

export function RecipeDetail({ recipe }: Props) {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const deleteMutation = useDeleteRecipe();
  const submitMutation = useSubmitForReview(recipe.id);
  const favMutation = useFavoriteRecipe();

  const [deleteError, setDeleteError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const isOwner = user?.id === recipe.ownerId;
  const steps = parseSteps(recipe.instructions);
  const isPending = recipe.status === 'PENDING_REVIEW';
  const isDraft = recipe.status === 'DRAFT';
  const isRejected = recipe.status === 'REJECTED';

  async function handleDelete() {
    try {
      await deleteMutation.mutateAsync(recipe.id);
      navigate('/my-recipes');
    } catch (err) {
      setDeleteError(getErrorMessage(err));
    }
  }

  async function handleSubmit() {
    setSubmitError('');
    try {
      await submitMutation.mutateAsync();
    } catch (err) {
      setSubmitError(getErrorMessage(err));
    }
  }

  function handleFavorite() {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    favMutation.mutate(recipe.id);
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-5 md:px-6 md:py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-gray-400 mb-6">
        <Link to="/" className="hover:text-orange-500 transition-colors">Лента</Link>
        <span>›</span>
        <span className="text-gray-600 font-medium">{recipe.title}</span>
      </div>

      {/* Hero row */}
      <div className="flex flex-col lg:flex-row gap-8 mb-10">
        {/* Cover image */}
        <div className="relative lg:w-5/12 h-72 lg:h-auto rounded-2xl overflow-hidden shrink-0">
          {recipe.photoUrl ? (
            <img
              src={recipe.photoUrl}
              alt={recipe.title}
              className="absolute inset-0 w-full h-full object-cover object-center"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
              <span className="text-9xl select-none opacity-25">🍽️</span>
            </div>
          )}
        </div>

        {/* Info panel */}
        <div className="flex-1 min-w-0">
          {/* Title + actions */}
          <div className="mb-3">
            <div className="flex items-start gap-3">
              <h1 className="flex-1 text-xl md:text-2xl font-bold text-gray-900 leading-tight">
                {recipe.title}
              </h1>
              <div className="flex items-center gap-2 shrink-0">
                {/* Favorite */}
                <button
                  onClick={handleFavorite}
                  className="p-2 rounded-xl bg-gray-100 text-gray-500 hover:bg-orange-50 hover:text-orange-500 active:scale-90 transition-all"
                  aria-label="Сохранить в избранное"
                >
                  <BookmarkIcon />
                </button>
                {/* Owner ··· menu */}
                {isOwner && (
                  <button
                    onClick={() => setShowMenu(true)}
                    className="p-2 rounded-xl bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
                    aria-label="Действия"
                  >
                    <DotsIcon />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Status panel for owner */}
          {isOwner && recipe.status !== 'PUBLISHED' && (
            <div className="mb-4">
              {isPending && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 border border-amber-100">
                  <span className="text-amber-500">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                  </span>
                  <p className="text-xs text-amber-700 font-medium">Рецепт на проверке у модератора</p>
                </div>
              )}
              {isDraft && (
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">Черновик</span>
                  {submitError && <p className="text-xs text-red-500">{submitError}</p>}
                  <button
                    onClick={handleSubmit}
                    disabled={submitMutation.isPending}
                    className="text-xs font-medium px-3 py-1 rounded-lg bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-60 transition-colors"
                  >
                    {submitMutation.isPending ? 'Отправляем…' : 'Отправить на проверку'}
                  </button>
                </div>
              )}
              {isRejected && (
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-100 text-red-600">Отклонён</span>
                    {submitError && <p className="text-xs text-red-500">{submitError}</p>}
                    <button
                      onClick={handleSubmit}
                      disabled={submitMutation.isPending}
                      className="text-xs font-medium px-3 py-1 rounded-lg bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-60 transition-colors"
                    >
                      {submitMutation.isPending ? 'Отправляем…' : 'Отправить повторно'}
                    </button>
                  </div>
                  {recipe.rejectionReason && (
                    <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">
                      Причина отклонения: {recipe.rejectionReason}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Tags */}
          {recipe.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {recipe.tags.map(tag => (
                <span
                  key={tag.id}
                  className="text-xs font-medium px-3 py-1 rounded-full bg-orange-50 text-orange-600 border border-orange-100"
                >
                  {tag.name}
                </span>
              ))}
            </div>
          )}

          {/* Description */}
          {recipe.description && (
            <div className="mb-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-1">Описание</h2>
              <p className="text-sm text-gray-600 leading-relaxed">{recipe.description}</p>
            </div>
          )}

          {/* Stats with emoji icons */}
          <div className="flex gap-2 mb-5">
            <div className="flex-1 flex items-center gap-2.5 bg-gray-50 rounded-xl px-3 py-3">
              <span className="text-xl leading-none">⏱</span>
              <div>
                <p className="text-sm font-bold text-gray-900 leading-tight">{recipe.cookingTimeMinutes} мин</p>
                <p className="text-xs text-gray-400">Время</p>
              </div>
            </div>
            <div className="flex-1 flex items-center gap-2.5 bg-gray-50 rounded-xl px-3 py-3">
              <span className="text-xl leading-none">👥</span>
              <div>
                <p className="text-sm font-bold text-gray-900 leading-tight">{recipe.servings} чел.</p>
                <p className="text-xs text-gray-400">Порции</p>
              </div>
            </div>
            <div className="flex-1 flex items-center gap-2.5 bg-gray-50 rounded-xl px-3 py-3">
              <span className="text-xl leading-none">🥕</span>
              <div>
                <p className="text-sm font-bold text-gray-900 leading-tight">{recipe.ingredients.length} шт.</p>
                <p className="text-xs text-gray-400">Состав</p>
              </div>
            </div>
          </div>

          {/* Author */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
              <span className="text-sm font-bold text-orange-600">
                {recipe.ownerUsername.slice(0, 2).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">{recipe.ownerUsername}</p>
              <p className="text-xs text-gray-400">Автор рецепта</p>
            </div>
          </div>
        </div>
      </div>

      {/* Ingredients */}
      <section className="mb-8">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Ингредиенты</h2>
        <div className="grid sm:grid-cols-2 gap-2">
          {recipe.ingredients
            .slice()
            .sort((a, b) => a.orderIndex - b.orderIndex)
            .map(ing => (
              <div
                key={ing.id}
                className="flex items-center justify-between px-4 py-3 bg-white rounded-xl border border-gray-100"
              >
                <span className="text-sm text-gray-800 font-medium">{ing.name}</span>
                <span className="text-sm text-gray-500">
                  {[ing.amount, ing.unit?.toLowerCase()].filter(Boolean).join(' ') || '—'}
                </span>
              </div>
            ))}
        </div>
      </section>

      {/* Instructions */}
      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-4">Пошаговые инструкции</h2>
        <div className="space-y-3">
          {steps.map((step, i) => (
            <div key={i} className="flex gap-4 p-4 bg-white rounded-xl border border-gray-100">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-orange-500 text-white text-xs font-bold flex items-center justify-center">
                {i + 1}
              </span>
              <p className="text-sm text-gray-700 leading-relaxed pt-0.5">{step}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Owner bottom sheet menu */}
      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40"
            onClick={() => setShowMenu(false)}
          />
          <div className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl shadow-2xl pb-safe">
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-gray-200 rounded-full" />
            </div>
            <div className="px-4 pb-8 space-y-1">
              {!isPending && (
                <Link
                  to={`/recipes/${recipe.id}/edit`}
                  onClick={() => setShowMenu(false)}
                  className="flex items-center gap-3 px-4 py-4 rounded-xl hover:bg-gray-50 text-gray-800 font-medium transition-colors"
                >
                  <span className="text-gray-400"><EditIcon /></span>
                  Редактировать
                </Link>
              )}
              <button
                onClick={() => { setShowMenu(false); setConfirmDelete(true); }}
                className="w-full flex items-center gap-3 px-4 py-4 rounded-xl hover:bg-red-50 text-red-500 font-medium transition-colors"
              >
                <TrashIcon />
                Удалить рецепт
              </button>
            </div>
          </div>
        </>
      )}

      {/* Delete confirm dialog */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4">
            <h3 className="font-bold text-gray-900 mb-2">Удалить рецепт?</h3>
            <p className="text-sm text-gray-500 mb-5">
              Рецепт «{recipe.title}» будет удалён навсегда. Это действие нельзя отменить.
            </p>
            {deleteError && (
              <p className="text-xs text-red-500 mb-3">{deleteError}</p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(false)}
                className="flex-1 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="flex-1 py-2 rounded-xl bg-red-500 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-60 transition-colors"
              >
                {deleteMutation.isPending ? 'Удаляем…' : 'Удалить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
