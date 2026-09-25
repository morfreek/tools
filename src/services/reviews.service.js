import api from '@/api';

export const getChecklist = () => api.get('/checklist').then((r) => r.data);

export const listReviews = (projectId) => api.get(`/projects/${projectId}/reviews`).then((r) => r.data);

export const createReview = (projectId, review) =>
    api.post(`/projects/${projectId}/reviews`, review).then((r) => r.data);

export const deleteReview = (projectId, reviewId) =>
    api.delete(`/projects/${projectId}/reviews`, { data: { reviewId } }).then((r) => r.data);
