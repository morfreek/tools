import React from 'react';

export default function StatusBadge({ status }) {
    const getClass = () => {
        switch (status) {
            case 'bien':
                return 'bg-success';
            case 'regular':
                return 'bg-warning text-dark';
            case 'deficiente':
                return 'bg-danger';
            default:
                return 'bg-secondary';
        }
    };

    return (
        <span className={`badge ${getClass()}`}>
            {status || 'Sin estado'}
        </span>
    );
}
