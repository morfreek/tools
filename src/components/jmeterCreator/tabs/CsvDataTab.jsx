import React from 'react';
import { Form, Row, Col, Alert, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { FaInfoCircle, FaDatabase } from 'react-icons/fa';

const CsvDataTab = ({ value, onChange }) => {
    const renderTooltip = (content) => (
        <Tooltip id="tooltip">{content}</Tooltip>
    );

    return (
        <div>
            <Alert variant="info" className="mb-4">
                <FaDatabase className="me-2" />
                <strong>CSV Data Set Config</strong>
                <p className="mb-0 mt-1 small">
                    Configura archivos CSV para alimentar variables dinámicas en tus peticiones. Útil para parametrizar datos como usuarios, IDs, etc.
                </p>
            </Alert>

            <Form>
                <Row className="g-3">
                    <Col md={12}>
                        <Form.Group>
                            <Form.Label className="d-flex justify-content-between align-items-center">
                                <span>Habilitar CSV Data Set</span>
                                <OverlayTrigger
                                    placement="top"
                                    overlay={renderTooltip("Activa el uso de archivos CSV para datos dinámicos en las peticiones")}
                                >
                                    <FaInfoCircle className="text-muted" style={{ cursor: 'help', fontSize: '0.875rem' }} />
                                </OverlayTrigger>
                            </Form.Label>
                            <Form.Check
                                type="switch"
                                id="csv-enabled"
                                label="Usar datos desde archivo CSV"
                                checked={value.csvEnabled || false}
                                onChange={(e) => onChange('csvEnabled', e.target.checked)}
                            />
                        </Form.Group>
                    </Col>
                </Row>

                {value.csvEnabled && (
                    <>
                        <Row className="g-3 mt-3">
                            <Col md={8}>
                                <Form.Group>
                                    <Form.Label className="d-flex justify-content-between align-items-center">
                                        <span>Filename</span>
                                        <OverlayTrigger
                                            placement="top"
                                            overlay={renderTooltip("Ruta al archivo CSV. Puede ser absoluta o relativa al archivo .jmx")}
                                        >
                                            <FaInfoCircle className="text-muted" style={{ cursor: 'help', fontSize: '0.875rem' }} />
                                        </OverlayTrigger>
                                    </Form.Label>
                                    <Form.Control
                                        size="sm"
                                        value={value.csvFilename || ''}
                                        onChange={(e) => onChange('csvFilename', e.target.value)}
                                        placeholder="data/users.csv"
                                    />
                                    <Form.Text muted className="small">
                                        Ruta al archivo CSV con los datos.
                                    </Form.Text>
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label className="d-flex justify-content-between align-items-center">
                                        <span>File Encoding</span>
                                        <OverlayTrigger
                                            placement="top"
                                            overlay={renderTooltip("Codificación del archivo CSV")}
                                        >
                                            <FaInfoCircle className="text-muted" style={{ cursor: 'help', fontSize: '0.875rem' }} />
                                        </OverlayTrigger>
                                    </Form.Label>
                                    <Form.Select
                                        size="sm"
                                        value={value.csvEncoding || 'UTF-8'}
                                        onChange={(e) => onChange('csvEncoding', e.target.value)}
                                    >
                                        <option value="UTF-8">UTF-8</option>
                                        <option value="ISO-8859-1">ISO-8859-1</option>
                                        <option value="UTF-16">UTF-16</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row className="g-3 mt-2">
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="d-flex justify-content-between align-items-center">
                                        <span>Variable Names</span>
                                        <OverlayTrigger
                                            placement="top"
                                            overlay={renderTooltip("Nombres de variables separados por coma. Deben coincidir con las columnas del CSV")}
                                        >
                                            <FaInfoCircle className="text-muted" style={{ cursor: 'help', fontSize: '0.875rem' }} />
                                        </OverlayTrigger>
                                    </Form.Label>
                                    <Form.Control
                                        size="sm"
                                        value={value.csvVariables || ''}
                                        onChange={(e) => onChange('csvVariables', e.target.value)}
                                        placeholder="username,password,userid"
                                    />
                                    <Form.Text muted className="small">
                                        Variables separadas por comas (ej: username,password,userid).
                                    </Form.Text>
                                </Form.Group>
                            </Col>
                            <Col md={3}>
                                <Form.Group>
                                    <Form.Label className="d-flex justify-content-between align-items-center">
                                        <span>Delimiter</span>
                                        <OverlayTrigger
                                            placement="top"
                                            overlay={renderTooltip("Carácter separador de columnas en el CSV")}
                                        >
                                            <FaInfoCircle className="text-muted" style={{ cursor: 'help', fontSize: '0.875rem' }} />
                                        </OverlayTrigger>
                                    </Form.Label>
                                    <Form.Control
                                        size="sm"
                                        value={value.csvDelimiter || ','}
                                        onChange={(e) => onChange('csvDelimiter', e.target.value)}
                                        placeholder=","
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={3}>
                                <Form.Group>
                                    <Form.Label>Recycle on EOF</Form.Label>
                                    <Form.Check
                                        type="switch"
                                        id="csv-recycle"
                                        label="Reiniciar"
                                        checked={value.csvRecycle !== false}
                                        onChange={(e) => onChange('csvRecycle', e.target.checked)}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <div className="mt-3 p-3 bg-light rounded">
                            <p className="text-muted small mb-1">
                                <strong>Uso:</strong> En tus peticiones usa las variables como {'{username}'}, {'{password}'}, etc. 
                                JMeter reemplazará estos valores con datos del CSV.
                            </p>
                        </div>
                    </>
                )}
            </Form>
        </div>
    );
};

export default CsvDataTab;
