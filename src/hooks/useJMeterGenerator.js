import { useState } from 'react';
import { create } from 'xmlbuilder2';
import { useToast } from '@/components/ToastContext';

export function useJMeterGenerator() {
    const { showToast } = useToast();
    const [jmxFileUrl, setJmxFileUrl] = useState(null);
    const [jmxXml, setJmxXml] = useState('');
    const [generatedUrls, setGeneratedUrls] = useState([]);
    const [isGenerating, setIsGenerating] = useState(false);

    const cleanFileName = (str) => {
        return str
            .toLowerCase()
            .replace(/^https?:\/\//, '')
            .replace(/[^a-z0-9]/g, '_')
            .replace(/_+/g, '_')
            .replace(/^_|_$/g, '');
    };

    const getTimestamp = () => {
        const now = new Date();
        return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_` +
               `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}_` +
               `${String(now.getMilliseconds()).padStart(3, '0')}`;
    };

    const getDownloadFileName = (params) => {
        const serverName = cleanFileName(params.server);
        const prefixPart = params.prefix ? `_${cleanFileName(params.prefix)}` : '';
        return `jmeter_${serverName}${prefixPart}_${getTimestamp()}.jmx`;
    };

    const parseJMXFile = (xmlContent) => {
        try {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');

            // Extraer parámetros del ThreadGroup
            const threadGroup = xmlDoc.querySelector('ThreadGroup');
            if (!threadGroup) {
                throw new Error('No se encontró ThreadGroup en el archivo JMX');
            }

            // Buscar ConstantThroughputTimer dentro del ThreadGroup o a nivel general
            const throughputTimer = xmlDoc.querySelector('ConstantThroughputTimer');
            let throughputValue = 60; // valor por defecto

            if (throughputTimer) {
                const throughputProp = throughputTimer.querySelector('stringProp[name="throughput"]');
                if (throughputProp && throughputProp.textContent) {
                    // Convertir de por hora a por minuto
                    throughputValue = Math.round(parseInt(throughputProp.textContent) / 60);
                }
            }

            const parsedParams = {
                threads: parseInt(threadGroup.querySelector('stringProp[name="ThreadGroup.num_threads"]')?.textContent || '10'),
                rampUp: parseInt(threadGroup.querySelector('stringProp[name="ThreadGroup.ramp_time"]')?.textContent || '10'),
                duration: parseInt(threadGroup.querySelector('stringProp[name="ThreadGroup.duration"]')?.textContent || '60'),
                throughput: throughputValue,
                protocol: 'http',
                server: 'localhost',
                port: '',
                prefix: ''
            };

            // Extraer HTTPSamplers y construir URLs
            const httpSamplers = xmlDoc.querySelectorAll('HTTPSamplerProxy');
            const extractedUrls = [];
            const routes = [];

            httpSamplers.forEach((sampler, index) => {
                const domain = sampler.querySelector('stringProp[name="HTTPSampler.domain"]')?.textContent || '';
                const port = sampler.querySelector('stringProp[name="HTTPSampler.port"]')?.textContent || '';
                const protocol = sampler.querySelector('stringProp[name="HTTPSampler.protocol"]')?.textContent || 'http';
                const path = sampler.querySelector('stringProp[name="HTTPSampler.path"]')?.textContent || '';
                const method = sampler.querySelector('stringProp[name="HTTPSampler.method"]')?.textContent || 'GET';

                if (domain && path && method) {
                    // Actualizar parámetros del servidor si encontramos datos válidos
                    if (index === 0) {
                        parsedParams.protocol = protocol;
                        parsedParams.server = domain;
                        parsedParams.port = port;
                    }

                    const fullUrl = `${protocol}://${domain}${port ? ':' + port : ''}${path}`;
                    
                    extractedUrls.push({
                        method,
                        path,
                        fullUrl,
                        originalUri: path.replace(/^\//, '') // Remover slash inicial para simular Laravel route
                    });

                    // Crear ruta simulada para el sistema
                    routes.push({
                        uri: path.replace(/^\//, ''),
                        method: method,
                        name: `jmx.route.${index}`
                    });
                }
            });

            console.log('Parsed JMX params:', parsedParams); // Para debug

            return {
                success: true,
                params: parsedParams,
                urls: extractedUrls,
                routes: routes
            };

        } catch (error) {
            console.error('Error parsing JMX:', error);
            return {
                success: false,
                error: error.message
            };
        }
    };

    const loadJMXFile = (xmlContent) => {
        const result = parseJMXFile(xmlContent);
        
        if (result.success) {
            setGeneratedUrls(result.urls);
            showToast('success', `Archivo JMX cargado: ${result.routes.length} endpoints encontrados`);
        } else {
            showToast('error', `Error al cargar JMX: ${result.error}`);
        }

        return result;
    };

    const generateJMX = async (routes, selectedRoutes, params) => {
        setIsGenerating(true);
        try {
            const selected = routes.filter((_, i) => selectedRoutes[i]);
            if (!selected.length) {
                showToast('error', 'Selecciona al menos una ruta para generar el archivo JMX.');
                return { success: false, error: 'No routes selected' };
            }

            const urls = selected.map(route => {
                const method = route.method.toUpperCase();
                let path = route.uri.startsWith('/') ? route.uri : '/' + route.uri;
                path = path.replace(/\{[^}]+\}/g, '2147483646');
                
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
                path = path.replace(/\{[^}]+\}/g, '2147483646');

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

            return { success: true, xml, url };
        } catch (error) {
            showToast('error', 'Error al generar el archivo JMX');
            return { success: false, error };
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDownload = (params) => {
        if (jmxFileUrl) {
            const a = document.createElement('a');
            a.href = jmxFileUrl;
            a.download = getDownloadFileName(params);
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
        const urlList = generatedUrls.map(({method, path}) => `${method} ${path}`).join('\n');
        
        navigator.clipboard.writeText(urlList)
            .then(() => {
                showToast('success', 'URLs copiadas al portapapeles. Puedes pegar directamente en Excel');
            })
            .catch(() => {
                showToast('error', 'Error al copiar las URLs');
            });
    };

    return {
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
    };
}
