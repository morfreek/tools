import React from 'react';
import { Button, Form, InputGroup } from 'react-bootstrap';
import { generateTemporaryPassword } from '@u/password';
import { MIN_PASSWORD_LENGTH } from './PasswordFields';

// Contraseña temporal visible para copiarla y entregarla; la cuenta la cambia al ingresar
export default function TemporaryPasswordField({ value, onChange, id = 'clave-temporal' }) {
    return (
        <Form.Group className="mb-3" controlId={id}>
            <Form.Label>Contraseña temporal</Form.Label>
            <InputGroup>
                <Form.Control
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    autoComplete="off"
                    spellCheck="false"
                    className="font-monospace"
                    minLength={MIN_PASSWORD_LENGTH}
                    required
                />
                <Button variant="outline-secondary" onClick={() => onChange(generateTemporaryPassword())}>
                    Generar
                </Button>
            </InputGroup>
            <Form.Text className="sub">
                Al menos {MIN_PASSWORD_LENGTH} caracteres. Entréguela por un canal seguro: se pedirá cambiarla en el primer ingreso.
            </Form.Text>
        </Form.Group>
    );
}
