import React, { useEffect, useState } from 'react';
import { Button, Form, Modal } from 'react-bootstrap';
import CancelButton from '@c/ui/CancelButton';
import { useToast } from '@c/ToastContext';
import { apiErrorMessage } from '@u/apiError';
import { generateTemporaryPassword } from '@u/password';
import { createAccount, updateAccount } from '@/services/accounts.service';
import TemporaryPasswordField from './TemporaryPasswordField';

// account: cuenta a editar, o null para crear. self: es la cuenta de la sesión
// (no puede quitarse el rol ni desactivarse, igual que valida la API).
export default function AccountModal({ show, onClose, onSaved, account, self = false }) {
    const { showToast } = useToast();
    const editing = Boolean(account);
    const [form, setForm] = useState({});
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!show) return;
        setError('');
        setForm(account
            ? { name: account.name, role: account.role, active: account.active }
            : { username: '', name: '', role: 'usuario', password: generateTemporaryPassword() });
    }, [show, account]);

    const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        try {
            if (editing) {
                await updateAccount({ id: account.id, ...form, name: form.name.trim() });
                showToast('success', `Cuenta "${account.username}" actualizada`);
            } else {
                await createAccount({ ...form, username: form.username.trim(), name: form.name.trim() });
                showToast('success', `Cuenta "${form.username.trim()}" creada`);
            }
            onSaved();
            onClose();
        } catch (err) {
            setError(apiErrorMessage(err, 'No se pudo guardar la cuenta'));
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal show={show} onHide={onClose} centered>
            <Form onSubmit={handleSubmit}>
                <Modal.Header closeButton>
                    <Modal.Title>{editing ? `Editar cuenta ${account.username}` : 'Nueva cuenta'}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {!editing && (
                        <Form.Group className="mb-3" controlId="cuenta-usuario">
                            <Form.Label>Usuario</Form.Label>
                            <Form.Control value={form.username ?? ''} onChange={set('username')} autoComplete="off" spellCheck="false" autoFocus required pattern="[A-Za-z0-9._\-]{3,32}" />
                            <Form.Text className="sub">Entre 3 y 32 caracteres: letras, números, punto, guion o guion bajo.</Form.Text>
                        </Form.Group>
                    )}
                    <Form.Group className="mb-3" controlId="cuenta-nombre">
                        <Form.Label>Nombre</Form.Label>
                        <Form.Control value={form.name ?? ''} onChange={set('name')} required autoFocus={editing} />
                    </Form.Group>
                    <Form.Group className="mb-3" controlId="cuenta-rol">
                        <Form.Label>Rol</Form.Label>
                        <Form.Select value={form.role ?? 'usuario'} onChange={set('role')} disabled={self}>
                            <option value="usuario">Usuario: gestiona sus proyectos</option>
                            <option value="admin">Administrador: además gestiona cuentas</option>
                        </Form.Select>
                    </Form.Group>
                    {editing ? (
                        <Form.Check
                            type="switch"
                            id="cuenta-activa"
                            label="Cuenta activa"
                            checked={Boolean(form.active)}
                            onChange={set('active')}
                            disabled={self}
                        />
                    ) : (
                        <TemporaryPasswordField value={form.password ?? ''} onChange={(password) => setForm((prev) => ({ ...prev, password }))} />
                    )}
                    {self && <p className="sub mt-2 mb-0">No puede cambiar el rol ni desactivar su propia cuenta.</p>}
                    {editing && !form.active && account.active && (
                        <div className="aviso aviso-ambar mt-3 mb-0">Al desactivarla se cierran sus sesiones. Sus proyectos siguen a su nombre hasta que los transfiera.</div>
                    )}
                    {error && <div className="aviso aviso-rojo mt-3 mb-0" role="alert">{error}</div>}
                </Modal.Body>
                <Modal.Footer>
                    <CancelButton onClick={onClose} disabled={saving} />
                    <Button type="submit" size="sm" disabled={saving}>
                        {saving ? 'Guardando…' : editing ? 'Guardar cuenta' : 'Crear cuenta'}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
}
