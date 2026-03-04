import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { loginApi, registerApi, type LoginPayload, type RegisterPayload } from '../api/auth';
import { useAuth } from '../store/authStore';

export function useLogin() {
  const { setAuth } = useAuth();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (payload: LoginPayload) => loginApi(payload),
    onSuccess: (response) => {
      setAuth(response.data.token, response.data.user);
      navigate('/');
    },
  });
}

export function useRegister() {
  const { setAuth } = useAuth();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (payload: RegisterPayload) => registerApi(payload),
    onSuccess: (response) => {
      setAuth(response.data.token, response.data.user);
      navigate('/');
    },
  });
}