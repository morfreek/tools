export const createDefaultRequest = (index = 1) => ({
    id: Date.now() + Math.random(), // ID único estable
    name: `HTTP Request ${index}`,
    method: 'GET',
    path: '/api/example',
    headersText: '',
    bodyText: '',
    paramsText: '',
    enabled: true,
    responseAssertions: [],
    jsonAssertions: []
});

// Funciones de parsing JMX
export const parseJmxFile = async (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const xmlText = e.target.result;
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
                
                const config = extractJmxConfig(xmlDoc);
                resolve(config);
            } catch (error) {
                reject(new Error('Error al parsear el archivo JMX: ' + error.message));
            }
        };
        reader.onerror = () => reject(new Error('Error al leer el archivo'));
        reader.readAsText(file);
    });
};

const extractJmxConfig = (xmlDoc) => {
    const config = {
        plan: {
            planName: '',
            baseUrl: '',
            customPort: '',
            customPrefix: '',
            threads: 10,
            rampUp: 10,
            loops: -1,
            scheduler: false,
            duration: 60,
            startupDelay: 0,
            csvEnabled: false,
            csvFilename: '',
            csvVariables: '',
            csvDelimiter: ',',
            csvEncoding: 'UTF-8',
            csvRecycle: true,
            timers: {
                uniform: { enabled: false, delay: 500, range: 1000 },
                constant: { enabled: false, delay: 1000 },
                gaussian: { enabled: false, delay: 1000, deviation: 500 },
                constantThroughput: { enabled: false, target: 1000, calculation: 'this thread only' },
                poisson: { enabled: false, delay: 1000, lambda: 500 }
            },
            listenerResultsTree: false,
            listenerSummary: false,
            listenerAggregate: false,
            listenerGraph: false,
            listenerFileOutput: false,
            listenerFilename: '',
            listenerCsvOutput: false
        },
        requests: []
    };

    // Extraer nombre del plan
    const testPlan = xmlDoc.querySelector('TestPlan');
    if (testPlan) {
        config.plan.planName = testPlan.getAttribute('testname') || '';
    }

    // Extraer configuración del Thread Group
    const threadGroup = xmlDoc.querySelector('ThreadGroup');
    if (threadGroup) {
        const numThreads = threadGroup.querySelector('stringProp[name="ThreadGroup.num_threads"]');
        const rampTime = threadGroup.querySelector('stringProp[name="ThreadGroup.ramp_time"]');
        const loops = threadGroup.querySelector('stringProp[name="LoopController.loops"]');
        const scheduler = threadGroup.querySelector('boolProp[name="ThreadGroup.scheduler"]');
        const duration = threadGroup.querySelector('stringProp[name="ThreadGroup.duration"]');
        const delay = threadGroup.querySelector('stringProp[name="ThreadGroup.delay"]');

        if (numThreads) config.plan.threads = parseInt(numThreads.textContent) || 10;
        if (rampTime) config.plan.rampUp = parseInt(rampTime.textContent) || 10;
        if (loops) config.plan.loops = parseInt(loops.textContent) || -1;
        if (scheduler) config.plan.scheduler = scheduler.textContent === 'true';
        if (duration) config.plan.duration = parseInt(duration.textContent) || 60;
        if (delay) config.plan.startupDelay = parseInt(delay.textContent) || 0;
    }

    // Extraer configuración CSV
    const csvDataSet = xmlDoc.querySelector('CSVDataSet');
    if (csvDataSet) {
        config.plan.csvEnabled = true;
        const filename = csvDataSet.querySelector('stringProp[name="filename"]');
        const delimiter = csvDataSet.querySelector('stringProp[name="delimiter"]');
        const encoding = csvDataSet.querySelector('stringProp[name="fileEncoding"]');
        const variables = csvDataSet.querySelector('stringProp[name="variableNames"]');
        const recycle = csvDataSet.querySelector('boolProp[name="recycle"]');

        if (filename) config.plan.csvFilename = filename.textContent;
        if (delimiter) config.plan.csvDelimiter = delimiter.textContent;
        if (encoding) config.plan.csvEncoding = encoding.textContent;
        if (variables) config.plan.csvVariables = variables.textContent;
        if (recycle) config.plan.csvRecycle = recycle.textContent === 'true';
    }

    // Extraer timers
    extractTimers(xmlDoc, config.plan.timers);

    // Extraer listeners
    extractListeners(xmlDoc, config.plan);

    // Extraer requests HTTP
    config.requests = extractHttpRequests(xmlDoc);

    // Inferir baseUrl del primer request
    if (config.requests.length > 0) {
        const firstReq = config.requests[0];
        if (firstReq.domain) {
            const protocol = firstReq.protocol || 'https';
            const port = firstReq.port ? `:${firstReq.port}` : '';
            config.plan.baseUrl = `${protocol}://${firstReq.domain}${port}`;
            config.plan.customPort = firstReq.port || '';
        }
    }

    return config;
};

