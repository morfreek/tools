import React from 'react';
import { Button } from 'react-bootstrap';

// Cancelar / Cerrar en pies de modales: enlace como "Salir" de la cabecera,
// a la izquierda de la acción principal (que va como Button primary o danger).
export default function CancelButton({ children = 'Cancelar', ...props }) {
    return (
        <Button variant="link" size="sm" {...props}>
            {children}
        </Button>
    );
}
