import React, { useEffect, useState } from 'react';
import { Button, Form, Modal } from 'react-bootstrap';
import CancelButton from '@c/ui/CancelButton';
import { useToast } from '@c/ToastContext';
import { apiErrorMessage } from '@u/apiError';
import { generateTemporaryPassword } from '@u/password';
import { resetAccountPassword } from '@/services/accounts.service';
import TemporaryPasswordField from './TemporaryPasswordField';

export default function ResetPasswordModal({ show, onClose, onSaved, account }) {
    const { showToast } = useToast();
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (show) { setPassword(generateTemporaryPassword()); setError(''); }
    }, [show]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await resetAccountPassword(account.id, password);
            showToast('success', `Contraseña de "${account.username}" restablecida`);
            onSaved();
            onClose();
        } catch (err) {
            setError(apiErrorMessage(err, 'No se pudo restablecer la contraseña'));
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal show={show} onHide={onClose} centered>
            <Form onSubmit={handleSubmit}>
                <Modal.Header closeButton>
                    <Modal.Title>Restablecer contraseña</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p className="sub">
                        {account?.name} ({account?.username}) deberá ingresar con esta contraseña temporal y cambiarla. Sus sesiones abiertas se cierran.
                    </p>
                    <TemporaryPasswordField value={password} onChange={setPassword} id="clave-restablecida" />
                    {error && <div className="aviso aviso-rojo mb-0" role="alert">{error}</div>}
                </Modal.Body>
                <Modal.Footer>
                    <CancelButton onClick={onClose} disabled={saving} />
                    <Button type="submit" size="sm" disabled={saving}>
                        {saving ? 'Guardando…' : 'Restablecer contraseña'}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
}
