import React from 'react';
import { Form, Row, Col, Alert, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { FaInfoCircle, FaChartLine } from 'react-icons/fa';

const ListenersTab = ({ value, onChange }) => {
    const renderTooltip = (content) => (
        <Tooltip id="tooltip">{content}</Tooltip>
    );

    return (
        <div>
            <Alert variant="info" className="mb-4">
                <FaChartLine className="me-2" />
                <strong>Listeners y Reportes</strong>
                <p className="mb-0 mt-1 small">
                    Los listeners recopilan y muestran resultados de las pruebas. Configura qué reportes generar automáticamente.
                </p>
            </Alert>

            <Form>
                <Row className="g-3">
                    <Col md={6}>
                        <Form.Group>
                            <Form.Label className="d-flex justify-content-between align-items-center">
                                <span>View Results Tree</span>
                                <OverlayTrigger
                                    placement="top"
                                    overlay={renderTooltip("Muestra detalle de cada petición y respuesta durante la ejecución")}
                                >
                                    <FaInfoCircle className="text-muted" style={{ cursor: 'help', fontSize: '0.875rem' }} />
                                </OverlayTrigger>
                            </Form.Label>
                            <Form.Check
                                type="switch"
                                id="listener-results-tree"
                                label="Incluir Results Tree"
                                checked={value.listenerResultsTree !== false}
                                onChange={(e) => onChange('listenerResultsTree', e.target.checked)}
                            />
                            <Form.Text muted className="small">
                                Útil para debugging (desactivar en pruebas de carga).
                            </Form.Text>
                        </Form.Group>
                    </Col>
                    <Col md={6}>
                        <Form.Group>
                            <Form.Label className="d-flex justify-content-between align-items-center">
                                <span>Summary Report</span>
                                <OverlayTrigger
                                    placement="top"
                                    overlay={renderTooltip("Reporte resumen con estadísticas agregadas de todas las peticiones")}
                                >
                                    <FaInfoCircle className="text-muted" style={{ cursor: 'help', fontSize: '0.875rem' }} />
                                </OverlayTrigger>
                            </Form.Label>
                            <Form.Check
                                type="switch"
                                id="listener-summary"
                                label="Incluir Summary Report"
                                checked={value.listenerSummary !== false}
                                onChange={(e) => onChange('listenerSummary', e.target.checked)}
                            />
                            <Form.Text muted className="small">
                                Estadísticas básicas de rendimiento.
                            </Form.Text>
                        </Form.Group>
                    </Col>
                </Row>

                <Row className="g-3 mt-2">
                    <Col md={6}>
                        <Form.Group>
                            <Form.Label className="d-flex justify-content-between align-items-center">
                                <span>Aggregate Report</span>
                                <OverlayTrigger
                                    placement="top"
                                    overlay={renderTooltip("Reporte detallado con métricas por tipo de petición")}
                                >
                                    <FaInfoCircle className="text-muted" style={{ cursor: 'help', fontSize: '0.875rem' }} />
                                </OverlayTrigger>
                            </Form.Label>
                            <Form.Check
                                type="switch"
                                id="listener-aggregate"
                                label="Incluir Aggregate Report"
                                checked={value.listenerAggregate !== false}
                                onChange={(e) => onChange('listenerAggregate', e.target.checked)}
                            />
                            <Form.Text muted className="small">
                                Métricas detalladas por petición.
                            </Form.Text>
                        </Form.Group>
                    </Col>
                    <Col md={6}>
                        <Form.Group>
                            <Form.Label className="d-flex justify-content-between align-items-center">
                                <span>Graph Results</span>
                                <OverlayTrigger
                                    placement="top"
                                    overlay={renderTooltip("Gráfico en tiempo real del rendimiento de las peticiones")}
                                >
                                    <FaInfoCircle className="text-muted" style={{ cursor: 'help', fontSize: '0.875rem' }} />
                                </OverlayTrigger>
                            </Form.Label>
                            <Form.Check
                                type="switch"
                                id="listener-graph"
                                label="Incluir Graph Results"
                                checked={value.listenerGraph || false}
                                onChange={(e) => onChange('listenerGraph', e.target.checked)}
                            />
                            <Form.Text muted className="small">
                                Gráfico de rendimiento en tiempo real.
                            </Form.Text>
                        </Form.Group>
                    </Col>
                </Row>

                <Row className="g-3 mt-3">
                    <Col md={12}>
                        <Form.Group>
                            <Form.Label className="d-flex justify-content-between align-items-center">
                                <span>Generar archivos de resultados</span>
                                <OverlayTrigger
                                    placement="top"
                                    overlay={renderTooltip("Configura si generar archivos JTL automáticamente para análisis posterior")}
                                >
                                    <FaInfoCircle className="text-muted" style={{ cursor: 'help', fontSize: '0.875rem' }} />
                                </OverlayTrigger>
                            </Form.Label>
                            <Form.Check
                                type="switch"
                                id="listener-file-output"
                                label="Guardar resultados en archivos"
                                checked={value.listenerFileOutput || false}
                                onChange={(e) => onChange('listenerFileOutput', e.target.checked)}
                            />
                        </Form.Group>
                    </Col>
                </Row>

                {value.listenerFileOutput && (
                    <Row className="g-3 mt-2">
                        <Col md={8}>
                            <Form.Group>
                                <Form.Label>Filename para resultados</Form.Label>
                                <Form.Control
                                    size="sm"
                                    value={value.listenerFilename || ''}
                                    onChange={(e) => onChange('listenerFilename', e.target.value)}
                                    placeholder="results/test-results.jtl"
                                />
                                <Form.Text muted className="small">
                                    Archivo donde guardar los resultados (.jtl).
                                </Form.Text>
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label>Configure for CSV</Form.Label>
                                <Form.Check
                                    type="switch"
                                    id="listener-csv-output"
                                    label="Formato CSV"
                                    checked={value.listenerCsvOutput !== false}
                                    onChange={(e) => onChange('listenerCsvOutput', e.target.checked)}
                                />
                            </Form.Group>
                        </Col>
                    </Row>
                )}

                <div className="mt-3 p-3 bg-light rounded">
                    <p className="text-muted small mb-1">
                        <strong>Recomendación:</strong> Para pruebas de carga intensivas, desactiva View Results Tree y Graph Results 
                        para mejorar el rendimiento. Usa solo Summary y Aggregate Reports.
                    </p>
                </div>
            </Form>
        </div>
    );
};

export default ListenersTab;
