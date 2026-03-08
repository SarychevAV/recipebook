import { Link } from 'react-router-dom';
import { AppLayout } from '../components/shared/AppLayout';
import { useAuth } from '../store/authStore';

function ChevronIcon() {
  return (
    <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h4a3 3 0 0 1 3 3v1" />
    </svg>
  );
}

export default function ProfilePage() {
  const { user, clearAuth } = useAuth();

  return (
    <AppLayout>
      <div className="px-4 py-5 md:px-8 md:py-8 max-w-lg mx-auto">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-6">Профиль</h1>

        {/* User card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4 flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-orange-100 flex items-center justify-center shrink-0">
            <span className="text-2xl font-bold text-orange-600">
              {user?.username.slice(0, 2).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <p className="font-bold text-gray-900 truncate">{user?.username}</p>
            <p className="text-sm text-gray-400 mt-0.5">Мой аккаунт</p>
          </div>
        </div>

        {/* Navigation links */}
        <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-100 mb-4">
          <Link
            to="/my-recipes"
            className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors rounded-t-2xl"
          >
            <span className="text-sm font-medium text-gray-700">Мои рецепты</span>
            <ChevronIcon />
          </Link>
          <Link
            to="/recipes/new"
            className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors rounded-b-2xl"
          >
            <span className="text-sm font-medium text-gray-700">Создать рецепт</span>
            <ChevronIcon />
          </Link>
        </div>

        {/* Logout */}
        <button
          onClick={clearAuth}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-red-200 text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors"
        >
          <LogoutIcon />
          Выйти из аккаунта
        </button>
      </div>
    </AppLayout>
  );
}
