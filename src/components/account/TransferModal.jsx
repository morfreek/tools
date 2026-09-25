import React, { useEffect, useState } from 'react';
import { Button, Form, Modal } from 'react-bootstrap';
import CancelButton from '@c/ui/CancelButton';
import { apiErrorMessage } from '@u/apiError';

// Elegir la cuenta de destino de una transferencia (un proyecto o todos los de una cuenta).
// accounts: cuentas activas elegibles. onConfirm(accountId) hace la llamada y puede rechazar.
export default function TransferModal({ show, onClose, title, description, accounts, acceptText, onConfirm }) {
    const [target, setTarget] = useState('');
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (show) { setTarget(''); setError(''); }
    }, [show]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await onConfirm(Number(target));
            onClose();
        } catch (err) {
            setError(apiErrorMessage(err, 'No se pudo completar la transferencia'));
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal show={show} onHide={onClose} centered>
            <Form onSubmit={handleSubmit}>
                <Modal.Header closeButton>
                    <Modal.Title>{title}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p className="sub">{description}</p>
                    {accounts.length === 0 ? (
                        <div className="vacio">No hay otras cuentas activas a las que transferir.</div>
                    ) : (
                        <Form.Group controlId="transferir-destino">
                            <Form.Label>Cuenta de destino</Form.Label>
                            <Form.Select value={target} onChange={(e) => setTarget(e.target.value)} required>
                                <option value="">Seleccione una cuenta</option>
                                {accounts.map((a) => <option key={a.id} value={a.id}>{a.name} ({a.username})</option>)}
                            </Form.Select>
                        </Form.Group>
                    )}
                    {error && <div className="aviso aviso-rojo mt-3 mb-0" role="alert">{error}</div>}
                </Modal.Body>
                <Modal.Footer>
                    <CancelButton onClick={onClose} disabled={saving} />
                    <Button type="submit" size="sm" disabled={saving || !target}>
                        {saving ? 'Transfiriendo…' : acceptText}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
}
