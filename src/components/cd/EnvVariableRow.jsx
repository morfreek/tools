import React from 'react';
import { Row, Col, Form, Button, Badge } from 'react-bootstrap';
import { FaTrash, FaLock, FaKey } from 'react-icons/fa';

export default function EnvVariableRow({ 
    envKey, 
    value, 
    onRemove, 
    canRemove, 
    onChange, 
    isInvalid 
}) {
    // Determinar si es formato nuevo {value, base64} o string legacy
    const isObjectFormat = typeof value === 'object' && value.value !== undefined;
    const currentValue = isObjectFormat ? value.value : value;
    const currentBase64 = isObjectFormat ? (value.base64 || false) : false;

    const handleValueChange = (newValue) => {
        onChange(envKey, newValue, currentBase64);
    };

    const handleBase64Change = (isBase64) => {
        onChange(envKey, currentValue, isBase64);
    };

    return (
        <Row className="g-2 mb-2 align-items-start">
            <Col md={3}>
                <Form.Control
                    size="sm"
                    type="text"
                    value={envKey}
                    readOnly
                    className="bg-light"
                />
            </Col>
            <Col md={6}>
                <div className="position-relative">
                    {currentBase64 ? (
                        <Form.Control
                            size="sm"
                            as="textarea"
                            rows={3}
                            value={currentValue}
                            onChange={e => handleValueChange(e.target.value)}
                            isInvalid={isInvalid}
                            style={{ 
                                paddingRight: '35px',
                                fontFamily: 'monospace',
                                fontSize: '12px',
                                resize: 'vertical'
                            }}
                            placeholder="Ingrese el contenido que será codificado en Base64..."
                        />
                    ) : (
                        <Form.Control
                            size="sm"
                            type="text"
                            value={currentValue}
                            onChange={e => handleValueChange(e.target.value)}
                            isInvalid={isInvalid}
                            style={{ paddingRight: '12px' }}
                        />
                    )}
                    {currentBase64 && (
                        <FaKey 
                            className="position-absolute text-warning" 
                            style={{ 
                                right: '12px', 
                                top: '12px',
                                fontSize: '12px'
                            }}
                            title="Esta variable será codificada en Base64"
                        />
                    )}
                </div>
            </Col>
            <Col md={2}>
                <div className="d-flex align-items-start justify-content-center pt-1">
                    <Form.Check
                        type="switch"
                        id={`env-base64-${envKey}`}
                        checked={currentBase64}
                        onChange={e => handleBase64Change(e.target.checked)}
                        className="mb-0"
                    />
                    <div className="ms-2">
                        {currentBase64 ? (
                            <Badge bg="warning" text="dark" className="small">
                                <FaKey className="me-1" style={{ fontSize: '10px' }} />
                                Base64
                            </Badge>
                        ) : (
                            <Badge bg="light" text="muted" className="small">
                                Texto
                            </Badge>
                        )}
                    </div>
                </div>
            </Col>
            <Col md={1}>
                <div className="pt-1">
                    {canRemove ? (
                        <Button
                            size="sm"
                            variant="outline-danger"
                            onClick={() => onRemove(envKey)}
                            className="d-inline-flex align-items-center justify-content-center"
                            style={{ width: '31px', height: '31px' }}
                        >
                            <FaTrash />
                        </Button>
                    ) : (
                        <div 
                            className="d-inline-flex align-items-center justify-content-center text-muted"
                            style={{ width: '31px', height: '31px' }}
                            title="Variable protegida"
                        >
                            <FaLock />
                        </div>
                    )}
                </div>
            </Col>
        </Row>
    );
}
