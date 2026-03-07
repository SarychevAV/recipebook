import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import type { RecipeDto } from '../../types/recipe';
import { useAuth } from '../../store/authStore';
import { useDeleteRecipe } from '../../hooks/useRecipes';
import { getErrorMessage } from '../../lib/utils';

const GRADIENTS = [
  'from-orange-400 to-rose-500',
  'from-amber-400 to-orange-500',
  'from-red-400 to-pink-500',
  'from-yellow-400 to-amber-500',
  'from-teal-400 to-cyan-500',
  'from-green-400 to-emerald-500',
];

function pickGradient(title: string) {
  let n = 0;
  for (let i = 0; i < title.length; i++) n += title.charCodeAt(i);
  return GRADIENTS[n % GRADIENTS.length];
}

function parseSteps(instructions: string): string[] {
  return instructions
    .split('\n')
    .map(s => s.trim())
    .filter(Boolean);
}

interface Props {
  recipe: RecipeDto;
}

export function RecipeDetail({ recipe }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const deleteMutation = useDeleteRecipe();
  const [deleteError, setDeleteError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isOwner = user?.id === recipe.ownerId;
  const gradient = pickGradient(recipe.title);
  const steps = parseSteps(recipe.instructions);

  async function handleDelete() {
    try {
      await deleteMutation.mutateAsync(recipe.id);
      navigate('/my-recipes');
    } catch (err) {
      setDeleteError(getErrorMessage(err));
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-gray-400 mb-6">
        <Link to="/" className="hover:text-orange-500 transition-colors">Лента</Link>
        <span>›</span>
        <span className="text-gray-600 font-medium uppercase tracking-wide">{recipe.title}</span>
      </div>

      {/* Hero row */}
      <div className="flex flex-col lg:flex-row gap-8 mb-10">
        {/* Cover image */}
        <div className={`relative lg:w-5/12 h-72 lg:h-auto rounded-2xl overflow-hidden bg-gradient-to-br ${gradient} shrink-0`}>
          <div className="absolute inset-0 flex items-center justify-center opacity-25">
            <span className="text-9xl select-none">🍽️</span>
          </div>
        </div>

        {/* Info panel */}
        <div className="flex-1 min-w-0">
          {/* Title + actions */}
          <div className="flex items-start justify-between gap-4 mb-3">
            <h1 className="text-2xl font-bold text-gray-900 leading-tight">{recipe.title}</h1>
            {isOwner && (
              <div className="flex items-center gap-2 shrink-0">
                <Link
                  to={`/recipes/${recipe.id}/edit`}
                  className="text-xs font-medium px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                >
                  Редактировать
                </Link>
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="text-xs font-medium px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                >
                  Удалить
                </button>
              </div>
            )}
          </div>

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

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-400 mb-0.5">Время готовки</p>
              <p className="text-base font-bold text-gray-900">{recipe.cookingTimeMinutes}</p>
              <p className="text-xs text-gray-400">мин</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-400 mb-0.5">Порции</p>
              <p className="text-base font-bold text-gray-900">{recipe.servings}</p>
              <p className="text-xs text-gray-400">чел.</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-400 mb-0.5">Ингредиенты</p>
              <p className="text-base font-bold text-gray-900">{recipe.ingredients.length}</p>
              <p className="text-xs text-gray-400">шт.</p>
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
                  {[ing.amount, ing.unit].filter(Boolean).join(' ') || '—'}
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
