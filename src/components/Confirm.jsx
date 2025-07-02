import React from 'react';
import { Modal, Button } from 'react-bootstrap';

export default function Confirm({ 
    show, 
    onClose, 
    onConfirm, 
    title = 'Confirmar acción',
    message = '¿Estás seguro de realizar esta acción?',
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    confirmButtonVariant = 'outline-secondary',
    size = 'sm'
}) {
    return (
        <>
            <style>
                {`
                    .modal-backdrop {
                        z-index: 1055 !important;
                    }
                `}
            </style>
            <Modal
                show={show}
                onHide={onClose}
                centered
                size={size}
                backdrop="static"
                style={{ zIndex: 1056 }}
                className="confirm-modal"
            >
                <Modal.Header closeButton className="pb-1 pt-2">
                    <Modal.Title>{title}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p className="mb-0">{message}</p>
                </Modal.Body>
                <Modal.Footer className="pt-1 pb-2">
                    <Button
                        variant={confirmButtonVariant}
                        size="sm"
                        onClick={onConfirm}
                    >
                        {confirmText}
                    </Button>
                    <Button
                        variant="danger"
                        size="sm"
                        onClick={onClose}
                    >
                        {cancelText}
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}