const extractTimers = (xmlDoc, timers) => {
    // Uniform Random Timer
    const uniformTimer = xmlDoc.querySelector('UniformRandomTimer');
    if (uniformTimer) {
        timers.uniform.enabled = true;
        const delay = uniformTimer.querySelector('stringProp[name="ConstantTimer.delay"]');
        const range = uniformTimer.querySelector('stringProp[name="RandomTimer.range"]');
        if (delay) timers.uniform.delay = parseInt(delay.textContent) || 500;
        if (range) timers.uniform.range = parseInt(range.textContent) || 1000;
    }

    // Constant Timer
    const constantTimer = xmlDoc.querySelector('ConstantTimer');
    if (constantTimer) {
        timers.constant.enabled = true;
        const delay = constantTimer.querySelector('stringProp[name="ConstantTimer.delay"]');
        if (delay) timers.constant.delay = parseInt(delay.textContent) || 1000;
    }

    // Gaussian Random Timer
    const gaussianTimer = xmlDoc.querySelector('GaussianRandomTimer');
    if (gaussianTimer) {
        timers.gaussian.enabled = true;
        const delay = gaussianTimer.querySelector('stringProp[name="ConstantTimer.delay"]');
        const range = gaussianTimer.querySelector('stringProp[name="RandomTimer.range"]');
        if (delay) timers.gaussian.delay = parseInt(delay.textContent) || 1000;
        if (range) timers.gaussian.deviation = parseInt(range.textContent) || 500;
    }

    // Constant Throughput Timer
    const throughputTimer = xmlDoc.querySelector('ConstantThroughputTimer');
    if (throughputTimer) {
        timers.constantThroughput.enabled = true;
        const throughput = throughputTimer.querySelector('stringProp[name="throughput"]');
        const calcMode = throughputTimer.querySelector('intProp[name="calcMode"]');
        if (throughput) timers.constantThroughput.target = parseInt(throughput.textContent) || 1000;
        if (calcMode) {
            const mode = parseInt(calcMode.textContent) || 0;
            const calculations = ['this thread only', 'all active threads', 'all active threads (shared)', 'all active threads in current thread group'];
            timers.constantThroughput.calculation = calculations[mode] || 'this thread only';
        }
    }

    // Poisson Random Timer
    const poissonTimer = xmlDoc.querySelector('PoissonRandomTimer');
    if (poissonTimer) {
        timers.poisson.enabled = true;
        const delay = poissonTimer.querySelector('stringProp[name="ConstantTimer.delay"]');
        const range = poissonTimer.querySelector('stringProp[name="RandomTimer.range"]');
        if (delay) timers.poisson.delay = parseInt(delay.textContent) || 1000;
        if (range) timers.poisson.lambda = parseInt(range.textContent) || 500;
    }
};

const extractListeners = (xmlDoc, plan) => {
    // View Results Tree
    const resultsTree = xmlDoc.querySelector('ResultCollector[guiclass="ViewResultsFullVisualizer"]');
    plan.listenerResultsTree = !!resultsTree;

    // Summary Report
    const summaryReport = xmlDoc.querySelector('ResultCollector[guiclass="SummaryReport"]');
    plan.listenerSummary = !!summaryReport;

    // Aggregate Report
    const aggregateReport = xmlDoc.querySelector('ResultCollector[guiclass="StatVisualizer"]');
    plan.listenerAggregate = !!aggregateReport;

    // Graph Results
    const graphResults = xmlDoc.querySelector('ResultCollector[guiclass="GraphVisualizer"]');
    plan.listenerGraph = !!graphResults;
};

