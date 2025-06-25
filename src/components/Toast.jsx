import React, { useEffect } from 'react';

const positionStyles = {
    'top-right':   { top: 24, right: 24, left: 'auto', bottom: 'auto' },
    'top-left':    { top: 24, left: 24, right: 'auto', bottom: 'auto' },
    'bottom-right':{ bottom: 24, right: 24, left: 'auto', top: 'auto' },
    'bottom-left': { bottom: 24, left: 24, right: 'auto', top: 'auto' },
};

const borderColors = {
    success: '#198754',
    error:   '#dc3545',
    danger:  '#dc3545',
    warning: '#ffc107',
    info:    '#0dcaf0',
    primary: '#0d6efd',
    secondary: '#6c757d',
    light:   '#f8f9fa',
    dark:    '#212529',
};

export default function Toast({
    show,
    type = 'success',
    message = '',
    onClose,
    position = 'top-right',
    duration = 2000
}) {
    useEffect(() => {
        if (!show) return;
        const timer = setTimeout(() => {
            if (onClose) onClose();
        }, duration);
        return () => clearTimeout(timer);
    }, [show, duration, onClose]);

    if (!show) return null;

    const typeClass = {
        success: 'alert-success',
        error:   'alert-danger',
        danger:  'alert-danger',
        warning: 'alert-warning',
        info:    'alert-info',
        primary: 'alert-primary',
        secondary: 'alert-secondary',
        light:   'alert-light',
        dark:    'alert-dark',
    }[type] || 'alert-primary';

    return (
        <div
            className={`alert ${typeClass} shadow`}
            style={{
                position: 'fixed',
                zIndex: 2000,
                minWidth: 220,
                maxWidth: 400,
                padding: '14px 8px 14px 16px',
                borderRadius: 0,
                borderLeft: `2px solid ${borderColors[type] || borderColors.primary}`,
                ...positionStyles[position] || positionStyles['top-right'],
                display: 'flex',
                alignItems: 'center'
            }}
            role="alert"
        >
            <span style={{ textAlign: 'left', marginRight: 8 }}>{message}</span>
            <button
                onClick={onClose}
                type="button"
                className="btn-close"
                aria-label="Cerrar"
                style={{
                    filter: 'none',
                    width: 10,
                    height: 10,
                    minWidth: 10,
                    minHeight: 10,
                    fontSize: 10,
                    padding: 2,
                    marginLeft: 'auto'
                }}
            />
        </div>
    );
}