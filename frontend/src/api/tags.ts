import api from './axios';
import type { ApiResponse } from '../types/auth';
import type { TagResponse } from '../types/recipe';

export const getTags = (): Promise<ApiResponse<TagResponse[]>> =>
  api.get('/tags').then(r => r.data);
