import api from '@/api';

// Configuraciones de despliegue continuo guardadas por nombre en cada proyecto
export const listConfigs = (projectId) => api.get(`/projects/${projectId}/configs`).then((r) => r.data);

export const saveConfig = (projectId, name, config) =>
    api.post(`/projects/${projectId}/configs`, { name, config }).then((r) => r.data);

export const deleteConfig = (projectId, name) =>
    api.delete(`/projects/${projectId}/configs`, { data: { name } }).then((r) => r.data);
