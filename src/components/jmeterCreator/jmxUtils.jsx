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
