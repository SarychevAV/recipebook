import { useEffect, useRef, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { recipeSchema, type RecipeFormData } from '../../lib/schemas';
import { useTags } from '../../hooks/useRecipes';
import type { RecipeDto } from '../../types/recipe';

function PlusIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4h6v2" />
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
    </svg>
  );
}

interface Props {
  initialValues?: RecipeDto;
  onSubmit: (data: RecipeFormData) => Promise<void>;
  isSubmitting: boolean;
  submitLabel?: string;
  onPhotoChange?: (file: File | null) => void;
  initialPhotoUrl?: string;
}

const EMPTY_INGREDIENT = { name: '', amount: '', unit: '', orderIndex: 0 };

export function RecipeForm({ initialValues, onSubmit, isSubmitting, submitLabel = 'Сохранить рецепт', onPhotoChange, initialPhotoUrl }: Props) {
  const { data: tagsData } = useTags();
  const availableTags = tagsData?.data ?? [];

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(initialPhotoUrl ?? initialValues?.photoUrl ?? null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (file) {
      setPhotoPreview(URL.createObjectURL(file));
    } else {
      setPhotoPreview(initialPhotoUrl ?? initialValues?.photoUrl ?? null);
    }
    onPhotoChange?.(file);
  }

  function handleRemovePhoto() {
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    onPhotoChange?.(null);
  }

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RecipeFormData>({
    resolver: zodResolver(recipeSchema),
    defaultValues: initialValues
      ? {
          title: initialValues.title,
          description: initialValues.description,
          instructions: initialValues.instructions,
          cookingTimeMinutes: initialValues.cookingTimeMinutes,
          servings: initialValues.servings,
          ingredients: initialValues.ingredients
            .slice()
            .sort((a, b) => a.orderIndex - b.orderIndex)
            .map(({ name, amount, unit, orderIndex }) => ({ name, amount, unit, orderIndex })),
          tagIds: initialValues.tags.map(t => t.id),
        }
      : {
          title: '',
          description: '',
          instructions: '',
          cookingTimeMinutes: 30,
          servings: 2,
          ingredients: [{ ...EMPTY_INGREDIENT }],
          tagIds: [],
        },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'ingredients' });

  // Keep orderIndex in sync
  useEffect(() => {
    fields.forEach((_, i) => {
      setValue(`ingredients.${i}.orderIndex`, i);
    });
  }, [fields, setValue]);

  const selectedTagIds = watch('tagIds') ?? [];

  function toggleTag(tagId: string) {
    const next = selectedTagIds.includes(tagId)
      ? selectedTagIds.filter(id => id !== tagId)
      : [...selectedTagIds, tagId];
    setValue('tagIds', next);
  }

  async function handleFormSubmit(data: RecipeFormData) {
    await onSubmit(data);
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8">
      {/* Basic info */}
      <section className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
        <h2 className="text-base font-semibold text-gray-900">Основная информация</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Название *</label>
          <input
            {...register('title')}
            placeholder="напр. Курица в сливочном соусе"
            className="auth-input"
          />
          {errors.title && (
            <p className="mt-1.5 text-xs text-red-500">{errors.title.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Описание</label>
          <textarea
            {...register('description')}
            rows={3}
            placeholder="Краткое описание, которое будет отображаться в карточке рецепта…"
            className="auth-input resize-none"
          />
          {errors.description && (
            <p className="mt-1.5 text-xs text-red-500">{errors.description.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Время готовки (мин) *</label>
            <input
              type="number"
              min={1}
              {...register('cookingTimeMinutes', { valueAsNumber: true })}
              className="auth-input"
            />
            {errors.cookingTimeMinutes && (
              <p className="mt-1.5 text-xs text-red-500">{errors.cookingTimeMinutes.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Порции *</label>
            <input
              type="number"
              min={1}
              {...register('servings', { valueAsNumber: true })}
              className="auth-input"
            />
            {errors.servings && (
              <p className="mt-1.5 text-xs text-red-500">{errors.servings.message}</p>
            )}
          </div>
        </div>
      </section>

      {/* Tags */}
      {availableTags.length > 0 && (
        <section className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Теги</h2>
          <div className="flex flex-wrap gap-2">
            {availableTags.map(tag => {
              const active = selectedTagIds.includes(tag.id);
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.id)}
                  className={`text-sm font-medium px-3.5 py-1.5 rounded-full border transition-colors ${
                    active
                      ? 'bg-orange-500 text-white border-orange-500'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300 hover:text-orange-600'
                  }`}
                >
                  {tag.name}
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Ingredients */}
      <section className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900">Ингредиенты *</h2>
          <button
            type="button"
            onClick={() => append({ name: '', amount: '', unit: '', orderIndex: fields.length })}
            className="flex items-center gap-1.5 text-sm font-medium text-orange-600 hover:text-orange-700 transition-colors"
          >
            <PlusIcon />
            Добавить ингредиент
          </button>
        </div>

        {errors.ingredients?.root && (
          <p className="mb-3 text-xs text-red-500">{errors.ingredients.root.message}</p>
        )}

        <div className="space-y-3">
          {fields.map((field, index) => (
            <div key={field.id} className="flex gap-3 items-start">
              <div className="flex-1 grid grid-cols-3 gap-2">
                <div className="col-span-1">
                  <input
                    {...register(`ingredients.${index}.name`)}
                    placeholder="Ингредиент"
                    className="auth-input text-sm py-2.5"
                  />
                  {errors.ingredients?.[index]?.name && (
                    <p className="mt-1 text-xs text-red-500">{errors.ingredients[index]?.name?.message}</p>
                  )}
                </div>
                <input
                  {...register(`ingredients.${index}.amount`)}
                  placeholder="Количество"
                  className="auth-input text-sm py-2.5"
                />
                <input
                  {...register(`ingredients.${index}.unit`)}
                  placeholder="Ед. (г, мл…)"
                  className="auth-input text-sm py-2.5"
                />
              </div>

              <button
                type="button"
                onClick={() => fields.length > 1 && remove(index)}
                disabled={fields.length <= 1}
                className="mt-0.5 p-2.5 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Удалить ингредиент"
              >
                <TrashIcon />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Instructions */}
      <section className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-1.5">Инструкции *</h2>
        <p className="text-xs text-gray-400 mb-4">Напишите каждый шаг на новой строке — они будут отображаться как пронумерованные шаги.</p>
        <textarea
          {...register('instructions')}
          rows={10}
          placeholder={`Замаринуйте курицу в йогурте со специями на 1 час.\nРазогрейте масло на сковороде и обжарьте лук до золотистого цвета.\nДобавьте томатное пюре и готовьте 5 минут.\n…`}
          className="auth-input resize-none font-mono text-sm leading-relaxed"
        />
        {errors.instructions && (
          <p className="mt-1.5 text-xs text-red-500">{errors.instructions.message}</p>
        )}
      </section>

      {/* Photo */}
      <section className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Фото рецепта</h2>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
        {photoPreview ? (
          <div className="relative">
            <img
              src={photoPreview}
              alt="Предпросмотр фото"
              className="w-full h-56 object-cover rounded-xl"
            />
            <div className="absolute top-3 right-3 flex gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 rounded-lg bg-black/50 text-white text-xs font-medium hover:bg-black/70 transition-colors backdrop-blur-sm"
              >
                Заменить
              </button>
              <button
                type="button"
                onClick={handleRemovePhoto}
                className="px-3 py-1.5 rounded-lg bg-black/50 text-white text-xs font-medium hover:bg-black/70 transition-colors backdrop-blur-sm"
              >
                Удалить
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full h-40 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-orange-300 hover:text-orange-400 transition-colors"
          >
            <CameraIcon />
            <span className="text-sm font-medium">Добавить фото</span>
            <span className="text-xs">PNG, JPG до 10 МБ</span>
          </button>
        )}
      </section>

      {/* Submit */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-8 py-3 rounded-xl bg-orange-500 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
        >
          {isSubmitting ? 'Сохраняем…' : submitLabel}
        </button>
      </div>
    </form>
  );
}
