import React, { useEffect } from 'react';

// Tipos de ToastContext → clase de aviso del sistema visual
const AVISO = {
    success: 'aviso-ok',
    error: 'aviso-rojo',
    danger: 'aviso-rojo',
    warning: 'aviso-ambar',
    info: 'aviso-info',
};

export default function Toast({ show, type = 'success', message = '', onClose, duration = 3000 }) {
    useEffect(() => {
        if (!show) return;
        const timer = setTimeout(() => onClose?.(), duration);
        return () => clearTimeout(timer);
    }, [show, duration, onClose]);

    if (!show) return null;

    return (
        <div className={`aviso toast-aviso ${AVISO[type] || 'aviso-info'}`} role={type === 'error' ? 'alert' : 'status'}>
            <span>{message}</span>
            <button type="button" className="btn-close" aria-label="Cerrar" onClick={onClose} />
        </div>
    );
}
