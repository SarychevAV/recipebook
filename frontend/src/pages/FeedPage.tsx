import { useState } from 'react';
import { AppLayout } from '../components/shared/AppLayout';
import { RecipeCard } from '../features/recipes/RecipeCard';
import { useRecipes, useTags } from '../hooks/useRecipes';
import type { RecipeQueryParams } from '../types/recipe';

function SearchIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  );
}

export default function FeedPage() {
  const [search, setSearch] = useState('');
  const [activeTagId, setActiveTagId] = useState<string | undefined>();
  const [page, setPage] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [minTime, setMinTime] = useState<number | undefined>();
  const [maxTime, setMaxTime] = useState<number | undefined>();

  const params: RecipeQueryParams = {
    q: search || undefined,
    tagId: activeTagId,
    minTime,
    maxTime,
    page,
    size: 12,
  };

  const { data, isLoading, isError } = useRecipes(params);
  const { data: tagsData } = useTags();

  const recipes = data?.data.content ?? [];
  const totalPages = data?.data.totalPages ?? 0;
  const tags = tagsData?.data ?? [];

  return (
    <AppLayout>
      <div className="px-4 py-5 md:px-8 md:py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-5 md:mb-6">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">Рецепты</h1>
            <p className="text-sm text-gray-400 mt-0.5">Открывай блюда нашего сообщества</p>
          </div>
          <button
            onClick={() => setShowFilters(f => !f)}
            className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-xl border text-sm font-medium transition-colors ${
              showFilters
                ? 'bg-orange-50 border-orange-200 text-orange-600'
                : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
          >
            <FilterIcon />
            <span className="hidden sm:inline">Фильтры</span>
          </button>
        </div>

        {/* Search bar */}
        <div className="relative mb-5">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
            <SearchIcon />
          </span>
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
            placeholder="Поиск рецептов…"
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 transition-all"
          />
        </div>

        {/* Filters panel */}
        {showFilters && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-5 grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Мин. время (мин)</label>
              <input
                type="number"
                min={1}
                value={minTime ?? ''}
                onChange={e => { setMinTime(e.target.value ? Number(e.target.value) : undefined); setPage(0); }}
                className="auth-input text-sm py-2"
                placeholder="напр. 10"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Макс. время (мин)</label>
              <input
                type="number"
                min={1}
                value={maxTime ?? ''}
                onChange={e => { setMaxTime(e.target.value ? Number(e.target.value) : undefined); setPage(0); }}
                className="auth-input text-sm py-2"
                placeholder="напр. 60"
              />
            </div>
          </div>
        )}

        {/* Tag chips */}
        {tags.length > 0 && (
          <div className="flex gap-2 mb-6 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none">
            <button
              onClick={() => { setActiveTagId(undefined); setPage(0); }}
              className={`shrink-0 text-sm font-medium px-4 py-1.5 rounded-full border transition-colors ${
                !activeTagId
                  ? 'bg-orange-500 text-white border-orange-500'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300'
              }`}
            >
              Все
            </button>
            {tags.map(tag => (
              <button
                key={tag.id}
                onClick={() => { setActiveTagId(activeTagId === tag.id ? undefined : tag.id); setPage(0); }}
                className={`shrink-0 text-sm font-medium px-4 py-1.5 rounded-full border transition-colors ${
                  activeTagId === tag.id
                    ? 'bg-orange-500 text-white border-orange-500'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300'
                }`}
              >
                {tag.name}
              </button>
            ))}
          </div>
        )}

        {/* Results */}
        {isLoading && (
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className={`break-inside-avoid mb-4 rounded-2xl bg-gray-100 animate-pulse ${
                  i % 3 === 0 ? 'h-64' : i % 3 === 1 ? 'h-48' : 'h-80'
                }`}
              />
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
            <p className="text-4xl mb-3">🍽️</p>
            <p className="text-sm text-gray-500">Рецепты не найдены. Попробуйте другой поиск или фильтр.</p>
          </div>
        )}

        {!isLoading && recipes.length > 0 && (
          <>
            <div className="columns-1 sm:columns-2 lg:columns-3 gap-4">
              {recipes.map(recipe => (
                <div key={recipe.id} className="break-inside-avoid mb-4">
                  <RecipeCard recipe={recipe} />
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Назад
                </button>
                <span className="text-sm text-gray-500 px-2">
                  Страница {page + 1} из {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Далее
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
