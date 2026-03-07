export interface TagResponse {
  id: string;
  name: string;
}

export interface IngredientResponse {
  id: string;
  name: string;
  amount: string;
  unit: string;
  orderIndex: number;
}

export interface RecipeSummaryDto {
  id: string;
  title: string;
  description: string;
  cookingTimeMinutes: number;
  servings: number;
  photoUrl?: string;
  ownerUsername: string;
  ownerId: string;
  tags: TagResponse[];
  createdAt: string;
}

export interface RecipeDto {
  id: string;
  title: string;
  description: string;
  instructions: string;
  cookingTimeMinutes: number;
  servings: number;
  photoUrl?: string;
  ownerUsername: string;
  ownerId: string;
  tags: TagResponse[];
  ingredients: IngredientResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface PagedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface RecipeQueryParams {
  q?: string;
  tagId?: string;
  minTime?: number;
  maxTime?: number;
  page?: number;
  size?: number;
}

export interface IngredientRequest {
  name: string;
  amount: string;
  unit: string;
  orderIndex: number;
}

export interface CreateRecipeRequest {
  title: string;
  description: string;
  instructions: string;
  cookingTimeMinutes: number;
  servings: number;
  ingredients: IngredientRequest[];
  tagIds: string[];
}

export type UpdateRecipeRequest = CreateRecipeRequest;
