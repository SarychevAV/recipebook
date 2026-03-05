import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { registerSchema, type RegisterFormData } from '../../lib/schemas';
import { useRegister } from '../../hooks/useAuth';
import { getErrorMessage } from '../../lib/utils';
import { FormField } from './FormField';

export function RegisterForm() {
  const { mutate: registerUser, isPending, error } = useRegister();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({ resolver: zodResolver(registerSchema) });

  const onSubmit = (data: RegisterFormData) => registerUser(data);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <FormField label="Имя пользователя" error={errors.username?.message}>
        <input
          id="username"
          type="text"
          autoComplete="username"
          placeholder="chef_john"
          {...register('username')}
          className="auth-input"
        />
      </FormField>

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
          autoComplete="new-password"
          placeholder="Мин. 8 символов"
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
            <Spinner /> Создаём…
          </span>
        ) : (
          'Создать аккаунт'
        )}
      </button>

      <p className="text-center text-sm text-gray-500">
        Уже есть аккаунт?{' '}
        <Link to="/login" className="font-semibold text-orange-500 hover:text-orange-600 transition-colors">
          Войти
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
