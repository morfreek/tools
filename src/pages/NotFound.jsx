import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            backgroundColor: '#f8f9fa',
            color: '#343a40',
            textAlign: 'center',
            padding: '20px'
        }}>
            <h1 style={{ fontSize: '6rem', marginBottom: '1rem' }}>404</h1>
            <p style={{ fontSize: '1.5rem', marginBottom: '2rem' }}>¡Ups! La página que buscas no existe.</p>
            <Link to="/" style={{
                textDecoration: 'none',
                color: '#fff',
                backgroundColor: '#007bff',
                padding: '10px 20px',
                borderRadius: '5px',
                fontSize: '1rem',
                fontWeight: 'bold'
            }}>
                Volver al inicio
            </Link>
        </div>
    );
};

export default NotFound;
