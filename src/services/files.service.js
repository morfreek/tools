import api from '@/api';

export const listFiles = (projectId) => api.get(`/projects/${projectId}/files`).then((r) => r.data);

export const uploadFiles = (projectId, files, onUploadProgress) => {
    const formData = new FormData();
    files.forEach((file) => formData.append('files[]', file));
    return api.post(`/projects/${projectId}/files`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress,
    }).then((r) => r.data);
};

export const downloadFile = (projectId, fileId) =>
    api.get(`/projects/${projectId}/files/${fileId}/download`, { responseType: 'blob' }).then((r) => r.data);

export const deleteFile = (projectId, fileId) =>
    api.delete(`/projects/${projectId}/files/${fileId}`).then((r) => r.data);

// URL directa para <img src>: no pasa por axios
export const filePreviewUrl = (projectId, fileId) =>
    `${api.defaults.baseURL}/projects/${projectId}/files/${fileId}/preview`;
