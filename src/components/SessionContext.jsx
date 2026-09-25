import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { SESSION_EXPIRED_EVENT } from '@/api';
import * as authService from '@/services/auth.service';

// Sesión real: la API guarda la sesión y el navegador solo una cookie httpOnly.
// account = null sin sesión; loading mientras se consulta /auth/me al abrir la app.
const SessionContext = createContext(null);

export const SessionProvider = ({ children }) => {
    const [account, setAccount] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        authService.getCurrentAccount()
            .then(setAccount)
            .catch(() => setAccount(null))
            .finally(() => setLoading(false));

        const expire = () => setAccount(null);
        window.addEventListener(SESSION_EXPIRED_EVENT, expire);
        return () => window.removeEventListener(SESSION_EXPIRED_EVENT, expire);
    }, []);

    // Rechaza con el error de axios para que la pantalla muestre el motivo
    const login = useCallback(async (username, password) => {
        setAccount(await authService.login(username, password));
    }, []);

    const logout = useCallback(async () => {
        try { await authService.logout(); } catch { /* la sesión se descarta igual */ }
        setAccount(null);
    }, []);

    const changePassword = useCallback(async (current, next) => {
        setAccount(await authService.changePassword(current, next));
    }, []);

    const value = useMemo(() => ({
        account,
        loading,
        authenticated: Boolean(account) && !account.must_change_password,
        isAdmin: account?.role === 'admin',
        login,
        logout,
        changePassword,
    }), [account, loading, login, logout, changePassword]);

    return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
};

export const useSession = () => useContext(SessionContext);
