import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must be at most 50 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;

const ingredientSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  amount: z.string().max(50).default(''),
  unit: z.string().max(50).default(''),
  orderIndex: z.number().int().min(0),
});

export const recipeSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(255, 'Title must be at most 255 characters'),
  description: z.string().max(2000, 'Description must be at most 2000 characters').default(''),
  instructions: z.string().min(1, 'Instructions are required'),
  cookingTimeMinutes: z
    .number({ invalid_type_error: 'Must be a number' })
    .int()
    .min(1, 'Cooking time must be at least 1 minute'),
  servings: z
    .number({ invalid_type_error: 'Must be a number' })
    .int()
    .min(1, 'Servings must be at least 1'),
  ingredients: z
    .array(ingredientSchema)
    .min(1, 'At least one ingredient is required'),
  tagIds: z.array(z.string()).default([]),
});

export type RecipeFormData = z.infer<typeof recipeSchema>;