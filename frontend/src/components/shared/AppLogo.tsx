interface AppLogoProps {
  variant: 'light' | 'dark';
}

export function AppLogo({ variant }: AppLogoProps) {
  const isLight = variant === 'light';

  return (
    <div className="flex items-center gap-3">
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm shrink-0 ${
          isLight ? 'bg-white' : 'bg-orange-500'
        }`}
      >
        {/* Мандарин */}
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          className={isLight ? 'text-orange-500' : 'text-white'}
        >
          <circle cx="10" cy="12.5" r="6" stroke="currentColor" strokeWidth="1.5" />
          <path d="M10 6.5V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M10 5C10.5 3.5 12.5 2 14.5 2.5C13 3.5 11.5 4.5 10 5Z" fill="currentColor" />
        </svg>
      </div>
      <span
        className={`font-bold text-xl tracking-tight ${
          isLight ? 'text-white' : 'text-gray-900'
        }`}
      >
        Мандаринка
      </span>
    </div>
  );
}
