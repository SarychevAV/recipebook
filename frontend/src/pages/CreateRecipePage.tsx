import { useNavigate, Link } from 'react-router-dom';
import { AppLayout } from '../components/shared/AppLayout';
import { RecipeForm } from '../features/recipes/RecipeForm';
import { useCreateRecipe } from '../hooks/useRecipes';
import { uploadRecipePhoto } from '../api/recipes';
import { getErrorMessage } from '../lib/utils';
import { useRef, useState } from 'react';
import type { RecipeFormData } from '../lib/schemas';

export default function CreateRecipePage() {
  const navigate = useNavigate();
  const mutation = useCreateRecipe();
  const [error, setError] = useState('');
  const pendingPhotoRef = useRef<File | null>(null);

  async function handleSubmit(data: RecipeFormData) {
    setError('');
    try {
      const result = await mutation.mutateAsync(data);
      const newId = result.data.id;
      if (pendingPhotoRef.current) {
        try {
          await uploadRecipePhoto(newId, pendingPhotoRef.current);
        } catch {
          // photo upload failed — navigate anyway, recipe was saved
        }
      }
      navigate(`/recipes/${newId}`);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto px-4 py-5 md:px-6 md:py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-orange-500 transition-colors mb-4"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            На главную
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Создать рецепт</h1>
          <p className="text-sm text-gray-400 mt-0.5">Поделитесь своим кулинарным шедевром с сообществом</p>
        </div>

        {error && (
          <div className="mb-6 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600">
            {error}
          </div>
        )}

        <RecipeForm
          onSubmit={handleSubmit}
          isSubmitting={mutation.isPending}
          submitLabel="Опубликовать рецепт"
          onPhotoChange={file => { pendingPhotoRef.current = file; }}
        />
      </div>
    </AppLayout>
  );
}
