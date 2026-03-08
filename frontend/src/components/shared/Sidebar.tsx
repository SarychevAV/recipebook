import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/authStore';

function HomeIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function CompassIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <circle cx="12" cy="12" r="10" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </svg>
  );
}

function PlusCircleIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  );
}

function BookmarkIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function BookOpenIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function SlidersIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <line x1="4" y1="21" x2="4" y2="14" />
      <line x1="4" y1="10" x2="4" y2="3" />
      <line x1="12" y1="21" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12" y2="3" />
      <line x1="20" y1="21" x2="20" y2="16" />
      <line x1="20" y1="12" x2="20" y2="3" />
      <line x1="1" y1="14" x2="7" y2="14" />
      <line x1="9" y1="8" x2="15" y2="8" />
      <line x1="17" y1="16" x2="23" y2="16" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

const PUBLIC_NAV_ITEMS = [
  { label: 'Лента',           path: '/',             Icon: HomeIcon },
  { label: 'Открыть',         path: '/explore',      Icon: CompassIcon },
];

const AUTH_NAV_ITEMS = [
  { label: 'Новый рецепт',    path: '/recipes/new',  Icon: PlusCircleIcon },
  { label: 'Сохранённые',     path: '/saved',        Icon: BookmarkIcon },
  { label: 'Мои рецепты',     path: '/my-recipes',   Icon: BookOpenIcon },
];

interface Props {
  onClose?: () => void;
}

export function Sidebar({ onClose }: Props) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, clearAuth } = useAuth();

  const adminNavItems = user?.role === 'ADMIN'
    ? [{ label: 'Модерация', path: '/admin/moderation', Icon: ShieldIcon }]
    : [];

  const navItems = isAuthenticated
    ? [...PUBLIC_NAV_ITEMS, ...AUTH_NAV_ITEMS, ...adminNavItems]
    : PUBLIC_NAV_ITEMS;

  return (
    <aside className="w-56 shrink-0 flex flex-col h-full bg-white border-r border-gray-100">
      {/* Logo */}
      <div className="px-5 pt-6 pb-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5" onClick={onClose}>
          <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-orange-500">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="15" r="7" />
              <path strokeLinecap="round" d="M12 8V5" />
              <path strokeLinecap="round" strokeLinejoin="round" fill="currentColor" d="M12 5.5C13 3.5 15 2 17.5 2.5C15.5 3.5 13.5 5 12 5.5Z" />
            </svg>
          </span>
          <span className="text-sm font-bold text-gray-900 tracking-tight">Мандаринка</span>
        </Link>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
            aria-label="Закрыть меню"
          >
            <XIcon />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        {navItems.map(({ label, path, Icon }) => {
          const active =
            path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(path);
          return (
            <Link
              key={path}
              to={path}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                active
                  ? 'bg-orange-50 text-orange-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span className={active ? 'text-orange-500' : 'text-gray-400'}>
                <Icon />
              </span>
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="mt-auto border-t border-gray-100">
        {isAuthenticated ? (
          <>
            <div className="px-3 py-3">
              <Link
                to="/preferences"
                onClick={onClose}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
              >
                <span className="text-gray-400">
                  <SlidersIcon />
                </span>
                Настройки
              </Link>
            </div>

            <div className="px-4 py-3 border-t border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-orange-600">
                    {user?.username.slice(0, 2).toUpperCase() ?? 'U'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-900 truncate">{user?.username}</p>
                  <p className="text-xs text-gray-400 truncate">Мой аккаунт</p>
                </div>
                <button
                  onClick={clearAuth}
                  title="Выйти"
                  className="shrink-0 text-gray-300 hover:text-gray-500 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h4a3 3 0 0 1 3 3v1" />
                  </svg>
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="px-4 py-4 space-y-2">
            <button
              onClick={() => { navigate('/login'); onClose?.(); }}
              className="w-full py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Войти
            </button>
            <button
              onClick={() => { navigate('/register'); onClose?.(); }}
              className="w-full py-2 rounded-xl bg-orange-500 text-sm font-semibold text-white hover:bg-orange-600 transition-colors"
            >
              Зарегистрироваться
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
