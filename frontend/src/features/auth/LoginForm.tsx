import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { loginSchema, type LoginFormData } from '../../lib/schemas';
import { useLogin } from '../../hooks/useAuth';
import { getErrorMessage } from '../../lib/utils';
import { FormField } from './FormField';

export function LoginForm() {
  const { mutate: login, isPending, error } = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) });

  const onSubmit = (data: LoginFormData) => login(data);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <FormField label="Email" error={errors.email?.message}>
        <input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          {...register('email')}
          className="auth-input"
        />
      </FormField>

      <FormField label="Пароль" error={errors.password?.message}>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          {...register('password')}
          className="auth-input"
        />
      </FormField>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
          {getErrorMessage(error)}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="auth-btn-primary"
      >
        {isPending ? (
          <span className="flex items-center justify-center gap-2">
            <Spinner /> Входим…
          </span>
        ) : (
          'Войти'
        )}
      </button>

      <p className="text-center text-sm text-gray-500">
        Нет аккаунта?{' '}
        <Link to="/register" className="font-semibold text-orange-500 hover:text-orange-600 transition-colors">
          Создайте его
        </Link>
      </p>
    </form>
  );
}

function Spinner() {
  return (
    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
