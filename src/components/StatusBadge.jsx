import React from 'react';
import { Badge } from 'react-bootstrap';
import { getStatus } from '@u/Constants';

export default function StatusBadge({ status, text }) {
    const { label, variant } = getStatus(status);
    const shouldShowText = text !== null && text !== undefined && text !== '';

    return (
        <Badge bg={variant} className="me-2">
            {status ? label : 'Sin estado'}
            {shouldShowText && <span>{text}</span>}
        </Badge>
    );
}