const extractHttpRequests = (xmlDoc) => {
    const requests = [];
    const httpSamplers = xmlDoc.querySelectorAll('HTTPSamplerProxy');
    
    httpSamplers.forEach((sampler, index) => {
        const request = {
            id: Date.now() + Math.random() + index,
            name: sampler.getAttribute('testname') || `HTTP Request ${index + 1}`,
            enabled: sampler.getAttribute('enabled') !== 'false'
        };

        // Extraer propiedades básicas
        const domain = sampler.querySelector('stringProp[name="HTTPSampler.domain"]');
        const port = sampler.querySelector('stringProp[name="HTTPSampler.port"]');
        const protocol = sampler.querySelector('stringProp[name="HTTPSampler.protocol"]');
        const path = sampler.querySelector('stringProp[name="HTTPSampler.path"]');
        const method = sampler.querySelector('stringProp[name="HTTPSampler.method"]');

        request.domain = domain ? domain.textContent : '';
        request.port = port ? port.textContent : '';
        request.protocol = protocol ? protocol.textContent : 'https';
        request.path = path ? path.textContent : '/';
        request.method = method ? method.textContent : 'GET';

        // Extraer propiedades avanzadas solo si están presentes y no son valores por defecto
        const connectTimeout = sampler.querySelector('stringProp[name="HTTPSampler.connect_timeout"]');
        const responseTimeout = sampler.querySelector('stringProp[name="HTTPSampler.response_timeout"]');
        const followRedirects = sampler.querySelector('boolProp[name="HTTPSampler.follow_redirects"]');
        const autoRedirects = sampler.querySelector('boolProp[name="HTTPSampler.auto_redirects"]');
        const useKeepAlive = sampler.querySelector('boolProp[name="HTTPSampler.use_keepalive"]');

        // Solo asignar si tienen valores no vacíos
        if (connectTimeout && connectTimeout.textContent.trim()) {
            request.connectTimeout = connectTimeout.textContent;
        }
        if (responseTimeout && responseTimeout.textContent.trim()) {
            request.responseTimeout = responseTimeout.textContent;
        }
        
        // Para booleanos, solo asignar si están explícitamente configurados y son diferentes del valor por defecto
        if (followRedirects && followRedirects.textContent === 'false') {
            request.followRedirects = false;
        }
        if (autoRedirects && autoRedirects.textContent === 'true') {
            request.autoRedirects = true;
        }
        if (useKeepAlive && useKeepAlive.textContent === 'false') {
            request.useKeepAlive = false;
        }

        // Extraer argumentos/parámetros
        const args = sampler.querySelector('elementProp[name="HTTPsampler.Arguments"]');
        if (args) {
            const isRawBody = sampler.querySelector('boolProp[name="HTTPSampler.postBodyRaw"]');
            if (isRawBody && isRawBody.textContent === 'true') {
                // Cuerpo raw
                const argValue = args.querySelector('stringProp[name="Argument.value"]');
                request.bodyText = argValue ? argValue.textContent : '';
                request.paramsText = '';
            } else {
                // Parámetros normales
                const argElements = args.querySelectorAll('elementProp[elementType="HTTPArgument"]');
                const params = [];
                argElements.forEach(arg => {
                    const name = arg.querySelector('stringProp[name="Argument.name"]');
                    const value = arg.querySelector('stringProp[name="Argument.value"]');
                    if (name && value) {
                        params.push(`${name.textContent}=${value.textContent}`);
                    }
                });
                request.paramsText = params.join('\n');
                request.bodyText = '';
            }
        } else {
            request.bodyText = '';
            request.paramsText = '';
        }

        // Buscar el hashTree específico de este sampler para extraer headers y assertions
        const samplerHashTree = sampler.nextElementSibling;
        
        // Extraer headers del hashTree específico de este sampler
        if (samplerHashTree && samplerHashTree.tagName === 'hashTree') {
            const headerManager = samplerHashTree.querySelector('HeaderManager');
            if (headerManager) {
                const headerElements = headerManager.querySelectorAll('elementProp[elementType="Header"]');
                const headers = [];
                headerElements.forEach(header => {
                    const name = header.querySelector('stringProp[name="Header.name"]');
                    const value = header.querySelector('stringProp[name="Header.value"]');
                    if (name && value) {
                        headers.push(`${name.textContent}:${value.textContent}`);
                    }
                });
                request.headersText = headers.join('\n');
            } else {
                request.headersText = '';
            }

            // Extraer assertions del hashTree específico de este sampler
            request.responseAssertions = extractResponseAssertions(samplerHashTree);
            request.jsonAssertions = extractJsonAssertions(samplerHashTree);
        } else {
            request.headersText = '';
            request.responseAssertions = [];
            request.jsonAssertions = [];
        }

        // Determinar qué secciones activar basándose en el contenido
        const hasDataContent = !!(
            request.headersText ||
            request.bodyText ||
            request.paramsText
        );

        // Solo activar avanzado si hay configuración personalizada real
        const hasAdvancedContent = !!(
            (request.connectTimeout && request.connectTimeout !== '') ||
            (request.responseTimeout && request.responseTimeout !== '') ||
            (request.followRedirects === false) ||
            (request.autoRedirects === true) ||
            (request.useKeepAlive === false)
        );

        const hasAssertionsContent = !!(
            (request.responseAssertions && request.responseAssertions.length > 0) ||
            (request.jsonAssertions && request.jsonAssertions.length > 0)
        );

        // Activar switches automáticamente si hay contenido
        request.dataEnabled = hasDataContent;
        request.advancedEnabled = hasAdvancedContent;
        request.assertionsEnabled = hasAssertionsContent;

        requests.push(request);
    });

    return requests;
};

