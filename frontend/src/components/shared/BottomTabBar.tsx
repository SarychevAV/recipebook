import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/authStore';

function HomeIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function BookIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

interface TabItemProps {
  label: string;
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
}

function TabItem({ label, active, onClick, icon }: TabItemProps) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-0.5 flex-1 py-1.5 transition-colors ${
        active ? 'text-orange-500' : 'text-gray-400'
      }`}
    >
      {icon}
      <span className="text-[10px] font-medium leading-none">{label}</span>
    </button>
  );
}

export function BottomTabBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  function goProtected(path: string) {
    navigate(isAuthenticated ? path : '/login');
  }

  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 bg-white border-t border-gray-100 md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-center justify-around px-1 h-16">
        {/* Лента */}
        <TabItem
          label="Лента"
          active={isActive('/')}
          onClick={() => navigate('/')}
          icon={<HomeIcon />}
        />

        {/* Поиск */}
        <TabItem
          label="Поиск"
          active={false}
          onClick={() => navigate('/')}
          icon={<SearchIcon />}
        />

        {/* Создать — FAB */}
        <div className="flex-1 flex flex-col items-center relative">
          <button
            onClick={() => goProtected('/recipes/new')}
            aria-label="Создать рецепт"
            className="absolute -top-7 flex items-center justify-center w-14 h-14 rounded-2xl bg-orange-500 text-white shadow-xl shadow-orange-500/35 active:scale-95 transition-transform"
          >
            <PlusIcon />
          </button>
          <span className="text-[10px] font-medium text-gray-400 mt-auto mb-1.5">Создать</span>
        </div>

        {/* Мои рецепты */}
        <TabItem
          label="Мои"
          active={isActive('/my-recipes')}
          onClick={() => goProtected('/my-recipes')}
          icon={<BookIcon />}
        />

        {/* Профиль */}
        <TabItem
          label="Профиль"
          active={isActive('/profile')}
          onClick={() => goProtected('/profile')}
          icon={<UserIcon />}
        />
      </div>
    </nav>
  );
}
