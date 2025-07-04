import React from 'react';
import { Modal, Button } from 'react-bootstrap';

const SshInstructionsModal = ({ show, onHide }) => (
    <Modal show={show} onHide={onHide} size="lg">
        <Modal.Header closeButton>
            <Modal.Title>Instrucciones para generar SSH Key</Modal.Title>
        </Modal.Header>
        <Modal.Body>
            <h6>1. Generar la clave SSH en el servidor:</h6>
            <pre className="bg-light p-2 rounded">
                {`$ ssh-keygen -t rsa -b 4096 -C "deploy-key"
# Presionar Enter para aceptar ubicación por defecto
# No ingresar passphrase (dejar vacío)`}
            </pre>

            <h6 className="mt-3">2. Mostrar la clave privada:</h6>
            <pre className="bg-light p-2 rounded">
                {`$ cat ~/.ssh/id_rsa`}
            </pre>

            <h6 className="mt-3">3. Copiar la clave pública al archivo authorized_keys:</h6>
            <pre className="bg-light p-2 rounded">
                {`$ cat ~/.ssh/id_rsa.pub >> ~/.ssh/authorized_keys
$ chmod 600 ~/.ssh/authorized_keys`}
            </pre>

            <div className="alert alert-info mt-3">
                <strong>Nota:</strong> Copiar todo el contenido de la clave privada (incluidas las líneas BEGIN y END)
                y pegarlo en el campo "SSH Key" del formulario.
            </div>
        </Modal.Body>
        <Modal.Footer>
            <Button variant="secondary" size="sm" onClick={onHide}>
                Cerrar
            </Button>
        </Modal.Footer>
    </Modal>
);

export default SshInstructionsModal;
