import { Link, useNavigate } from 'react-router-dom';
import type { RecipeSummaryDto } from '../../types/recipe';
import { useAuth } from '../../store/authStore';
import { useFavoriteRecipe } from '../../hooks/useRecipes';

// Desktop: 2 sizes. Mobile: uniform h-48.
const DESKTOP_HEIGHTS = ['sm:h-56', 'sm:h-80'] as const;

function titleHash(title: string) {
  let n = 0;
  for (let i = 0; i < title.length; i++) n += title.charCodeAt(i);
  return n;
}

function pickHeight(title: string) {
  return DESKTOP_HEIGHTS[titleHash(title) % DESKTOP_HEIGHTS.length];
}

function ClockIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function BookmarkIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  );
}

interface Props {
  recipe: RecipeSummaryDto;
}

export function RecipeCard({ recipe }: Props) {
  const height = pickHeight(recipe.title);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const favMutation = useFavoriteRecipe();

  function handleFavorite(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    favMutation.mutate(recipe.id);
  }

  return (
    <Link
      to={`/recipes/${recipe.id}`}
      className={`group relative block h-48 ${height} rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow`}
    >
      {/* Background: photo or neutral gray placeholder */}
      {recipe.photoUrl ? (
        <img
          src={recipe.photoUrl}
          alt={recipe.title}
          className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200">
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-8xl select-none opacity-20">🍽️</span>
          </div>
        </div>
      )}

      {/* Cooking time badge — top left */}
      <div className="absolute top-3 left-3 flex items-center gap-1 bg-black/40 backdrop-blur-sm text-white text-xs font-medium px-2.5 py-1 rounded-full z-10">
        <ClockIcon />
        <span>{recipe.cookingTimeMinutes} мин</span>
      </div>

      {/* Favorite button — top right */}
      <button
        onClick={handleFavorite}
        className="absolute top-3 right-3 z-10 flex items-center justify-center w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm text-white hover:bg-orange-500/80 active:scale-90 transition-all"
        aria-label="Сохранить в избранное"
      >
        <BookmarkIcon />
      </button>

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
