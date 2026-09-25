import React from 'react';
import { Form } from 'react-bootstrap';

export const MIN_PASSWORD_LENGTH = 8;

// Valida el formulario de cambio de contraseña; devuelve el mensaje o '' si está bien
export const validatePasswordChange = ({ current, next, confirm }) => {
    if (!current) return 'Ingrese su contraseña actual';
    if (next.length < MIN_PASSWORD_LENGTH) return `La nueva contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`;
    if (next === current) return 'La nueva contraseña debe ser distinta de la actual';
    if (next !== confirm) return 'La confirmación no coincide con la nueva contraseña';
    return '';
};

// Campos de cambio de contraseña, compartidos por el ingreso obligatorio y el modal
export default function PasswordFields({ values, onChange, idPrefix = 'clave', currentLabel = 'Contraseña actual' }) {
    const field = (name, label, autoComplete, extra = {}) => (
        <Form.Group className="mb-3" controlId={`${idPrefix}-${name}`}>
            <Form.Label>{label}</Form.Label>
            <Form.Control
                type="password"
                value={values[name]}
                onChange={(e) => onChange({ ...values, [name]: e.target.value })}
                autoComplete={autoComplete}
                required
                {...extra}
            />
        </Form.Group>
    );

    return (
        <>
            {field('current', currentLabel, 'current-password', { autoFocus: true })}
            {field('next', 'Nueva contraseña', 'new-password', { minLength: MIN_PASSWORD_LENGTH })}
            <Form.Text className="d-block mt-n2 mb-3 sub">Al menos {MIN_PASSWORD_LENGTH} caracteres.</Form.Text>
            {field('confirm', 'Repetir nueva contraseña', 'new-password')}
        </>
    );
}