const extractResponseAssertions = (hashTreeNode) => {
    const assertions = [];
    const responseAssertions = hashTreeNode.querySelectorAll('ResponseAssertion');
    
    responseAssertions.forEach((assertion, index) => {
        const testStrings = assertion.querySelector('collectionProp[name="Asserion.test_strings"]');
        const testField = assertion.querySelector('stringProp[name="Assertion.test_field"]');
        const testType = assertion.querySelector('intProp[name="Assertion.test_type"]');
        
        if (testStrings && testField && testType) {
            const pattern = testStrings.querySelector('stringProp');
            if (pattern) {
                const fieldMap = {
                    'Assertion.response_code': 'response_code',
                    'Assertion.response_message': 'response_message',
                    'Assertion.response_headers': 'response_headers',
                    'Assertion.response_data_as_text': 'response_data'
                };
                
                const typeMap = {
                    '1': 'equals',
                    '2': 'contains',
                    '4': 'matches',
                    '5': 'not_equals',
                    '6': 'not_contains'
                };
                
                assertions.push({
                    id: Date.now() + Math.random() + index,
                    enabled: assertion.getAttribute('enabled') !== 'false',
                    field: fieldMap[testField.textContent] || 'response_data',
                    type: typeMap[testType.textContent] || 'contains',
                    pattern: pattern.textContent || ''
                });
            }
        }
    });
    
    return assertions;
};

const extractJsonAssertions = (hashTreeNode) => {
    const assertions = [];
    const jsonAssertions = hashTreeNode.querySelectorAll('JSONPathAssertion');
    
    jsonAssertions.forEach((assertion, index) => {
        const jsonPath = assertion.querySelector('stringProp[name="JSON_PATH"]');
        const expectedValue = assertion.querySelector('stringProp[name="EXPECTED_VALUE"]');
        
        if (jsonPath) {
            assertions.push({
                id: Date.now() + Math.random() + index,
                enabled: assertion.getAttribute('enabled') !== 'false',
                jsonPath: jsonPath.textContent || '',
                expectedValue: expectedValue ? expectedValue.textContent : ''
            });
        }
    });
    
    return assertions;
};

// Funciones existentes de generación JMX
export const escapeXml = (s = '') =>
    String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');

export const parseBaseUrl = (url) => {
    try {
        const u = new URL(url);
        const pathParts = u.pathname.split('/').filter(Boolean);
        const prefix = pathParts.length > 0 ? '/' + pathParts.join('/') : '';
        
        return {
            protocol: u.protocol.replace(':', ''),
            domain: u.hostname,
            port: u.port || '',
            prefix: prefix
        };
    } catch {
        return { protocol: '', domain: '', port: '', prefix: '' };
    }
};

export const parseKVs = (text, sep = ':') =>
    (text || '')
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean)
        .map((l) => {
            const idx = l.indexOf(sep);
            if (idx === -1) return { name: l, value: '' };
            return { name: l.slice(0, idx).trim(), value: l.slice(idx + 1).trim() };
        });

export const buildHeaders = (pairs) => {
    if (!pairs.length) return '';
    return `
      <HeaderManager guiclass="HeaderPanel" testclass="HeaderManager" testname="HTTP Header Manager" enabled="true">
        <collectionProp name="HeaderManager.headers">
          ${pairs
            .map(
                (p) => `
            <elementProp name="" elementType="Header">
              <stringProp name="Header.name">${escapeXml(p.name)}</stringProp>
              <stringProp name="Header.value">${escapeXml(p.value)}</stringProp>
            </elementProp>`
            )
            .join('')}
        </collectionProp>
      </HeaderManager>
      <hashTree/>`;
};

