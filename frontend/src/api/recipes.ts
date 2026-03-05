import api from './axios';
import type { ApiResponse } from '../types/auth';
import type {
  RecipeDto,
  RecipeSummaryDto,
  PagedResponse,
  RecipeQueryParams,
  CreateRecipeRequest,
  UpdateRecipeRequest,
} from '../types/recipe';

export const getRecipes = (
  params?: RecipeQueryParams,
): Promise<ApiResponse<PagedResponse<RecipeSummaryDto>>> =>
  api.get('/recipes', { params }).then(r => r.data);

export const getRecipeById = (id: string): Promise<ApiResponse<RecipeDto>> =>
  api.get(`/recipes/${id}`).then(r => r.data);

export const createRecipe = (
  data: CreateRecipeRequest,
): Promise<ApiResponse<RecipeDto>> =>
  api.post('/recipes', data).then(r => r.data);

export const updateRecipe = (
  id: string,
  data: UpdateRecipeRequest,
): Promise<ApiResponse<RecipeDto>> =>
  api.put(`/recipes/${id}`, data).then(r => r.data);

export const deleteRecipe = (id: string): Promise<void> =>
  api.delete(`/recipes/${id}`).then(r => r.data);

export const uploadRecipePhoto = (id: string, file: File): Promise<ApiResponse<RecipeDto>> => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post(`/recipes/${id}/photos`, formData).then(r => r.data);
};
