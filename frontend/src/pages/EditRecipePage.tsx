import { useNavigate, useParams, Link } from 'react-router-dom';
import { AppLayout } from '../components/shared/AppLayout';
import { RecipeForm } from '../features/recipes/RecipeForm';
import { useRecipe, useUpdateRecipe } from '../hooks/useRecipes';
import { uploadRecipePhoto } from '../api/recipes';
import { getErrorMessage } from '../lib/utils';
import { useRef, useState } from 'react';
import type { RecipeFormData } from '../lib/schemas';
import { useAuth } from '../store/authStore';

export default function EditRecipePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data, isLoading, isError } = useRecipe(id ?? '');
  const mutation = useUpdateRecipe(id ?? '');
  const [error, setError] = useState('');
  const pendingPhotoRef = useRef<File | null>(null);

  async function handleSubmit(formData: RecipeFormData) {
    setError('');
    try {
      await mutation.mutateAsync(formData);
      if (pendingPhotoRef.current && id) {
        try {
          await uploadRecipePhoto(id, pendingPhotoRef.current);
        } catch {
          // photo upload failed — navigate anyway, recipe was saved
        }
      }
      navigate(`/recipes/${id}`);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  const recipe = data?.data;
  const isOwner = recipe && user?.id === recipe.ownerId;

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            to={id ? `/recipes/${id}` : '/'}
            className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-orange-500 transition-colors mb-4"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            К рецепту
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Редактировать рецепт</h1>
        </div>

        {isLoading && (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 rounded-2xl bg-gray-100 animate-pulse" />
            ))}
          </div>
        )}

        {isError && (
          <div className="text-center py-12">
            <p className="text-sm text-red-500">Рецепт не найден.</p>
          </div>
        )}

        {recipe && !isOwner && (
          <div className="text-center py-12">
            <p className="text-sm text-red-500">У вас нет прав для редактирования этого рецепта.</p>
          </div>
        )}

        {recipe && isOwner && (
          <>
            {error && (
              <div className="mb-6 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600">
                {error}
              </div>
            )}
            <RecipeForm
              initialValues={recipe}
              onSubmit={handleSubmit}
              isSubmitting={mutation.isPending}
              submitLabel="Обновить рецепт"
              onPhotoChange={file => { pendingPhotoRef.current = file; }}
              initialPhotoUrl={recipe.photoUrl}
            />
          </>
        )}
      </div>
    </AppLayout>
  );
}
