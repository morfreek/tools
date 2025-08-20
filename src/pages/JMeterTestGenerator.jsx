import React, { useState } from 'react';
import { create } from 'xmlbuilder2';
import { Container, Form, Button, Alert, Row, Col, ListGroup, Placeholder, Modal, Badge } from 'react-bootstrap';
import { FaCopy } from 'react-icons/fa';
import { CodePreview } from '@/utils/CodePreview';
import { useToast } from '@/components/ToastContext';

const JMeterTestGenerator = () => {
    const [jmxFileUrl, setJmxFileUrl] = useState(null);
    const [jmxXml, setJmxXml] = useState('');
    const [generatedUrls, setGeneratedUrls] = useState([]);
    const [routes, setRoutes] = useState([]);
    const [selectedRoutes, setSelectedRoutes] = useState({});
    const [filter, setFilter] = useState('');
    const [params, setParams] = useState({
        threads: 10,
        rampUp: 10,
        duration: 60,
        throughput: 60,
        protocol: 'http',
        server: 'localhost',
        port: '',
        prefix: '',
    });
    const [isGenerating, setIsGenerating] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [showUrlsPreview, setShowUrlsPreview] = useState(false);
    const { showToast } = useToast();

    const groupRoute = (uri) => {
        const parts = uri.split('/').filter(Boolean);
        if (parts[0] === 'api') {
            return `/api/${ parts[1] || '' }`;
        }
        return `/${parts[0] || ''}`;
    };

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const jsonRoutes = JSON.parse(e.target.result);
                const filtered = JSON.parse(e.target.result).map(m => ({ ...m, method: m.method.replace('GET|HEAD', 'GET') })).filter(
                    (r) =>
                        r.uri &&
                        r.uri !== '/' &&
                        r.uri !== 'sanctum/csrf-cookie' &&
                        !r.uri.startsWith('_') &&
                        ['GET', 'POST', 'PUT', 'DELETE'].includes(r.method)
                );

                const initialSelection = {};
                filtered.forEach((route, index) => {
                    initialSelection[index] = false;
                });

                setRoutes(filtered);
                setSelectedRoutes(initialSelection);
                setJmxFileUrl(null);
                setJmxXml('');
            } catch {
                alert('Archivo JSON inválido.');
            }
        };
        reader.readAsText(file);
    };

    const handleParamChange = (e) => {
        const { name, value } = e.target;
        setParams((p) => ({ ...p, [name]: value }));
        setJmxXml('');
        setJmxFileUrl(null);
    };

    const handleRouteToggle = (index) => {
        setSelectedRoutes((prev) => ({ ...prev, [index]: !prev[index] }));
        setJmxXml('');
        setJmxFileUrl(null);
    };

    const handleGroupToggle = (group) => {
        const groupRouteIndexes = routes
            .map((route, index) => ({ index, group: groupRoute(route.uri) }))
            .filter(item => item.group === group)
            .map(item => item.index);

        const allSelected = groupRouteIndexes.every(index => selectedRoutes[index]);
        
        const updated = { ...selectedRoutes };
        groupRouteIndexes.forEach(index => {
            updated[index] = !allSelected;
        });
        
        setSelectedRoutes(updated);
        setJmxXml('');
        setJmxFileUrl(null);
    };

    const cleanFileName = (str) => {
        return str
            .toLowerCase()
            .replace(/^https?:\/\//, '') // Remover http:// o https://
            .replace(/[^a-z0-9]/g, '_') // Reemplazar caracteres especiales con _
            .replace(/_+/g, '_') // Reemplazar múltiples _ con uno solo
            .replace(/^_|_$/g, ''); // Remover _ del inicio y final
    };

    const getTimestamp = () => {
        const now = new Date();
        return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_` +
               `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}_` +
               `${String(now.getMilliseconds()).padStart(3, '0')}`;
    };

    const getDownloadFileName = () => {
        const serverName = cleanFileName(params.server);
        const prefixPart = params.prefix ? `_${cleanFileName(params.prefix)}` : '';
        return `jmeter_${serverName}${prefixPart}_${getTimestamp()}.jmx`;
    };

    const generateJMX = async () => {
        setIsGenerating(true);
        try {
            const selected = routes.filter((_, i) => selectedRoutes[i]);
            if (!selected.length) {
                alert('Selecciona al menos una ruta para generar el archivo JMX.');
                return;
            }

            const urls = selected.map(route => {
                const method = route.method.toUpperCase();
                let path = route.uri.startsWith('/') ? route.uri : '/' + route.uri;
                path = path.replace(/\{[^}]+\}/g, '1');
                
                if (params.prefix) {
                    const cleanPrefix = params.prefix.startsWith('/') ? params.prefix : '/' + params.prefix;
                    path = cleanPrefix + path;
                }
                
                return { method, path };
            });
            setGeneratedUrls(urls);

            const timestamp = getTimestamp();

            const root = create({ version: '1.0', encoding: 'UTF-8' })
                .ele('jmeterTestPlan', { version: '1.2', properties: '5.0', jmeter: '5.4.1' })
                .ele('hashTree')
                .ele('TestPlan', {
                    guiclass: 'TestPlanGui',
                    testclass: 'TestPlan',
                    testname: 'Laravel Routes Test',
                    enabled: 'true',
                })
                .ele('stringProp', { name: 'TestPlan.comments' }).up()
                .ele('boolProp', { name: 'TestPlan.functional' }).txt('false').up()
                .ele('boolProp', { name: 'TestPlan.serialize_threadgroups' }).txt('false').up()
                .ele('elementProp', {
                    name: 'TestPlan.user_defined_variables',
                    elementType: 'Arguments',
                    guiclass: 'ArgumentsPanel',
                    testclass: 'Arguments',
                    testname: 'User Defined Variables',
                    enabled: 'true',
                })
                .ele('collectionProp', { name: 'Arguments.arguments' }).up().up()
                .ele('stringProp', { name: 'TestPlan.user_define_classpath' }).up().up()
                .ele('hashTree');

            const tg = root
                .ele('ThreadGroup', {
                    guiclass: 'ThreadGroupGui',
                    testclass: 'ThreadGroup',
                    testname: 'Users Thread Group',
                    enabled: 'true',
                })
                .ele('stringProp', { name: 'ThreadGroup.on_sample_error' }).txt('continue').up()
                .ele('elementProp', { name: 'ThreadGroup.main_controller', elementType: 'LoopController', guiclass: 'LoopControlPanel', testclass: 'LoopController', testname: 'Loop Controller', enabled: 'true' })
                .ele('boolProp', { name: 'LoopController.continue_forever' }).txt('true').up()
                .ele('stringProp', { name: 'LoopController.loops' }).txt('-1').up()
                .up()
                .ele('stringProp', { name: 'ThreadGroup.num_threads' }).txt(params.threads).up()
                .ele('stringProp', { name: 'ThreadGroup.ramp_time' }).txt(params.rampUp).up()
                .ele('boolProp', { name: 'ThreadGroup.scheduler' }).txt('true').up()
                .ele('stringProp', { name: 'ThreadGroup.duration' }).txt(params.duration).up()
                .ele('stringProp', { name: 'ThreadGroup.delay' }).txt('0').up()
                .up()
                .ele('hashTree');

            tg.ele('ConstantThroughputTimer', {
                guiclass: 'TestBeanGUI',
                testclass: 'ConstantThroughputTimer',
                testname: 'Throughput Control',
                enabled: 'true',
            })
                .ele('stringProp', { name: 'throughput' }).txt(params.throughput * 60).up()
                .ele('intProp', { name: 'calcMode' }).txt('1').up()
                .up()
                .ele('hashTree');

            selected.forEach((route) => {
                const method = route.method.toUpperCase();
                let path = route.uri.startsWith('/') ? route.uri : '/' + route.uri;
                path = path.replace(/\{[^}]+\}/g, '1');

                if (params.prefix) {
                    const cleanPrefix = params.prefix.startsWith('/') ? params.prefix : '/' + params.prefix;
                    path = cleanPrefix + path;
                }

                tg
                    .ele('HTTPSamplerProxy', {
                        guiclass: 'HttpTestSampleGui',
                        testclass: 'HTTPSamplerProxy',
                        testname: `${method} ${path}`,
                        enabled: 'true',
                    })
                    .ele('stringProp', { name: 'HTTPSampler.domain' }).txt(params.server).up()
                    .ele('stringProp', { name: 'HTTPSampler.port' }).txt(params.port).up()
                    .ele('stringProp', { name: 'HTTPSampler.protocol' }).txt(params.protocol).up()
                    .ele('stringProp', { name: 'HTTPSampler.path' }).txt(path).up()
                    .ele('stringProp', { name: 'HTTPSampler.method' }).txt(method).up()
                    .ele('boolProp', { name: 'HTTPSampler.follow_redirects' }).txt('true').up()
                    .ele('boolProp', { name: 'HTTPSampler.auto_redirects' }).txt('false').up()
                    .ele('boolProp', { name: 'HTTPSampler.use_keepalive' }).txt('true').up()
                    .ele('boolProp', { name: 'HTTPSampler.DO_MULTIPART_POST' }).txt('false').up()
                    .ele('stringProp', { name: 'HTTPSampler.embedded_url_re' }).txt('').up()
                    .ele('stringProp', { name: 'HTTPSampler.connect_timeout' }).txt('').up()
                    .ele('stringProp', { name: 'HTTPSampler.response_timeout' }).txt('').up()
                    .up()
                    .ele('hashTree');
            });

            tg.ele('ResultCollector', {
                guiclass: 'ViewResultsFullVisualizer',
                testclass: 'ResultCollector',
                testname: 'View Results Tree',
                enabled: 'true',
            })
                .ele('stringProp', { name: 'filename' }).txt(`results_tree_${timestamp}.csv`).up()
                .up()
                .ele('hashTree');

            tg.ele('ResultCollector', {
                guiclass: 'SummaryReport',
                testclass: 'ResultCollector',
                testname: 'Summary Report',
                enabled: 'true',
            })
                .ele('stringProp', { name: 'filename' }).txt(`summary_report_${timestamp}.csv`).up()
                .up()
                .ele('hashTree');

            tg.ele('ResultCollector', {
                guiclass: 'StatGraphVisualizer',
                testclass: 'ResultCollector',
                testname: 'Aggregate Report',
                enabled: 'true',
            })
                .ele('stringProp', { name: 'filename' }).txt(`aggregate_report_${timestamp}.csv`).up()
                .up()
                .ele('hashTree');

            const xml = root.end({ prettyPrint: true });
            setJmxXml(xml);
            const blob = new Blob([xml], { type: 'application/xml' });
            const url = URL.createObjectURL(blob);
            setJmxFileUrl(url);
            setShowPreview(true);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDownload = () => {
        if (jmxFileUrl) {
            const a = document.createElement('a');
            a.href = jmxFileUrl;
            a.download = getDownloadFileName();
            a.click();
        }
    };

    const handleCopyToClipboard = () => {
        navigator.clipboard.writeText(jmxXml)
            .then(() => {
                showToast('success', 'Contenido copiado al portapapeles');
            })
            .catch(() => {
                showToast('error', 'Error al copiar el contenido');
            });
    };

    const handleCopyUrlsForExcel = () => {
        // Crear una sola columna con formato "METHOD PATH"
        const urlList = generatedUrls.map(({method, path}) => `${method} ${path}`).join('\n');
        
        navigator.clipboard.writeText(urlList)
            .then(() => {
                showToast('success', 'URLs copiadas al portapapeles. Puedes pegar directamente en Excel');
            })
            .catch(() => {
                showToast('error', 'Error al copiar las URLs');
            });
    };

    const handleShowUrlsPreview = () => {
        const selected = routes.filter((_, i) => selectedRoutes[i]);
        if (!selected.length) {
            showToast('warning', 'Selecciona al menos una ruta para ver la vista previa');
            return;
        }

        const urls = selected.map(route => {
            const method = route.method.toUpperCase();
            let path = route.uri.startsWith('/') ? route.uri : '/' + route.uri;
            path = path.replace(/\{[^}]+\}/g, '1');
            
            if (params.prefix) {
                const cleanPrefix = params.prefix.startsWith('/') ? params.prefix : '/' + params.prefix;
                path = cleanPrefix + path;
            }
            
            const fullUrl = `${params.protocol}://${params.server}${params.port ? ':' + params.port : ''}${path}`;
            
            return { method, path, fullUrl, originalUri: route.uri };
        });
        
        setGeneratedUrls(urls);
        setShowUrlsPreview(true);
    };

    const groupedRoutes = routes.reduce((acc, route, index) => {
        const group = groupRoute(route.uri);
        acc[group] = acc[group] || [];
        acc[group].push({ ...route, index });
        return acc;
    }, {});

    return (
        <Container fluid className="mt-4">
            <h3>Laravel → JMeter Test Generator</h3>

            <Alert variant="info" className="mb-3">
                <Alert.Heading className="h6">¿Cómo obtener el archivo routes.json?</Alert.Heading>
                <p className="mb-2">Para generar el listado de rutas de tu aplicación Laravel en formato JSON, ejecuta el siguiente comando en la raíz de tu proyecto:</p>
                <code>php artisan route:list --json &gt; routes.json</code>
                <p className="mb-0 mt-2 small">Esto creará un archivo <code>routes.json</code> que puedes cargar aquí.</p>
            </Alert>

            <Form.Group className="mb-3">
                <Form.Label className="small">Cargar archivo <code>routes.json</code>:</Form.Label>
                <Form.Control size="sm" type="file" accept=".json" onChange={handleFileUpload} />
            </Form.Group>

            {Object.values(selectedRoutes).filter(valor => valor === true).length > 0 && (
                <div className="mb-4">
                    <Row className="g-3 mt-4">
                        <Col md={2}>
                            <Form.Group>
                                <Form.Label className="small">Protocolo (http o https)</Form.Label>
                                <Form.Control size="sm" type="text" name="protocol" value={params.protocol} onChange={handleParamChange} />
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label className="small">Servidor (host)</Form.Label>
                                <Form.Control size="sm" type="text" name="server" value={params.server} onChange={handleParamChange} />
                            </Form.Group>
                        </Col>
                        <Col md={2}>
                            <Form.Group>
                                <Form.Label className="small">Puerto (opcional)</Form.Label>
                                <Form.Control size="sm" type="text" name="port" value={params.port} onChange={handleParamChange} />
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label className="small">Prefijo para las rutas (opcional)</Form.Label>
                                <Form.Control size="sm" type="text" name="prefix" value={params.prefix} onChange={handleParamChange} />
                            </Form.Group>
                        </Col>
                    </Row>

                    <Row className="g-3 mt-2">
                        <Col md={3}>
                            <Form.Group>
                                <Form.Label className="small">Hilos (usuarios concurrentes)</Form.Label>
                                <Form.Control size="sm" type="number" name="threads" value={params.threads} onChange={handleParamChange} />
                            </Form.Group>
                        </Col>
                        <Col md={3}>
                            <Form.Group>
                                <Form.Label className="small">Tiempo de incremento (s)</Form.Label>
                                <Form.Control size="sm" type="number" name="rampUp" value={params.rampUp} onChange={handleParamChange} />
                            </Form.Group>
                        </Col>
                        <Col md={3}>
                            <Form.Group>
                                <Form.Label className="small">Duración total del test (s)</Form.Label>
                                <Form.Control size="sm" type="number" name="duration" value={params.duration} onChange={handleParamChange} />
                            </Form.Group>
                        </Col>
                        <Col md={3}>
                            <Form.Group>
                                <Form.Label className="small">Throughput (requests/minute)</Form.Label>
                                <Form.Control size="sm" type="number" name="throughput" value={params.throughput} onChange={handleParamChange} />
                            </Form.Group>
                        </Col>
                    </Row>
                    <div className="d-flex gap-2 mt-4">
                        <Button size="sm" variant="primary" onClick={handleShowUrlsPreview}>
                            Ver URLs a Testear
                        </Button>
                        <Button size="sm" variant="success" onClick={generateJMX} disabled={isGenerating}>
                            {isGenerating ? 'Generando...' : 'Generar archivo JMeter (.jmx)'}
                        </Button>
                    </div>
                </div>
            )}

            {routes.length > 0 && (
                <>
                    <Form.Group className="mb-3">
                        <Form.Control
                            size="sm"
                            type="text"
                            placeholder="Buscar rutas..."
                            value={filter}
                            onChange={(e) => setFilter(e.target.value.toLowerCase())}
                        />
                    </Form.Group>

                    {Object.entries(groupedRoutes).map(([group, groupRoutes]) => {
                        const filteredGroup = groupRoutes.filter((r) =>
                            `${r.method}${r.uri}`.toLowerCase().includes(filter)
                        );

                        if (!filteredGroup.length) return null;

                        const allSelected = groupRoutes.every(route => selectedRoutes[route.index]);

                        return (
                            <div key={group} className="mb-3">
                                <div className="d-flex align-items-center mb-2">
                                    <h5 className="h6 mb-0 me-2">{group}</h5>
                                    <Form.Switch
                                        size="sm"
                                        className="mb-0 small"
                                        checked={allSelected}
                                        onChange={() => handleGroupToggle(group)}
                                        label="Seleccionar todo"
                                        reverse
                                    />
                                </div>
                                <ListGroup size="sm">
                                    {filteredGroup.map((route) => (
                                        <ListGroup.Item key={route.index} className="small py-2">
                                            <Form.Check
                                                type="checkbox"
                                                size="sm"
                                                className="d-inline-block me-2"
                                                checked={selectedRoutes[route.index] || false}
                                                onChange={() => handleRouteToggle(route.index)}
                                            />
                                            <code>{route.method}</code> {route.uri}
                                        </ListGroup.Item>
                                    ))}
                                </ListGroup>
                            </div>
                        );
                    })}
                </>
            )}

            {/* Modal de vista previa */}
            <Modal
                show={showPreview}
                onHide={() => setShowPreview(false)}
                size="lg"
                dialogClassName="modal-90w"
                fullscreen="lg-down"
            >
                <div style={{ height: '90vh', display: 'flex', flexDirection: 'column' }}>
                    <Modal.Header closeButton className="bg-light">
                        <Modal.Title>Vista Previa del Archivo JMX</Modal.Title>
                    </Modal.Header>
                    <Modal.Body className="p-0" style={{ flex: 1, overflow: 'auto' }}>
                        <CodePreview content={jmxXml} />
                    </Modal.Body>
                    <Modal.Footer className="bg-light border-top">
                        <div className="me-auto">
                            <Button
                                size="sm"
                                variant="outline-secondary"
                                onClick={handleCopyToClipboard}
                                className="d-inline-flex align-items-center"
                            >
                                <FaCopy className="me-1" /> Copiar al Portapapeles
                            </Button>
                        </div>
                        <Button size="sm" variant="primary" onClick={handleDownload}>
                            Descargar
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => setShowPreview(false)}>
                            Cerrar
                        </Button>
                    </Modal.Footer>
                </div>
            </Modal>

            {/* Modal de URLs a testear */}
            <Modal
                show={showUrlsPreview}
                onHide={() => setShowUrlsPreview(false)}
                size="lg"
                scrollable
            >
                <Modal.Header closeButton className="bg-light">
                    <Modal.Title>URLs que serán testeadas</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="mb-3 p-3 bg-light rounded">
                        <h6 className="text-primary mb-2">Configuración del test:</h6>
                        <small className="text-muted">
                            • Usuarios concurrentes: <strong>{params.threads}</strong><br/>
                            • Duración: <strong>{params.duration} segundos</strong><br/>
                            • Throughput: <strong>{params.throughput} requests/minuto</strong><br/>
                            • Servidor: <strong>{params.protocol}://{params.server}{params.port ? ':' + params.port : ''}</strong><br/>
                            • Endpoints: <strong>{generatedUrls.length} requests HTTP</strong>
                        </small>
                    </div>
                    
                    <div className="mb-3">
                        <small className="text-muted">
                            Lista de endpoints que serán testeados:
                        </small>
                    </div>
                    
                    <ListGroup>
                        {generatedUrls.map(({method, path, fullUrl, originalUri}, index) => (
                            <ListGroup.Item key={index} className="py-2">
                                <div className="d-flex align-items-center">
                                    <Badge 
                                        bg={
                                            method === 'GET' ? 'success' : 
                                            method === 'POST' ? 'primary' : 
                                            method === 'PUT' ? 'warning' : 
                                            method === 'DELETE' ? 'danger' : 'secondary'
                                        }
                                        className="me-2"
                                        style={{ minWidth: '60px' }}
                                    >
                                        {method}
                                    </Badge>
                                    <div className="flex-grow-1">
                                        <div className="fw-bold small">{method} {path}</div>
                                        <div className="text-muted small">{fullUrl}</div>
                                        {originalUri !== path.replace(params.prefix || '', '') && (
                                            <div className="text-muted small">
                                                Ruta original: {originalUri}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </ListGroup.Item>
                        ))}
                    </ListGroup>
                </Modal.Body>
                <Modal.Footer className="bg-light">
                    <div className="me-auto">
                        <Button
                            size="sm"
                            variant="outline-secondary"
                            onClick={handleCopyUrlsForExcel}
                            className="d-inline-flex align-items-center"
                        >
                            <FaCopy className="me-1" /> Copiar para Excel
                        </Button>
                    </div>
                    <Button size="sm" variant="secondary" onClick={() => setShowUrlsPreview(false)}>
                        Cerrar
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Mostrar rutas incluidas solo cuando hay vista previa */}
            {showPreview && generatedUrls.length > 0 && (
                <div className="mt-4">
                    <h5>Rutas incluidas en el plan de pruebas:</h5>
                    <ListGroup>
                        {generatedUrls.map(({method, path}, index) => (
                            <ListGroup.Item key={index} className="small py-2">
                                <code>{method}</code> {path}
                            </ListGroup.Item>
                        ))}
                    </ListGroup>
                </div>
            )}
        </Container>
    );
}

export default JMeterTestGenerator;