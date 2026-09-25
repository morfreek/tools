import api from '@/api';

export const listUsers = () => api.get('/users').then((r) => r.data);

export const saveUser = (user) => (user.id
    ? api.put(`/users/${user.id}`, { name: user.name })
    : api.post('/users', { name: user.name })
).then((r) => r.data);
