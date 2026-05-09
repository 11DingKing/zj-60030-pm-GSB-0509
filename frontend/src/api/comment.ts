import http from '@/utils/http';
import { Comment } from '@/types';

export interface CreateCommentParams {
  content: string;
  taskId: string;
  mentionIds?: string[];
}

export const commentApi = {
  getByTask: (taskId: string): Promise<Comment[]> => {
    return http.get('/comments', { params: { taskId } });
  },

  create: (data: CreateCommentParams): Promise<Comment> => {
    return http.post('/comments', data);
  },

  delete: (id: string): Promise<void> => {
    return http.delete(`/comments/${id}`);
  },
};
