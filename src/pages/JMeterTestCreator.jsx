import React, { useMemo, useState } from 'react';
import { Container, Alert } from 'react-bootstrap';
import { FaInfoCircle, FaLightbulb } from 'react-icons/fa';
import TabNavigation from '@c/jmeterCreator/TabNavigation';
import Preview from '@c/jmeterCreator/Preview';
import { buildJmx, createDefaultRequest } from '@c/jmeterCreator/jmxUtils';

const JMeterTestCreator = () => {
    const [plan, setPlan] = useState({
        planName: '',
        baseUrl: '',
        customPort: '',
        customPrefix: '',
        threads: 10,
        rampUp: 10,
        loops: -1,
        scheduler: true,
        duration: 60,
        startupDelay: 0,
        csvEnabled: false,
        csvFilename: '',
        csvVariables: '',
        csvDelimiter: ',',
        csvEncoding: 'UTF-8',
        csvRecycle: true,
        timers: {
            uniform: { enabled: true, delay: 500, range: 1000 },
            constant: { enabled: false, delay: 1000 },
            gaussian: { enabled: false, delay: 1000, deviation: 500 },
            constantThroughput: { enabled: true, target: 1000, calculation: 'this thread only' },
            poisson: { enabled: false, delay: 1000, lambda: 500 }
        },
        listenerResultsTree: true,
        listenerSummary: true,
        listenerAggregate: true,
        listenerGraph: false,
        listenerFileOutput: false,
        listenerFilename: '',
        listenerCsvOutput: true
    });
    const [requests, setRequests] = useState([]);
    const [showPreview, setShowPreview] = useState(false);

    // Sanea cada request removiendo o vaciando secciones con switch desactivado.
    const sanitizeRequest = (req) => {
        const clean = { ...req };
        Object.entries(clean).forEach(([key, val]) => {
            // Caso: objeto con { enabled: false } -> eliminar la sección
            if (val && typeof val === 'object' && !Array.isArray(val) && 'enabled' in val && val.enabled === false) {
                delete clean[key];
                return;
            }
            // Caso: arreglo con flag paralelo "<key>Enabled" -> vaciar si es false
            const flagKey = `${key}Enabled`;
            if (Array.isArray(val) && flagKey in clean && clean[flagKey] === false) {
                clean[key] = [];
                return;
            }
            // Caso: arreglo de objetos con { enabled: false } -> filtrar los desactivados
            if (Array.isArray(val)) {
                clean[key] = val.filter(
                    (item) => !(item && typeof item === 'object' && 'enabled' in item && item.enabled === false)
                );
            }
        });
        return clean;
    };

    const sanitizedRequests = useMemo(() => requests.map(sanitizeRequest), [requests]);

    const jmx = useMemo(
        () => buildJmx(plan.planName, plan.baseUrl, plan.threads, plan.rampUp, plan.loops, sanitizedRequests, plan),
        [plan, sanitizedRequests]
    );

    const downloadJmx = () => {
        const blob = new Blob([jmx], { type: 'application/xml' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `${plan.planName.replace(/\s+/g, '_')}.jmx`;
        document.body.appendChild(a);
        a.click();
        URL.revokeObjectURL(a.href);
        a.remove();
    };

    const handlePlanChange = (field, value) => setPlan((p) => ({ ...p, [field]: value }));

    const updateReq = (idx, patch) => {
        setRequests((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
    };
    const addReq = () => setRequests((prev) => [...prev, createDefaultRequest(prev.length + 1)]);
    const delReq = (idx) => setRequests((prev) => prev.filter((_, i) => i !== idx));
    const dupReq = (idx) =>
        setRequests((prev) => {
            const copy = { 
                ...prev[idx], 
                name: `${prev[idx].name} (copy)`,
                id: Date.now() + Math.random() // Nuevo ID único para la copia
            };
            return [...prev.slice(0, idx + 1), copy, ...prev.slice(idx + 1)];
        });

    return (
        <Container fluid className="mt-4">
            <div className="d-flex align-items-center gap-2 mb-3">
                <h3 className="mb-0">JMeter Test Creator</h3>
                <FaInfoCircle className="text-muted" style={{ fontSize: '1.25rem' }} />
            </div>
            
            <Alert variant="info" className="mb-4">
                <Alert.Heading className="h6 mb-2">
                    <FaLightbulb className="me-1" />
                    ¿Cómo usar esta herramienta?
                </Alert.Heading>
                <p className="mb-2 small">
                    Esta herramienta te permite crear archivos JMX completos para JMeter:
                </p>
                <ol className="mb-0 small">
                    <li>Configura <strong>General</strong>: nombre del plan y URL base</li>
                    <li>Ajusta <strong>Threads</strong>: usuarios concurrentes y duración</li>
                    <li>Añade <strong>Peticiones HTTP</strong> con headers y parámetros</li>
                    <li>Opcional: configura <strong>CSV</strong>, <strong>Temporizadores</strong> y <strong>Listeners</strong></li>
                    <li>Genera y descarga el archivo <strong>.jmx</strong> completo</li>
                </ol>
            </Alert>

            <TabNavigation 
                value={plan} 
                onChange={handlePlanChange}
                requests={requests}
                onRequestAdd={addReq}
                onRequestDelete={delReq}
                onRequestDuplicate={dupReq}
                onRequestChange={updateReq}
                onOpenPreview={() => setShowPreview(true)}
            />

            <Preview
                show={showPreview}
                onClose={() => setShowPreview(false)}
                jmx={jmx}
                onDownload={downloadJmx}
                onCopyXml={() => navigator.clipboard.writeText(jmx)}
            />
        </Container>
    );
};

export default JMeterTestCreator;
