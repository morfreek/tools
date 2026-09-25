import api from '@/api';

// status: 'active' (por defecto) | 'finished'
export const listProjects = (status = 'active') =>
    api.get('/projects', { params: { status } }).then((r) => r.data);

export const getProject = (id) => api.get(`/projects/${id}`).then((r) => r.data);

export const saveProject = ({ id, name, code, coordinator_id, developer_ids }) => {
    const payload = { name, code, coordinator_id, developer_ids };
    return (id ? api.put(`/projects/${id}`, payload) : api.post('/projects', payload)).then((r) => r.data);
};

export const terminateProject = (id) => api.patch(`/projects/${id}/terminate`).then((r) => r.data);
