import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

// La sesión viaja en una cookie httpOnly. X-Requested-With es obligatoria en las
// escrituras (protección CSRF de la API).
const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'tools',
    },
});

// Un 401 fuera de /auth significa que la sesión venció o se cerró en otro lado:
// SessionContext escucha este evento y vuelve a pedir el ingreso.
export const SESSION_EXPIRED_EVENT = 'tools:sesion-expirada';

api.interceptors.response.use(undefined, (error) => {
    if (error.response?.status === 401 && !error.config?.url?.startsWith('/auth/')) {
        window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    }
    return Promise.reject(error);
});

export default api;
