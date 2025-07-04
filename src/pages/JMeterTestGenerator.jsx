import React, { useState } from 'react';
import { create } from 'xmlbuilder2';
import { Container, Form, Button, Alert, Row, Col, ListGroup, Placeholder } from 'react-bootstrap';
import { CodePreview } from '@/utils/CodePreview';

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
        } finally {
            setIsGenerating(false);
        }
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
                        <Button size="sm" variant="success" onClick={generateJMX} disabled={isGenerating}>
                            Generar archivo JMeter (.jmx)
                        </Button>
                        {jmxFileUrl && (
                            <Button 
                                size="sm" 
                                variant="primary" 
                                href={jmxFileUrl} 
                                download={() => getDownloadFileName()}
                                onClick={(e) => {
                                    e.currentTarget.setAttribute('download', getDownloadFileName());
                                }}
                            >
                                Descargar
                            </Button>
                        )}
                    </div>
                </div>
            )}

            {(isGenerating || jmxXml) && (
                <>
                    <div className="mt-4">
                        <h5>Vista previa del archivo <code>.jmx</code>:</h5>
                        {isGenerating ? (
                            <div className="bg-dark">
                                <div style={{ 
                                    backgroundColor: '#1e1e1e',
                                    padding: '1rem',
                                    borderRadius: '4px' 
                                }}>
                                    <Placeholder as="p" animation="glow">
                                        <Placeholder xs={12} />{' '}
                                        <Placeholder xs={10} />{' '}
                                        <Placeholder xs={8} />{' '}
                                        <Placeholder xs={9} />{' '}
                                        <Placeholder xs={11} />{' '}
                                        <Placeholder xs={7} />{' '}
                                        <Placeholder xs={12} />
                                    </Placeholder>
                                </div>
                            </div>
                        ) : (
                            <CodePreview content={jmxXml} />
                        )}
                    </div>
                    
                    {generatedUrls.length > 0 && (
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
                </>
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
        </Container>
    );
}

export default JMeterTestGenerator;