export const buildResponseAssertion = (assertion) => {
    if (!assertion.enabled) return '';
    
    const testField = {
        'response_code': 'Assertion.response_code',
        'response_message': 'Assertion.response_message', 
        'response_headers': 'Assertion.response_headers',
        'response_data': 'Assertion.response_data_as_text'
    }[assertion.field] || 'Assertion.response_data_as_text';

    const testType = {
        'equals': '1',
        'contains': '2',
        'not_contains': '6',
        'matches': '4',
        'not_equals': '5'
    }[assertion.type] || '2';

    return `
        <ResponseAssertion guiclass="AssertionGui" testclass="ResponseAssertion" testname="Response Assertion" enabled="true">
          <collectionProp name="Asserion.test_strings">
            <stringProp name="${Date.now()}">${escapeXml(assertion.pattern)}</stringProp>
          </collectionProp>
          <stringProp name="Assertion.custom_message"></stringProp>
          <stringProp name="Assertion.test_field">${testField}</stringProp>
          <boolProp name="Assertion.assume_success">false</boolProp>
          <intProp name="Assertion.test_type">${testType}</intProp>
        </ResponseAssertion>
        <hashTree/>`;
};

export const buildJsonPathAssertion = (assertion) => {
    if (!assertion.enabled) return '';
    
    return `
        <JSONPathAssertion guiclass="JSONPathAssertionGui" testclass="JSONPathAssertion" testname="JSON Path Assertion" enabled="true">
          <stringProp name="JSON_PATH">${escapeXml(assertion.jsonPath)}</stringProp>
          <stringProp name="EXPECTED_VALUE">${escapeXml(assertion.expectedValue)}</stringProp>
          <boolProp name="JSONVALIDATION">true</boolProp>
          <boolProp name="EXPECT_NULL">false</boolProp>
          <boolProp name="INVERT">false</boolProp>
          <boolProp name="ISREGEX">false</boolProp>
        </JSONPathAssertion>
        <hashTree/>`;
};

export const buildAssertions = (req) => {
    const responseAssertions = (req.responseAssertions || [])
        .filter(assertion => assertion.enabled)
        .map(buildResponseAssertion)
        .join('');
    
    const jsonAssertions = (req.jsonAssertions || [])
        .filter(assertion => assertion.enabled)
        .map(buildJsonPathAssertion)
        .join('');
    
    return responseAssertions + jsonAssertions;
};

export const buildSampler = (req, base, customPort = '', customPrefix = '') => {
    const method = (req.method || 'GET').toUpperCase();
    const finalPrefix = customPrefix || base.prefix || '';
    const requestPath = req.path?.startsWith('/') ? req.path : `/${req.path || ''}`;
    const fullPath = finalPrefix ? `${finalPrefix}${requestPath}` : requestPath;
    
    const headers = parseKVs(req.headersText || '', ':');
    const params = parseKVs(req.paramsText || '', '=');
    const hasRawBody = method !== 'GET' && (req.bodyText || '').trim().length > 0;
    const hasParams = params.length > 0;
    const enabled = req.enabled !== false;
    const assertions = buildAssertions(req);
    
    const finalPort = customPort || base.port || '';
  
    console.log(params);

    // Añadir Content-Type por defecto si hay cuerpo raw y no está definido
    if (hasRawBody && !headers.some(h => (h.name || '').toLowerCase() === 'content-type')) {
        // Heurística simple: asumir JSON
        headers.unshift({ name: 'Content-Type', value: 'application/json' });
    }

    const argsXml = hasRawBody
        ? `
      <elementProp name="HTTPsampler.Arguments" elementType="Arguments">
        <collectionProp name="Arguments.arguments">
          <elementProp name="" elementType="HTTPArgument">
            <boolProp name="HTTPArgument.always_encode">false</boolProp>
            <stringProp name="Argument.value">${escapeXml(req.bodyText || '')}</stringProp>
            <stringProp name="Argument.metadata">=</stringProp>
            <boolProp name="HTTPArgument.use_equals">false</boolProp>
          </elementProp>
        </collectionProp>
      </elementProp>`
        : (hasParams
            ? `
      <elementProp name="HTTPsampler.Arguments" elementType="Arguments" guiclass="HTTPArgumentsPanel" testclass="Arguments" testname="User Defined Variables" enabled="true">
        <collectionProp name="Arguments.arguments">
          ${params
            .map(
                (p) => `
            <elementProp name="${escapeXml(p.name)}" elementType="HTTPArgument">
              <boolProp name="HTTPArgument.always_encode">true</boolProp>
              <stringProp name="Argument.value">${escapeXml(p.value)}</stringProp>
              <stringProp name="Argument.metadata">=</stringProp>
              <boolProp name="HTTPArgument.use_equals">true</boolProp>
              <stringProp name="Argument.name">${escapeXml(p.name)}</stringProp>
            </elementProp>`
            )
            .join('')}
        </collectionProp>
      </elementProp>`
            : ''
        );

    return `
      <HTTPSamplerProxy guiclass="HttpTestSampleGui" testclass="HTTPSamplerProxy" testname="${escapeXml(
        req.name || 'Request'
    )}" enabled="${enabled}">
        ${argsXml}
        <stringProp name="HTTPSampler.domain">${escapeXml(base.domain)}</stringProp>
        <stringProp name="HTTPSampler.port">${escapeXml(finalPort)}</stringProp>
        <stringProp name="HTTPSampler.protocol">${escapeXml(base.protocol)}</stringProp>
        <stringProp name="HTTPSampler.path">${escapeXml(fullPath)}</stringProp>
        <stringProp name="HTTPSampler.method">${escapeXml(method)}</stringProp>
        <boolProp name="HTTPSampler.follow_redirects">${req.followRedirects !== false}</boolProp>
        <boolProp name="HTTPSampler.auto_redirects">${req.autoRedirects === true}</boolProp>
        <boolProp name="HTTPSampler.use_keepalive">${req.useKeepAlive !== false}</boolProp>
        <boolProp name="HTTPSampler.DO_MULTIPART_POST">false</boolProp>
        <stringProp name="HTTPSampler.embedded_url_re"></stringProp>
        <stringProp name="HTTPSampler.connect_timeout">${req.connectTimeout || ''}</stringProp>
        <stringProp name="HTTPSampler.response_timeout">${req.responseTimeout || ''}</stringProp>
        <boolProp name="HTTPSampler.postBodyRaw">${hasRawBody}</boolProp>
      </HTTPSamplerProxy>
      <hashTree>
        ${buildHeaders(headers)}
        ${assertions}
      </hashTree>`;
};

