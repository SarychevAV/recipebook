import { useEffect, useRef, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import type { FieldPath } from 'react-hook-form';
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

function CheckIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}

const STEPS = ['Основное', 'Теги', 'Ингредиенты', 'Инструкции'];

const STEP_FIELDS: FieldPath<RecipeFormData>[][] = [
  ['title', 'description', 'cookingTimeMinutes', 'servings'],
  ['tagIds'],
  ['ingredients'],
  ['instructions'],
];

const UNITS = ['г', 'кг', 'мл', 'л', 'шт', 'ст.л', 'ч.л', 'по вкусу'];

interface Props {
  initialValues?: RecipeDto;
  onSubmit: (data: RecipeFormData) => Promise<void>;
  isSubmitting: boolean;
  submitLabel?: string;
  onPhotoChange?: (file: File | null) => void;
  initialPhotoUrl?: string;
}

const EMPTY_INGREDIENT = { name: '', amount: '', unit: 'г', orderIndex: 0 };

export function RecipeForm({ initialValues, onSubmit, isSubmitting, submitLabel = 'Сохранить рецепт', onPhotoChange, initialPhotoUrl }: Props) {
  const [currentStep, setCurrentStep] = useState(0);
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
    trigger,
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
            .map(({ name, amount, unit, orderIndex }) => ({
              name,
              amount,
              unit: unit || 'г',
              orderIndex,
            })),
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

  async function goNext() {
    const valid = await trigger(STEP_FIELDS[currentStep]);
    if (valid) setCurrentStep(s => Math.min(s + 1, STEPS.length - 1));
  }

  function goBack() {
    setCurrentStep(s => Math.max(s - 1, 0));
  }

  async function handleFormSubmit(data: RecipeFormData) {
    await onSubmit(data);
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">

      {/* Progress bar */}
      <div className="grid grid-cols-4">
        {STEPS.map((label, i) => {
          const done = i < currentStep;
          const active = i === currentStep;
          return (
            <div key={i} className="flex flex-col items-center relative">
              {/* Left connecting line */}
              {i > 0 && (
                <div
                  className={`absolute top-4 right-1/2 left-0 h-0.5 -translate-y-1/2 transition-colors duration-300 ${
                    i <= currentStep ? 'bg-orange-500' : 'bg-gray-200'
                  }`}
                />
              )}
              {/* Right connecting line */}
              {i < STEPS.length - 1 && (
                <div
                  className={`absolute top-4 left-1/2 right-0 h-0.5 -translate-y-1/2 transition-colors duration-300 ${
                    i < currentStep ? 'bg-orange-500' : 'bg-gray-200'
                  }`}
                />
              )}
              {/* Step circle */}
              <div
                className={`relative z-10 w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-semibold transition-colors duration-200 ${
                  done || active
                    ? 'bg-orange-500 border-orange-500 text-white'
                    : 'bg-white border-gray-200 text-gray-400'
                }`}
              >
                {done ? <CheckIcon /> : i + 1}
              </div>
              {/* Step label — sm+ only */}
              <span
                className={`mt-2 text-xs font-medium text-center hidden sm:block transition-colors ${
                  active ? 'text-orange-600' : done ? 'text-gray-500' : 'text-gray-400'
                }`}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
      {/* Mobile: current step label */}
      <p className="sm:hidden text-center text-xs text-gray-400 -mt-1">
        Шаг {currentStep + 1} из {STEPS.length}:{' '}
        <span className="font-semibold text-orange-600">{STEPS[currentStep]}</span>
      </p>

      {/* Step 1 — Basic info */}
      {currentStep === 0 && (
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

          {/* items-end выравнивает input-ы по нижней границе — иначе длинный
              label "Время готовки (мин)" переносится и сдвигает поле вниз */}
          <div className="grid grid-cols-2 gap-4 items-end">
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
      )}

      {/* Step 2 — Tags */}
      {currentStep === 1 && (
        <section className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-1">Категории</h2>
          <p className="text-xs text-gray-400 mb-4">Выберите теги, которые лучше всего описывают ваш рецепт</p>
          {availableTags.length > 0 ? (
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
          ) : (
            <p className="text-sm text-gray-400">Загрузка тегов…</p>
          )}
        </section>
      )}

      {/* Step 3 — Ingredients */}
      {currentStep === 2 && (
        <section className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Ингредиенты *</h2>

          {errors.ingredients?.root && (
            <p className="mb-3 text-xs text-red-500">{errors.ingredients.root.message}</p>
          )}

          <div className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id}>
                {/* Строка 1: Название + корзина */}
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <input
                      {...register(`ingredients.${index}.name`)}
                      placeholder="Название ингредиента"
                      className="auth-input"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => fields.length > 1 && remove(index)}
                    disabled={fields.length <= 1}
                    className="flex-shrink-0 p-2.5 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Удалить ингредиент"
                  >
                    <TrashIcon />
                  </button>
                </div>
                {errors.ingredients?.[index]?.name && (
                  <p className="mb-2 text-xs text-red-500">{errors.ingredients[index]?.name?.message}</p>
                )}

                {/* Строка 2: Количество + единица */}
                <div className="flex gap-2">
                  <div className="flex-1 min-w-0">
                    <input
                      {...register(`ingredients.${index}.amount`)}
                      placeholder="Количество"
                      className="auth-input"
                    />
                  </div>
                  {/* Unit — 120px, padding задан inline чтобы "по вкусу" влезало */}
                  <select
                    {...register(`ingredients.${index}.unit`)}
                    className="flex-shrink-0 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 outline-none transition-all focus:border-orange-400 focus:bg-white focus:ring-2 focus:ring-orange-400/20 cursor-pointer"
                    style={{ width: '120px', paddingTop: '0.75rem', paddingBottom: '0.75rem', paddingLeft: '12px', paddingRight: '4px' }}
                  >
                    {UNITS.map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>

                {/* Разделитель между ингредиентами */}
                {index < fields.length - 1 && (
                  <hr className="mt-4 border-gray-100" />
                )}
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => append({ name: '', amount: '', unit: 'г', orderIndex: fields.length })}
            className="mt-5 flex items-center gap-1.5 text-sm font-medium text-orange-600 hover:text-orange-700 transition-colors"
          >
            <PlusIcon />
            Добавить ингредиент
          </button>
        </section>
      )}

      {/* Step 4 — Instructions + Photo */}
      {currentStep === 3 && (
        <>
          <section className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-1">Инструкции *</h2>
            <p className="text-xs text-gray-400 mb-4">
              Напишите каждый шаг на новой строке — они будут отображаться как пронумерованные шаги.
            </p>
            <textarea
              {...register('instructions')}
              rows={10}
              placeholder={`Замаринуйте курицу в йогурте со специями на 1 час.\nРазогрейте масло на сковороде и обжарьте лук до золотистого цвета.\nДобавьте томатное пюре и готовьте 5 минут.\n…`}
              className="auth-input resize-none text-sm leading-relaxed"
            />
            {errors.instructions && (
              <p className="mt-1.5 text-xs text-red-500">{errors.instructions.message}</p>
            )}
          </section>

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
        </>
      )}

      {/* Navigation */}
      <div className="flex gap-3 pb-4">
        {currentStep > 0 && (
          <button
            type="button"
            onClick={goBack}
            className="px-6 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-200 focus:ring-offset-2"
          >
            ← Назад
          </button>
        )}
        {currentStep < STEPS.length - 1 ? (
          <button
            type="button"
            onClick={goNext}
            className="flex-1 px-6 py-3 rounded-xl bg-orange-500 text-sm font-semibold text-white hover:bg-orange-600 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
          >
            Далее →
          </button>
        ) : (
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 px-8 py-3 rounded-xl bg-orange-500 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
          >
            {isSubmitting ? 'Сохраняем…' : submitLabel}
          </button>
        )}
      </div>
    </form>
  );
}
