import React, { useState, useRef } from 'react';
import { Container, Form, Alert, ListGroup, Row, Col, Button } from 'react-bootstrap';
import { useJMeterGenerator } from '@/hooks/useJMeterGenerator';
import { useToast } from '@/components/ToastContext';
import ParametersForm from '@/components/jmtest/ParametersForm';
import RoutesList from '@/components/jmtest/RoutesList';
import UrlsPreviewModal from '@/components/jmtest/UrlsPreviewModal';
import JmxPreviewModal from '@/components/jmtest/JmxPreviewModal';

const JMeterTestGenerator = () => {
    const { showToast } = useToast();
    const [routes, setRoutes] = useState([]);
    const [selectedRoutes, setSelectedRoutes] = useState({});
    const [filter, setFilter] = useState('');
    const [loadedFileType, setLoadedFileType] = useState(null); // 'json' | 'jmx' | null
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
    const [showPreview, setShowPreview] = useState(false);
    const [showUrlsPreview, setShowUrlsPreview] = useState(false);

    const jsonInputRef = useRef(null);
    const jmxInputRef = useRef(null);

    const {
        jmxFileUrl,
        jmxXml,
        generatedUrls,
        isGenerating,
        generateJMX,
        handleDownload,
        handleCopyToClipboard,
        handleCopyUrlsForExcel,
        setGeneratedUrls,
        parseJMXFile,
        loadJMXFile
    } = useJMeterGenerator();

    const groupRoute = (uri) => {
        const parts = uri.split('/').filter(Boolean);
        if (parts[0] === 'api') {
            return `/api/${ parts[1] || '' }`;
        }
        return `/${parts[0] || ''}`;
    };

    const clearAllData = () => {
        setRoutes([]);
        setSelectedRoutes({});
        setGeneratedUrls([]);
        setLoadedFileType(null);
    };

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (!file) {
            if (loadedFileType === 'json') {
                setLoadedFileType(null);
            }
            return;
        }

        // Limpiar el otro input y datos previos
        if (jmxInputRef.current) {
            jmxInputRef.current.value = '';
        }
        clearAllData();

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const jsonRoutes = JSON.parse(e.target.result);
                const filtered = jsonRoutes.map(m => ({ ...m, method: m.method.replace('GET|HEAD', 'GET') })).filter(
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
                setLoadedFileType('json');
                showToast('success', `Archivo JSON cargado: ${filtered.length} rutas encontradas`);
            } catch (error) {
                console.error('Error parsing JSON:', error);
                showToast('error', 'Archivo JSON inválido. Verifique que el formato sea correcto.');
                if (jsonInputRef.current) {
                    jsonInputRef.current.value = '';
                }
            }
        };
        reader.readAsText(file);
    };

    const handleJMXFileUpload = (event) => {
        const file = event.target.files[0];
        if (!file) {
            if (loadedFileType === 'jmx') {
                setLoadedFileType(null);
            }
            return;
        }

        if (!file.name.toLowerCase().endsWith('.jmx')) {
            showToast('error', 'Por favor seleccione un archivo .jmx válido');
            if (jmxInputRef.current) {
                jmxInputRef.current.value = '';
            }
            return;
        }

        // Limpiar el otro input y datos previos
        if (jsonInputRef.current) {
            jsonInputRef.current.value = '';
        }
        clearAllData();

        const reader = new FileReader();
        reader.onload = (e) => {
            const result = parseJMXFile(e.target.result);
            
            if (result.success) {
                console.log('Setting params:', result.params); // Para debug
                
                // Actualizar parámetros completos
                setParams(result.params);

                // Crear rutas simuladas y selecciones
                setRoutes(result.routes);
                const initialSelection = {};
                result.routes.forEach((_, index) => {
                    initialSelection[index] = true; // Seleccionar todas por defecto
                });
                setSelectedRoutes(initialSelection);

                // Cargar URLs generadas
                loadJMXFile(e.target.result);
                setLoadedFileType('jmx');
                
                showToast('success', `Archivo JMX cargado correctamente: ${result.routes.length} endpoints importados`);
            } else {
                showToast('error', `Error al cargar el archivo JMX: ${result.error}`);
                if (jmxInputRef.current) {
                    jmxInputRef.current.value = '';
                }
            }
        };
        reader.readAsText(file);
    };

    const handleParamChange = (name, value) => {
        setParams(prev => ({ ...prev, [name]: value }));
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

    const handleSelectAllToggle = () => {
        const allSelected = routes.every((_, index) => selectedRoutes[index]);
        const updated = {};
        routes.forEach((_, index) => {
            updated[index] = !allSelected;
        });
        setSelectedRoutes(updated);
        setJmxXml('');
        setJmxFileUrl(null);
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

    const handleGenerateJMX = async () => {
        const result = await generateJMX(routes, selectedRoutes, params);
        if (result.success) {
            setShowPreview(true);
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

            <Alert variant="info" className="mb-3">
                <Alert.Heading className="h6">¿Cómo obtener el archivo routes.json?</Alert.Heading>
                <p className="mb-2">Para generar el listado de rutas de tu aplicación Laravel en formato JSON, ejecuta el siguiente comando en la raíz de tu proyecto:</p>
                <code>php artisan route:list --json &gt; routes.json</code>
                <p className="mb-0 mt-2 small">Esto creará un archivo <code>routes.json</code> que puedes cargar aquí.</p>
            </Alert>

            <Row className="mb-3">
                <Col md={6}>
                    <Form.Group>
                        <Form.Label className="small">Cargar archivo <code>routes.json</code>:</Form.Label>
                        <Form.Control 
                            ref={jsonInputRef}
                            size="sm" 
                            type="file" 
                            accept=".json" 
                            onChange={handleFileUpload}
                            disabled={loadedFileType === 'jmx'}
                        />
                        <Form.Text className="text-muted">
                            Carga rutas desde Laravel para generar plan de pruebas
                            {loadedFileType === 'jmx' && ' (Deshabilitado - archivo JMX cargado)'}
                        </Form.Text>
                    </Form.Group>
                </Col>
                <Col md={6}>
                    <Form.Group>
                        <Form.Label className="small">O cargar archivo <code>.jmx</code> existente:</Form.Label>
                        <Form.Control 
                            ref={jmxInputRef}
                            size="sm" 
                            type="file" 
                            accept=".jmx" 
                            onChange={handleJMXFileUpload}
                            disabled={loadedFileType === 'json'}
                        />
                        <Form.Text className="text-muted">
                            Carga un archivo JMX para editar configuración y endpoints
                            {loadedFileType === 'json' && ' (Deshabilitado - archivo JSON cargado)'}
                        </Form.Text>
                    </Form.Group>
                </Col>
            </Row>

            {loadedFileType && (
                <div className="mb-3">
                    <div className="d-flex justify-content-between align-items-center p-2 bg-light rounded">
                        <small className="text-muted">
                            Archivo {loadedFileType.toUpperCase()} cargado. 
                            Para cambiar de tipo de archivo, primero debe limpiar la selección actual.
                        </small>
                        <Button
                            size="sm"
                            variant="outline-secondary"
                            onClick={() => {
                                clearAllData();
                                if (jsonInputRef.current) jsonInputRef.current.value = '';
                                if (jmxInputRef.current) jmxInputRef.current.value = '';
                                showToast('info', 'Datos limpiados. Puede cargar un nuevo archivo');
                            }}
                        >
                            Limpiar y cargar otro archivo
                        </Button>
                    </div>
                </div>
            )}

            <ParametersForm
                params={params}
                onChange={handleParamChange}
                onShowUrls={handleShowUrlsPreview}
                onGenerate={handleGenerateJMX}
                isGenerating={isGenerating}
                hasSelectedRoutes={Object.values(selectedRoutes).some(v => v)}
            />

            <RoutesList
                routes={routes}
                selectedRoutes={selectedRoutes}
                filter={filter}
                groupedRoutes={groupedRoutes}
                onFilterChange={setFilter}
                onSelectAllToggle={handleSelectAllToggle}
                onGroupToggle={handleGroupToggle}
                onRouteToggle={handleRouteToggle}
            />

            <UrlsPreviewModal
                show={showUrlsPreview}
                onHide={() => setShowUrlsPreview(false)}
                params={params}
                generatedUrls={generatedUrls}
                onCopyToExcel={handleCopyUrlsForExcel}
            />

            <JmxPreviewModal
                show={showPreview}
                onHide={() => setShowPreview(false)}
                jmxXml={jmxXml}
                onCopyToClipboard={handleCopyToClipboard}
                onDownload={() => handleDownload(params)}
            />

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
};

export default JMeterTestGenerator;