import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

// Acceso solo visual (sin validación en la API): credenciales fijas del frontend.
// Deuda conocida; ver CONTEXTO_PROYECTO.md.
const USER = 'admin';
const PASS = '1234';
const SESSION_KEY = 'authenticated';

const readSession = () => {
    try {
        return sessionStorage.getItem(SESSION_KEY) === 'true';
    } catch {
        return false;
    }
};

const SessionContext = createContext(null);

export const SessionProvider = ({ children }) => {
    const [authenticated, setAuthenticated] = useState(readSession);

    const login = useCallback((user, pass) => {
        if (user !== USER || pass !== PASS) return false;
        try { sessionStorage.setItem(SESSION_KEY, 'true'); } catch { /* sin almacenamiento */ }
        setAuthenticated(true);
        return true;
    }, []);

    const logout = useCallback(() => {
        try { sessionStorage.removeItem(SESSION_KEY); } catch { /* sin almacenamiento */ }
        setAuthenticated(false);
    }, []);

    const value = useMemo(() => ({ authenticated, login, logout }), [authenticated, login, logout]);

    return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
};

export const useSession = () => useContext(SessionContext);