const generateTimerElements = (plan) => {
    if (!plan.timers) return '';
    
    let timerElements = '';
    
    // Uniform Random Timer
    if (plan.timers.uniform?.enabled) {
        timerElements += `
        <UniformRandomTimer guiclass="UniformRandomTimerGui" testclass="UniformRandomTimer" testname="Uniform Random Timer" enabled="true">
          <stringProp name="ConstantTimer.delay">${plan.timers.uniform.delay || 1000}</stringProp>
          <stringProp name="RandomTimer.range">${plan.timers.uniform.range || 500}</stringProp>
        </UniformRandomTimer>
        <hashTree/>`;
    }
    
    // Constant Timer
    if (plan.timers.constant?.enabled) {
        timerElements += `
        <ConstantTimer guiclass="ConstantTimerGui" testclass="ConstantTimer" testname="Constant Timer" enabled="true">
          <stringProp name="ConstantTimer.delay">${plan.timers.constant.delay || 1000}</stringProp>
        </ConstantTimer>
        <hashTree/>`;
    }
    
    // Gaussian Random Timer
    if (plan.timers.gaussian?.enabled) {
        timerElements += `
        <GaussianRandomTimer guiclass="GaussianRandomTimerGui" testclass="GaussianRandomTimer" testname="Gaussian Random Timer" enabled="true">
          <stringProp name="ConstantTimer.delay">${plan.timers.gaussian.delay || 1000}</stringProp>
          <stringProp name="RandomTimer.range">${plan.timers.gaussian.deviation || 500}</stringProp>
        </GaussianRandomTimer>
        <hashTree/>`;
    }
    
    // Constant Throughput Timer
    if (plan.timers.constantThroughput?.enabled) {
        timerElements += `
        <ConstantThroughputTimer guiclass="TestBeanGUI" testclass="ConstantThroughputTimer" testname="Constant Throughput Timer" enabled="true">
          <stringProp name="throughput">${plan.timers.constantThroughput.target || 1000}</stringProp>
          <intProp name="calcMode">${getCalculationMode(plan.timers.constantThroughput.calculation || 'this thread only')}</intProp>
        </ConstantThroughputTimer>
        <hashTree/>`;
    }
    
    // Poisson Random Timer
    if (plan.timers.poisson?.enabled) {
        timerElements += `
        <PoissonRandomTimer guiclass="PoissonRandomTimerGui" testclass="PoissonRandomTimer" testname="Poisson Random Timer" enabled="true">
          <stringProp name="ConstantTimer.delay">${plan.timers.poisson.delay || 1000}</stringProp>
          <stringProp name="RandomTimer.range">${plan.timers.poisson.lambda || 500}</stringProp>
        </PoissonRandomTimer>
        <hashTree/>`;
    }
    
    return timerElements;
};

