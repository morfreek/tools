import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import Toast from './Toast';

const ToastContext = createContext(null);

const HIDDEN = { show: false, type: '', message: '' };

// type: 'success' | 'error' | 'warning' | 'info'. El Toast se cierra solo tras `duration`.
export const ToastProvider = ({ children }) => {
    const [toast, setToast] = useState(HIDDEN);

    const showToast = useCallback((type, message) => {
        setToast({ show: true, type, message, key: Date.now() });
    }, []);

    const hideToast = useCallback(() => setToast(HIDDEN), []);

    const value = useMemo(() => ({ showToast }), [showToast]);

    return (
        <ToastContext.Provider value={value}>
            {children}
            <Toast
                key={toast.key}
                show={toast.show}
                type={toast.type}
                message={toast.message}
                onClose={hideToast}
                duration={3000}
            />
        </ToastContext.Provider>
    );
};

export const useToast = () => useContext(ToastContext);
