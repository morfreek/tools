import React, { createContext, useContext, useState } from 'react';
import Toast from './Toast';

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
    const [toast, setToast] = useState({ show: false, type: '', message: '' });

    const showToast = (type, message) => {
        setToast({ show: true, type, message });
        setTimeout(() => {
            setToast({ show: false, type: '', message: '' });
        }, 3000);
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <Toast
                show={toast.show}
                type={toast.type}
                message={toast.message}
                onClose={() => setToast({ show: false, type: '', message: '' })}
                position="top-right"
            />
        </ToastContext.Provider>
    );
};

export const useToast = () => useContext(ToastContext);
