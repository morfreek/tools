import api from '@/api';

// Sesión de la cuenta actual (cookie httpOnly gestionada por la API)
export const getCurrentAccount = () => api.get('/auth/me').then((r) => r.data);

export const login = (username, password) =>
    api.post('/auth/login', { username, password }).then((r) => r.data);

export const logout = () => api.post('/auth/logout').then((r) => r.data);

export const changePassword = (currentPassword, newPassword) =>
    api.put('/auth/password', { current_password: currentPassword, new_password: newPassword }).then((r) => r.data);
