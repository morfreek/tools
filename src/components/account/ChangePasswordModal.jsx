import React, { useEffect, useState } from 'react';
import { Button, Form, Modal } from 'react-bootstrap';
import CancelButton from '@c/ui/CancelButton';
import { useSession } from '@c/SessionContext';
import { useToast } from '@c/ToastContext';
import { apiErrorMessage } from '@u/apiError';
import PasswordFields, { validatePasswordChange } from './PasswordFields';

const EMPTY = { current: '', next: '', confirm: '' };

export default function ChangePasswordModal({ show, onClose }) {
    const { changePassword } = useSession();
    const { showToast } = useToast();
    const [values, setValues] = useState(EMPTY);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (show) { setValues(EMPTY); setError(''); }
    }, [show]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const invalid = validatePasswordChange(values);
        if (invalid) return setError(invalid);

        setSaving(true);
        try {
            await changePassword(values.current, values.next);
            showToast('success', 'Contraseña actualizada. Las demás sesiones se cerraron.');
            onClose();
        } catch (err) {
            setError(apiErrorMessage(err, 'No se pudo cambiar la contraseña'));
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal show={show} onHide={onClose} centered>
            <Form onSubmit={handleSubmit} noValidate>
                <Modal.Header closeButton>
                    <Modal.Title>Cambiar contraseña</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <PasswordFields values={values} onChange={setValues} idPrefix="modal-clave" />
                    {error && <div className="aviso aviso-rojo mb-0" role="alert">{error}</div>}
                </Modal.Body>
                <Modal.Footer>
                    <CancelButton onClick={onClose} disabled={saving} />
                    <Button type="submit" size="sm" disabled={saving}>
                        {saving ? 'Guardando…' : 'Cambiar contraseña'}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
}
