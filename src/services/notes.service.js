import api from '@/api';

export const listNotes = (projectId) => api.get(`/projects/${projectId}/notes`).then((r) => r.data);

export const createNote = (projectId, detail) =>
    api.post(`/projects/${projectId}/notes`, { detail }).then((r) => r.data);

export const updateNote = (projectId, noteId, detail) =>
    api.put(`/projects/${projectId}/notes`, { noteId, detail }).then((r) => r.data);

export const deleteNote = (projectId, noteId) =>
    api.delete(`/projects/${projectId}/notes`, { data: { noteId } }).then((r) => r.data);
