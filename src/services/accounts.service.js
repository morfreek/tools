import api from '@/api';

// Gestión de cuentas (solo administradores), salvo listAccountOptions
export const listAccounts = () => api.get('/accounts').then((r) => r.data);

// Cuentas activas, para elegir a quién transferir un proyecto
export const listAccountOptions = () => api.get('/accounts/options').then((r) => r.data);

export const createAccount = ({ username, name, password, role }) =>
    api.post('/accounts', { username, name, password, role }).then((r) => r.data);

export const updateAccount = ({ id, name, role, active }) =>
    api.put(`/accounts/${id}`, { name, role, active }).then((r) => r.data);

export const resetAccountPassword = (id, password) =>
    api.put(`/accounts/${id}/password`, { password }).then((r) => r.data);

export const transferAccountProjects = (id, accountId) =>
    api.post(`/accounts/${id}/transfer`, { account_id: accountId }).then((r) => r.data);
