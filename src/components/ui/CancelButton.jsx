import React from 'react';
import { Button } from 'react-bootstrap';

// Cancelar / Cerrar en pies de modales: botón secundario con borde (como
// "Exportar Excel" o "Ver detalle"), a la izquierda de la acción principal
// (que va como Button primary o danger).
export default function CancelButton({ children = 'Cancelar', ...props }) {
    return (
        <Button variant="outline-secondary" size="sm" {...props}>
            {children}
        </Button>
    );
}