const getCalculationMode = (calculationType) => {
    switch (calculationType) {
        case 'all active threads': return 1;
        case 'all active threads (shared)': return 2;
        case 'all active threads in current thread group': return 3;
        default: return 0; // 'this thread only'
    }
};

const generateCsvDataSet = (plan) => {
    if (!plan.csvEnabled || !plan.csvFilename) return '';
    
    return `
        <CSVDataSet guiclass="TestBeanGUI" testclass="CSVDataSet" testname="CSV Data Set Config" enabled="true">
          <stringProp name="delimiter">${escapeXml(plan.csvDelimiter || ',')}</stringProp>
          <stringProp name="fileEncoding">${escapeXml(plan.csvEncoding || 'UTF-8')}</stringProp>
          <stringProp name="filename">${escapeXml(plan.csvFilename)}</stringProp>
          <boolProp name="ignoreFirstLine">false</boolProp>
          <boolProp name="quotedData">false</boolProp>
          <boolProp name="recycle">${plan.csvRecycle !== false}</boolProp>
          <stringProp name="shareMode">shareMode.all</stringProp>
          <boolProp name="stopThread">true</boolProp>
          <stringProp name="variableNames">${escapeXml(plan.csvVariables || '')}</stringProp>
        </CSVDataSet>
        <hashTree/>`;
};

const generateListeners = (plan) => {
    let listeners = '';
    
    if (plan.listenerResultsTree) {
        listeners += `
        <ResultCollector guiclass="ViewResultsFullVisualizer" testclass="ResultCollector" testname="View Results Tree" enabled="true">
          <boolProp name="ResultCollector.error_logging">false</boolProp>
          <objProp>
            <name>saveConfig</name>
            <value class="SampleSaveConfiguration">
              <time>true</time>
              <latency>true</latency>
              <timestamp>true</timestamp>
              <success>true</success>
              <label>true</label>
              <code>true</code>
              <message>true</message>
              <threadName>true</threadName>
              <dataType>true</dataType>
              <encoding>false</encoding>
              <assertions>true</assertions>
              <subresults>true</subresults>
              <responseData>false</responseData>
              <samplerData>false</samplerData>
              <xml>false</xml>
              <fieldNames>true</fieldNames>
              <responseHeaders>false</responseHeaders>
              <requestHeaders>false</requestHeaders>
              <responseDataOnError>false</responseDataOnError>
              <saveAssertionResultsFailureMessage>true</saveAssertionResultsFailureMessage>
              <assertionsResultsToSave>0</assertionsResultsToSave>
              <bytes>true</bytes>
              <sentBytes>true</sentBytes>
              <url>true</url>
              <threadCounts>true</threadCounts>
              <idleTime>true</idleTime>
              <connectTime>true</connectTime>
            </value>
          </objProp>
          <stringProp name="filename"></stringProp>
        </ResultCollector>
        <hashTree/>`;
    }
    
    if (plan.listenerSummary) {
        listeners += `
        <ResultCollector guiclass="SummaryReport" testclass="ResultCollector" testname="Summary Report" enabled="true">
          <boolProp name="ResultCollector.error_logging">false</boolProp>
          <objProp>
            <name>saveConfig</name>
            <value class="SampleSaveConfiguration">
              <time>true</time>
              <latency>true</latency>
              <timestamp>true</timestamp>
              <success>true</success>
              <label>true</label>
              <code>true</code>
              <message>true</message>
              <threadName>true</threadName>
              <dataType>true</dataType>
              <encoding>false</encoding>
              <assertions>true</assertions>
              <subresults>true</subresults>
              <responseData>false</responseData>
              <samplerData>false</samplerData>
              <xml>false</xml>
              <fieldNames>true</fieldNames>
              <responseHeaders>false</responseHeaders>
              <requestHeaders>false</requestHeaders>
              <responseDataOnError>false</responseDataOnError>
              <saveAssertionResultsFailureMessage>true</saveAssertionResultsFailureMessage>
              <assertionsResultsToSave>0</assertionsResultsToSave>
              <bytes>true</bytes>
              <sentBytes>true</sentBytes>
              <url>true</url>
              <threadCounts>true</threadCounts>
              <idleTime>true</idleTime>
              <connectTime>true</connectTime>
            </value>
          </objProp>
          <stringProp name="filename"></stringProp>
        </ResultCollector>
        <hashTree/>`;
    }
    
    if (plan.listenerAggregate) {
        listeners += `
        <ResultCollector guiclass="StatVisualizer" testclass="ResultCollector" testname="Aggregate Report" enabled="true">
          <boolProp name="ResultCollector.error_logging">false</boolProp>
          <objProp>
            <name>saveConfig</name>
            <value class="SampleSaveConfiguration">
              <time>true</time>
              <latency>true</latency>
              <timestamp>true</timestamp>
              <success>true</success>
              <label>true</label>
              <code>true</code>
              <message>true</message>
              <threadName>true</threadName>
              <dataType>true</dataType>
              <encoding>false</encoding>
              <assertions>true</assertions>
              <subresults>true</subresults>
              <responseData>false</responseData>
              <samplerData>false</samplerData>
              <xml>false</xml>
              <fieldNames>true</fieldNames>
              <responseHeaders>false</responseHeaders>
              <requestHeaders>false</requestHeaders>
              <responseDataOnError>false</responseDataOnError>
              <saveAssertionResultsFailureMessage>true</saveAssertionResultsFailureMessage>
              <assertionsResultsToSave>0</assertionsResultsToSave>
              <bytes>true</bytes>
              <sentBytes>true</sentBytes>
              <url>true</url>
              <threadCounts>true</threadCounts>
              <idleTime>true</idleTime>
              <connectTime>true</connectTime>
            </value>
          </objProp>
          <stringProp name="filename"></stringProp>
        </ResultCollector>
        <hashTree/>`;
    }
    
    return listeners;
};

