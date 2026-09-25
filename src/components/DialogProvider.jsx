import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import CancelButton from '@c/ui/CancelButton';

const DialogContext = createContext(null);

// Reemplaza alert/confirm/prompt nativos por modales con el tema del sistema.
// kind: 'alert' | 'confirm' | 'prompt'. El mensaje se renderiza como texto (JSX escapa).
export const DialogProvider = ({ children }) => {
    const [dialog, setDialog] = useState(null);
    const [value, setValue] = useState('');
    const resolver = useRef(null);

    const open = useCallback((kind, options) => new Promise((resolve) => {
        resolver.current = resolve;
        setValue(options.value || '');
        setDialog({ kind, ...options });
    }), []);

    const close = (result) => {
        setDialog(null);
        resolver.current?.(result);
    };

    const cancel = () => close(dialog?.kind === 'prompt' ? null : dialog?.kind === 'confirm' ? false : undefined);
    const accept = (e) => {
        e?.preventDefault();
        close(dialog.kind === 'prompt' ? value : dialog.kind === 'confirm' ? true : undefined);
    };

    const api = useRef({
        alert: (o) => open('alert', o),
        confirm: (o) => open('confirm', o),
        prompt: (o) => open('prompt', o),
    }).current;

    return (
        <DialogContext.Provider value={api}>
            {children}
            <Modal show={!!dialog} onHide={cancel} centered>
                {dialog && (
                    <Form onSubmit={accept}>
                        <Modal.Header closeButton>
                            <Modal.Title>{dialog.title || 'Confirmar'}</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            {dialog.message && <p className="mb-0" style={{ whiteSpace: 'pre-line' }}>{dialog.message}</p>}
                            {dialog.kind === 'prompt' && (
                                <Form.Group className="mt-3">
                                    {dialog.label && <Form.Label>{dialog.label}</Form.Label>}
                                    <Form.Control autoFocus value={value} onChange={(e) => setValue(e.target.value)} required />
                                </Form.Group>
                            )}
                        </Modal.Body>
                        <Modal.Footer>
                            {dialog.kind !== 'alert' && (
                                <CancelButton onClick={cancel} autoFocus={dialog.danger}>
                                    {dialog.cancelText || 'Cancelar'}
                                </CancelButton>
                            )}
                            <Button type="submit" size="sm" variant={dialog.danger ? 'danger' : 'primary'} autoFocus={!dialog.danger && dialog.kind !== 'prompt'}>
                                {dialog.acceptText || (dialog.kind === 'alert' ? 'Entendido' : 'Aceptar')}
                            </Button>
                        </Modal.Footer>
                    </Form>
                )}
            </Modal>
        </DialogContext.Provider>
    );
};

export const useDialog = () => useContext(DialogContext);
