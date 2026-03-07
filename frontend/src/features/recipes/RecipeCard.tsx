import { Link } from 'react-router-dom';
import type { RecipeSummaryDto } from '../../types/recipe';

const GRADIENTS = [
  'from-orange-400 to-rose-500',
  'from-amber-400 to-orange-500',
  'from-red-400 to-pink-500',
  'from-yellow-400 to-amber-500',
  'from-teal-400 to-cyan-500',
  'from-green-400 to-emerald-500',
];

const HEIGHTS = ['h-48', 'h-64', 'h-80'] as const;

function titleHash(title: string) {
  let n = 0;
  for (let i = 0; i < title.length; i++) n += title.charCodeAt(i);
  return n;
}

function pickGradient(title: string) {
  return GRADIENTS[titleHash(title) % GRADIENTS.length];
}

function pickHeight(title: string) {
  return HEIGHTS[titleHash(title) % HEIGHTS.length];
}

function ClockIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

interface Props {
  recipe: RecipeSummaryDto;
}

export function RecipeCard({ recipe }: Props) {
  const gradient = pickGradient(recipe.title);
  const height = pickHeight(recipe.title);

  return (
    <Link
      to={`/recipes/${recipe.id}`}
      className={`group relative block ${height} rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow`}
    >
      {/* Background: photo or gradient */}
      {recipe.photoUrl ? (
        <img
          src={recipe.photoUrl}
          alt={recipe.title}
          className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
        />
      ) : (
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`}>
          <div className="absolute inset-0 flex items-center justify-center opacity-20">
            <span className="text-8xl select-none">🍽️</span>
          </div>
        </div>
      )}

      {/* Cooking time badge */}
      <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/40 backdrop-blur-sm text-white text-xs font-medium px-2.5 py-1 rounded-full z-10">
        <ClockIcon />
        <span>{recipe.cookingTimeMinutes} мин</span>
      </div>

      {/* Bottom gradient overlay */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-12 pb-4 px-4 z-10">
        {/* Tags */}
        {recipe.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {recipe.tags.slice(0, 2).map(tag => (
              <span
                key={tag.id}
                className="text-xs font-medium bg-white/20 backdrop-blur-sm text-white border border-white/30 px-2 py-0.5 rounded-full"
              >
                {tag.name}
              </span>
            ))}
          </div>
        )}

        <h3 className="font-semibold text-white text-sm leading-snug line-clamp-2 group-hover:text-orange-300 transition-colors">
          {recipe.title}
        </h3>

        {recipe.description && (
          <p className="text-xs text-white/70 line-clamp-1 mt-0.5">{recipe.description}</p>
        )}

        <div className="flex items-center gap-2 mt-2">
          <div className="w-5 h-5 rounded-full bg-orange-400 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-white">
              {recipe.ownerUsername.slice(0, 1).toUpperCase()}
            </span>
          </div>
          <span className="text-xs text-white/80 truncate">{recipe.ownerUsername}</span>
        </div>
      </div>
    </Link>
  );
}