export const buildJmx = (planName, baseUrl, threads, rampUp, loops, requests, plan = {}) => {
    const base = parseBaseUrl(baseUrl);
    const csvDataSet = generateCsvDataSet(plan);
    const timerElements = generateTimerElements(plan);
    const listenersElements = generateListeners(plan);
    
    const requestsXml = requests
        .map((req) => {
            return buildSampler(req, base, plan.customPort, plan.customPrefix);
        })
        .join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
<jmeterTestPlan version="1.2" properties="5.0" jmeter="5.6.3">
  <hashTree>
    <TestPlan guiclass="TestPlanGui" testclass="TestPlan" testname="${escapeXml(planName)}" enabled="true">
      <stringProp name="TestPlan.comments"></stringProp>
      <boolProp name="TestPlan.functional_mode">false</boolProp>
      <boolProp name="TestPlan.tearDown_on_shutdown">true</boolProp>
      <boolProp name="TestPlan.serialize_threadgroups">false</boolProp>
      <elementProp name="Arguments" elementType="Arguments" guiclass="ArgumentsPanel" testclass="Arguments" testname="User Defined Variables" enabled="true">
        <collectionProp name="Arguments.arguments"/>
      </elementProp>
      <stringProp name="TestPlan.user_define_classpath"></stringProp>
    </TestPlan>
    <hashTree>
      <ThreadGroup guiclass="ThreadGroupGui" testclass="ThreadGroup" testname="Thread Group" enabled="true">
        <stringProp name="ThreadGroup.on_sample_error">continue</stringProp>
        <elementProp name="ThreadGroup.main_controller" elementType="LoopController" guiclass="LoopControlPanel" testclass="LoopController" testname="Loop Controller" enabled="true">
          <boolProp name="LoopController.continue_forever">false</boolProp>
          <stringProp name="LoopController.loops">${loops}</stringProp>
        </elementProp>
        <stringProp name="ThreadGroup.num_threads">${threads}</stringProp>
        <stringProp name="ThreadGroup.ramp_time">${rampUp}</stringProp>
        <boolProp name="ThreadGroup.scheduler">${plan.scheduler || false}</boolProp>
        <stringProp name="ThreadGroup.duration">${plan.scheduler ? (plan.duration || '') : ''}</stringProp>
        <stringProp name="ThreadGroup.delay">${plan.scheduler ? (plan.startupDelay || '') : ''}</stringProp>
      </ThreadGroup>
      <hashTree>
        ${csvDataSet}
        ${requestsXml}
        ${timerElements}
        ${listenersElements}
      </hashTree>
    </hashTree>
  </hashTree>
</jmeterTestPlan>`;
};
