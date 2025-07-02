import React from 'react';
import { Badge } from 'react-bootstrap';

export default function StatusBadge({ status, text }) {
    const getVariant = () => {
        switch (status) {
            case 'bien':
                return 'success';
            case 'regular':
                return 'warning';
            case 'deficiente':
                return 'danger';
            default:
                return 'secondary';
        }
    };

    const shouldShowText = text !== null && text !== undefined && text !== '';

    return (
        <Badge bg={getVariant()} text={status === 'regular' ? 'dark' : undefined} className='me-2'>
            {status.toUpperCase() || 'Sin estado'}
            {shouldShowText && (
                <span>
                    {text}
                </span>
            )}
        </Badge>
    );
}
