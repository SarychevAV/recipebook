import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Некорректный email'),
  password: z.string().min(1, 'Введите пароль'),
});

export const registerSchema = z.object({
  username: z
    .string()
    .min(3, 'Минимум 3 символа')
    .max(50, 'Максимум 50 символов'),
  email: z.string().email('Некорректный email'),
  password: z.string().min(8, 'Минимум 8 символов'),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;

const ingredientSchema = z.object({
  name: z.string().min(1, 'Укажите название').max(100),
  amount: z.string().max(50).default(''),
  unit: z.string().max(50).default(''),
  orderIndex: z.number().int().min(0),
});

export const recipeSchema = z.object({
  title: z
    .string()
    .min(1, 'Укажите название рецепта')
    .max(255, 'Максимум 255 символов'),
  description: z.string().max(2000, 'Максимум 2000 символов').default(''),
  instructions: z.string().min(1, 'Добавьте инструкции'),
  cookingTimeMinutes: z
    .number({ invalid_type_error: 'Введите число' })
    .int()
    .min(1, 'Минимум 1 минута'),
  servings: z
    .number({ invalid_type_error: 'Введите число' })
    .int()
    .min(1, 'Минимум 1 порция'),
  ingredients: z
    .array(ingredientSchema)
    .min(1, 'Добавьте хотя бы один ингредиент'),
  tagIds: z.array(z.string()).default([]),
});

export type RecipeFormData = z.infer<typeof recipeSchema>;