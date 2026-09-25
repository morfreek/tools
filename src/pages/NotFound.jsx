import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFound() {
    return (
        <div className="pantalla-login">
            <div className="tarjeta-login text-center">
                <h1>Página no encontrada</h1>
                <p className="sub">La dirección que buscas no existe o cambió.</p>
                <Link to="/" className="boton-primario d-inline-block text-decoration-none">Volver al inicio</Link>
            </div>
        </div>
    );
}
