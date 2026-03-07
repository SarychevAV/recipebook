import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getRecipes,
  getRecipeById,
  createRecipe,
  updateRecipe,
  deleteRecipe,
  uploadRecipePhoto,
  getMyRecipes,
  submitRecipeForReview,
  getPendingRecipes,
  approveRecipe,
  rejectRecipe,
} from '../api/recipes';
import { getTags } from '../api/tags';
import type {
  RecipeQueryParams,
  CreateRecipeRequest,
  UpdateRecipeRequest,
} from '../types/recipe';

export function useRecipes(params?: RecipeQueryParams) {
  return useQuery({
    queryKey: ['recipes', params],
    queryFn: () => getRecipes(params),
    staleTime: 1000 * 60 * 5,
  });
}

export function useRecipe(id: string) {
  return useQuery({
    queryKey: ['recipe', id],
    queryFn: () => getRecipeById(id),
    staleTime: 1000 * 60 * 5,
    enabled: !!id,
  });
}

export function useTags() {
  return useQuery({
    queryKey: ['tags'],
    queryFn: getTags,
    staleTime: 1000 * 60 * 10,
  });
}

export function useCreateRecipe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateRecipeRequest) => createRecipe(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recipes'] }),
  });
}

export function useUpdateRecipe(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateRecipeRequest) => updateRecipe(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['recipes'] });
      qc.invalidateQueries({ queryKey: ['recipe', id] });
    },
  });
}

export function useDeleteRecipe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteRecipe(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recipes'] }),
  });
}

export function useUploadRecipePhoto(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => uploadRecipePhoto(id, file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['recipes'] });
      qc.invalidateQueries({ queryKey: ['recipe', id] });
    },
  });
}

export function useMyRecipes(params?: RecipeQueryParams) {
  return useQuery({
    queryKey: ['my-recipes', params],
    queryFn: () => getMyRecipes(params),
    staleTime: 1000 * 60 * 2,
  });
}

export function useSubmitForReview(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => submitRecipeForReview(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-recipes'] });
      qc.invalidateQueries({ queryKey: ['recipe', id] });
    },
  });
}

export function usePendingRecipes(params?: RecipeQueryParams) {
  return useQuery({
    queryKey: ['admin-recipes', params],
    queryFn: () => getPendingRecipes(params),
    staleTime: 1000 * 30,
  });
}

export function useApproveRecipe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => approveRecipe(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-recipes'] });
      qc.invalidateQueries({ queryKey: ['recipes'] });
    },
  });
}

export function useRejectRecipe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => rejectRecipe(id, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-recipes'] });
    },
  });
}
