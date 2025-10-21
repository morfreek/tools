import React, { useState } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
import { FaUpload, FaFileUpload } from 'react-icons/fa';

export default function LoadEnvModal({ show, onHide, onLoadEnvVariables }) {
    const [envContent, setEnvContent] = useState('');
    const [error, setError] = useState('');
    const [loadMode, setLoadMode] = useState('merge'); // 'replace' o 'merge'

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setEnvContent(e.target.result);
                setError('');
            };
            reader.readAsText(file);
        }
    };

    const parseEnvContent = (content) => {
        const variables = {};
        const lines = content.split('\n');
        
        for (let line of lines) {
            line = line.trim();
            // Ignorar líneas vacías y comentarios
            if (!line || line.startsWith('#')) continue;
            
            const equalIndex = line.indexOf('=');
            if (equalIndex === -1) continue;
            
            let key = line.substring(0, equalIndex).trim();
            let value = line.substring(equalIndex + 1).trim();
            
            // Remover comillas del valor si existen
            if ((value.startsWith('"') && value.endsWith('"')) || 
                (value.startsWith("'") && value.endsWith("'"))) {
                value = value.slice(1, -1);
            }
            
            if (key) {
                variables[key] = value;
            }
        }
        
        return variables;
    };

    const handleLoad = () => {
        if (!envContent.trim()) {
            setError('Debe proporcionar contenido del archivo .env');
            return;
        }

        try {
            const parsedVariables = parseEnvContent(envContent);
            
            if (Object.keys(parsedVariables).length === 0) {
                setError('No se encontraron variables válidas en el contenido');
                return;
            }

            onLoadEnvVariables(parsedVariables, loadMode);
            handleClose();
        } catch (err) {
            setError('Error al procesar el archivo .env');
        }
    };

    const handleClose = () => {
        setEnvContent('');
        setError('');
        setLoadMode('merge');
        onHide();
    };

    return (
        <Modal show={show} onHide={handleClose} size="xl" fullscreen="xl-down" className="h-100">
            <Modal.Header closeButton>
                <Modal.Title>
                    <FaFileUpload className="me-2" />
                    Cargar Variables de Entorno desde .env
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="d-flex flex-column" style={{ height: 'calc(100vh - 200px)' }}>
                {error && (
                    <Alert variant="danger" className="mb-3">
                        {error}
                    </Alert>
                )}
                
                <Form.Group className="mb-3">
                    <Form.Label>Subir archivo .env</Form.Label>
                    <Form.Control
                        type="file"
                        accept=".env,.txt"
                        onChange={handleFileUpload}
                        size="sm"
                    />
                    <Form.Text className="text-muted">
                        Seleccione un archivo .env o archivo de texto con formato de variables de entorno
                    </Form.Text>
                </Form.Group>

                <Form.Group className="mb-3 flex-grow-1 d-flex flex-column">
                    <Form.Label>O pegue el contenido del archivo .env</Form.Label>
                    <Form.Control
                        as="textarea"
                        className="flex-grow-1"
                        style={{ minHeight: '300px', resize: 'vertical' }}
                        value={envContent}
                        onChange={(e) => {
                            setEnvContent(e.target.value);
                            setError('');
                        }}
                        placeholder={`Ejemplo:
APP_NAME=MiAplicacion
APP_ENV=production
APP_DEBUG=false
APP_URL=https://midominio.com
DB_HOST=localhost
DB_DATABASE=mi_base_datos`}
                        size="sm"
                    />
                </Form.Group>

                <Form.Group className="mb-3">
                    <Form.Label>Modo de carga</Form.Label>
                    <div>
                        <Form.Check
                            type="radio"
                            id="replace-mode"
                            label="Reemplazar todas las variables existentes"
                            checked={loadMode === 'replace'}
                            onChange={() => setLoadMode('replace')}
                        />
                        <Form.Check
                            type="radio"
                            id="merge-mode"
                            label="Combinar con variables existentes (mantener las actuales)"
                            checked={loadMode === 'merge'}
                            onChange={() => setLoadMode('merge')}
                        />
                    </div>
                    <Form.Text className="text-muted">
                        En modo "Combinar", las variables existentes se mantendrán y solo se agregarán las nuevas
                    </Form.Text>
                </Form.Group>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose} size="sm">
                    Cancelar
                </Button>
                <Button 
                    variant="primary" 
                    onClick={handleLoad} 
                    size="sm"
                    disabled={!envContent.trim()}
                >
                    <FaUpload className="me-1" />
                    Cargar Variables
                </Button>
            </Modal.Footer>
        </Modal>
    );
}
