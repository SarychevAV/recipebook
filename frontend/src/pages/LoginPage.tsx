import { LoginForm } from '../features/auth/LoginForm';
import { AppLogo } from '../components/shared/AppLogo';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex bg-orange-50">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-[460px] xl:w-[520px] shrink-0 bg-gradient-to-br from-orange-500 to-orange-600 flex-col justify-between p-12 relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-white/10" />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-black/10" />
        <div className="absolute top-1/2 -translate-y-1/2 right-0 w-40 h-40 rounded-full bg-white/5" />

        {/* Logo */}
        <div className="relative">
          <AppLogo variant="light" />
        </div>

        {/* Hero text */}
        <div className="relative space-y-8">
          <div>
            <h2 className="text-white text-[2.6rem] font-bold leading-tight">
              Твоя личная<br />коллекция рецептов
            </h2>
            <p className="mt-4 text-orange-100 text-base leading-relaxed">
              Открывай, создавай и делись рецептами с друзьями и всем миром.
            </p>
          </div>

          <ul className="space-y-3">
            {([
              ['🍳', 'Создавай и организуй свои рецепты'],
              ['🔍', 'Открывай тысячи публичных блюд'],
              ['📸', 'Добавляй фото к каждому шагу'],
            ] as const).map(([icon, text]) => (
              <li key={text} className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center text-base shrink-0">
                  {icon}
                </span>
                <span className="text-white/90 text-sm font-medium">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-orange-200/70 text-xs">© 2026 Мандаринка</p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-[400px]">
          {/* Mobile-only logo */}
          <div className="mb-10 lg:hidden">
            <AppLogo variant="dark" />
          </div>

          <h1 className="text-[1.75rem] font-bold text-gray-900 leading-tight">С возвращением</h1>
          <p className="mt-1 text-gray-400 text-sm mb-8">Войдите в аккаунт, чтобы продолжить</p>

          <LoginForm />
        </div>
      </div>
    </div>
  );
}
