import React, { useState } from 'react';
import { create } from 'xmlbuilder2';

function JMeterTestGenerator() {
    const [jmxFileUrl, setJmxFileUrl] = useState(null);
    const [jmxXml, setJmxXml] = useState('');
    const [routes, setRoutes] = useState([]);
    const [selectedRoutes, setSelectedRoutes] = useState({});
    const [filter, setFilter] = useState('');
    const [params, setParams] = useState({
        threads: 10,
        rampUp: 10,
        duration: 60,
        thinkTime: 1000,
        protocol: 'http',
        server: 'localhost',
        port: '',
        prefix: '', // Prefijo añadido
    });

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
    };

    const handleRouteToggle = (index) => {
        setSelectedRoutes((prev) => ({ ...prev, [index]: !prev[index] }));
    };

    const handleGroupToggle = (group) => {
        const updated = { ...selectedRoutes };
        routes.forEach((route, i) => {
            if (groupRoute(route.uri) === group) {
                updated[i] = true;
            }
        });
        setSelectedRoutes(updated);
    };

    const handleGroupUntoggle = (group) => {
        const updated = { ...selectedRoutes };
        routes.forEach((route, i) => {
            if (groupRoute(route.uri) === group) {
                updated[i] = false;
            }
        });
        setSelectedRoutes(updated);
    };

    const generateJMX = () => {
        const selected = routes.filter((_, i) => selectedRoutes[i]);
        if (!selected.length) {
            alert('Selecciona al menos una ruta para generar el archivo JMX.');
            return;
        }

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

        tg.ele('ConstantTimer', {
            guiclass: 'ConstantTimerGui',
            testclass: 'ConstantTimer',
            testname: 'Think Time',
            enabled: 'true',
        })
            .ele('stringProp', { name: 'ConstantTimer.delay' }).txt(params.thinkTime).up()
            .up()
            .ele('hashTree');

        selected.forEach((route) => {
            const method = route.method.toUpperCase();
            let path = route.uri.startsWith('/') ? route.uri : '/' + route.uri;
            // Reemplazar {cualquier_valor} por 1
            path = path.replace(/\{[^}]+\}/g, '1');

            // Concatenar el prefijo
            if (params.prefix) {
                const cleanPrefix = params.prefix.startsWith('/') ? params.prefix : '/' + params.prefix;
                path = cleanPrefix + path;
            }

            tg
                .ele('HTTPSamplerProxy', {
                    guiclass: 'HttpTestSampleGui',
                    testclass: 'HTTPSamplerProxy',
                    testname: `${method}${route.uri}`,
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
        .ele('stringProp', { name: 'filename' }).txt(`results_tree_${new Date().getTime()}.csv`).up()
        .up()
        .ele('hashTree');

    tg.ele('ResultCollector', {
        guiclass: 'SummaryReport',
        testclass: 'ResultCollector',
        testname: 'Summary Report',
        enabled: 'true',
    })
        .ele('stringProp', { name: 'filename' }).txt(`summary_report_${new Date().getTime()}.csv`).up()
        .up()
        .ele('hashTree');

    tg.ele('ResultCollector', {
        guiclass: 'StatVisualizer',
        testclass: 'ResultCollector',
        testname: 'Aggregate Report',
        enabled: 'true',
    })
        .ele('stringProp', { name: 'filename' }).txt(`aggregate_report_${new Date().getTime()}.csv`).up()
        .up()
        .ele('hashTree');

    const xml = root.end({ prettyPrint: true });
    setJmxXml(xml);
    const blob = new Blob([xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    setJmxFileUrl(url);
};

const groupedRoutes = routes.reduce((acc, route, index) => {
    const group = groupRoute(route.uri);
    acc[group] = acc[group] || [];
    acc[group].push({ ...route, index });
    return acc;
}, {});

return (
    <div className="container-fluid mt-4">
        <h3>Laravel → JMeter Test Generator</h3>

        <div className="mb-3">
            <label className="form-label">Cargar archivo <code>routes.json</code>:</label>
            <input type="file" accept=".json" className="form-control" onChange={handleFileUpload} />
        </div>

        {Object.values(selectedRoutes).filter(valor => valor === true).length > 0 && (
            <div className="mb-4">
                <div className="row g-3 mt-4">
                    <div className="col-md-2">
                        <label>Protocolo (http o https)</label>
                        <input type="text" name="protocol" value={params.protocol} onChange={handleParamChange} className="form-control" />
                    </div>
                    <div className="col-md-4">
                        <label>Servidor (host)</label>
                        <input type="text" name="server" value={params.server} onChange={handleParamChange} className="form-control" />
                    </div>
                    <div className="col-md-2">
                        <label>Puerto (opcional)</label>
                        <input type="text" name="port" value={params.port} onChange={handleParamChange} className="form-control" />
                    </div>
                    <div className="col-md-4">
                        <label>Prefijo para las rutas (opcional)</label>
                        <input type="text" name="prefix" value={params.prefix} onChange={handleParamChange} className="form-control" />
                    </div>
                </div>

                <div className="row g-3 mt-2">
                    <div className="col-md-3">
                        <label>Hilos (usuarios concurrentes)</label>
                        <input type="number" name="threads" value={params.threads} onChange={handleParamChange} className="form-control" />
                    </div>
                    <div className="col-md-3">
                        <label>Tiempo de incremento (s)</label>
                        <input type="number" name="rampUp" value={params.rampUp} onChange={handleParamChange} className="form-control" />
                    </div>
                    <div className="col-md-3">
                        <label>Duración total del test (s)</label>
                        <input type="number" name="duration" value={params.duration} onChange={handleParamChange} className="form-control" />
                    </div>
                    <div className="col-md-3">
                        <label>Tiempo de espera entre peticiones (ms)</label>
                        <input type="number" name="thinkTime" value={params.thinkTime} onChange={handleParamChange} className="form-control" />
                    </div>
                </div>
                <button className="btn btn-success mt-4" onClick={generateJMX}>Generar archivo JMeter (.jmx)</button>
            </div>
        )}

        {jmxFileUrl && (
            <div className="alert alert-success mt-4">
                <strong>Archivo generado:</strong>{' '}
                <a href={jmxFileUrl} download="routes_test.jmx" className="btn btn-primary ms-2">Descargar</a>
            </div>
        )}

        {jmxXml && (
            <div className="mt-4">
                <h5>Vista previa del archivo <code>.jmx</code>:</h5>
                <pre style={{ maxHeight: '400px', overflowY: 'auto', background: '#f8f9fa', padding: '1rem' }}>{jmxXml}</pre>
            </div>
        )}

        {routes.length > 0 && (
            <>
                <div className="mb-3">
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Buscar rutas..."
                        value={filter}
                        onChange={(e) => setFilter(e.target.value.toLowerCase())}
                    />
                </div>

                {Object.entries(groupedRoutes).map(([group, groupRoutes]) => {
                    const filteredGroup = groupRoutes.filter((r) =>
                        `${r.method}${r.uri}`.toLowerCase().includes(filter)
                    );

                    if (!filteredGroup.length) return null;

                    return (
                        <div key={group} className="mb-3">
                            <h5>{group}</h5>
                            <button className="btn btn-sm btn-outline-primary me-2" onClick={() => handleGroupToggle(group)}>Seleccionar todos</button>
                            <button className="btn btn-sm btn-outline-secondary" onClick={() => handleGroupUntoggle(group)}>Deseleccionar todos</button>

                            <ul className="list-group mt-2">
                                {filteredGroup.map((route) => (
                                    <li key={route.index} className="list-group-item">
                                        <input
                                            type="checkbox"
                                            className="form-check-input me-2"
                                            checked={selectedRoutes[route.index] || false}
                                            onChange={() => handleRouteToggle(route.index)}
                                        />
                                        <code>{route.method}</code> {route.uri}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    );
                })}
            </>
        )}
    </div>
);
}

export default JMeterTestGenerator;