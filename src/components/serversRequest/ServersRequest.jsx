import React, { useState, useEffect } from 'react';
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import { Container, Row, Col, Form, Button, Card, Alert, Badge } from 'react-bootstrap';

const ServersRequest = () => {
    const [templateLoaded, setTemplateLoaded] = useState(false);
    const [templateError, setTemplateError] = useState('');
    const [templateBuffer, setTemplateBuffer] = useState(null);
    const [templateSource, setTemplateSource] = useState('default'); // 'default', 'uploaded'
    const [uploadedFileName, setUploadedFileName] = useState('');
    const [formData, setFormData] = useState({
        'solicitante': 'Ariel Mora',
        'fecha': new Date().toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        }),
        'server': '',
        'descripcion-proyecto': '',
        'instalacion': '',
        'server-relacion': '',
        'vpns': '',
        'clonar_desde': ''
    });

    // Estado separado para checkboxes individuales
    const [checkboxFields, setCheckboxFields] = useState({
        // 'backup_requerido': false,
        // 'monitoreo_activo': false,
        // 'acceso_remoto': false
    });

    // Estado para grupos de radio buttons
    const [radioGroups, setRadioGroups] = useState({
        'tipo_ambiente': '', // testing, desarrollo, produccion, integracion
        'ip_publica': '', // si, no
        // NUEVO: configuración de recursos y sistema operativo
        'configuracion_recursos': '', // baja, media, alta
        'sistema_operativo': '' // windows, linux
    });

    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState('');
    const [customFields, setCustomFields] = useState([]);
    const [newFieldName, setNewFieldName] = useState('');

    // NUEVO: opciones de instalación y selección múltiple
    const INSTALL_OPTIONS = [
        {
            group: 'PHP',
            options: [
                { value: 'php_lts', label: 'PHP LTS' },
                { value: 'php_8_0', label: 'PHP 8.0' },
                { value: 'php_8_1', label: 'PHP 8.1' },
                { value: 'php_8_2', label: 'PHP 8.2' },
                { value: 'php_8_3', label: 'PHP 8.3' }
            ]
        },
        {
            group: 'Node.js',
            options: [
                { value: 'node_lts', label: 'Node.js LTS' },
                { value: 'node_16', label: 'Node.js 16' },
                { value: 'node_18', label: 'Node.js 18' },
                { value: 'node_20', label: 'Node.js 20' },
                { value: 'node_22', label: 'Node.js 22' }
            ]
        },
        {
            group: 'Sistema',
            options: [
                { value: 'git_linux', label: 'Módulo de Git para Linux' },
                { value: 'estructura_base_devel', label: 'Estructura base devel (https://sandbox.ucsc.cl/desarrollo/common/environment-config/base-devel)' }
            ]
        },
        // NUEVO: Base de datos
        {
            group: 'Base de datos',
            options: [
                { value: 'mysql_lts', label: 'MySQL LTS (8.4)' },
                { value: 'mysql_8_4', label: 'MySQL 8.4 LTS' },
                { value: 'mysql_8_0', label: 'MySQL 8.0' },
                { value: 'mariadb_lts', label: 'MariaDB LTS (10.11)' },
                { value: 'mariadb_10_11', label: 'MariaDB 10.11 LTS' },
                { value: 'mariadb_10_6', label: 'MariaDB 10.6 LTS' }
            ]
        }
    ];
    const [selectedInstalaciones, setSelectedInstalaciones] = useState([]);

    const getInstalacionLabel = (value) => {
        for (const group of INSTALL_OPTIONS) {
            const found = group.options.find(o => o.value === value);
            if (found) return found.label;
        }
        return value;
    };

    const handleInstalacionesChange = (e) => {
        const values = Array.from(e.target.selectedOptions).map(o => o.value);
        setSelectedInstalaciones(values);
    };

    // Cargar template al montar el componente
    useEffect(() => {
        loadDefaultTemplate();
    }, []);

    // Función para cargar template desde public
    const loadDefaultTemplate = async () => {
        try {
            setTemplateError('');
            setTemplateSource('default');
            
            const baseUrl = import.meta.env.VITE_BASE_URL || '/tools';
            const templatePath = `${baseUrl}/data/docs/template/formulariosolicitudmaquina.docx`;
            
            const response = await fetch(templatePath);
            
            if (!response.ok) {
                throw new Error(`No se pudo cargar la plantilla: ${response.status} - ${response.statusText}`);
            }
            
            const arrayBuffer = await response.arrayBuffer();
            
            await processTemplateBuffer(arrayBuffer);
            
        } catch (err) {
            setTemplateError(`No se pudo cargar la plantilla por defecto. 
                Error: ${err.message}
                
                Soluciones:
                1. Asegúrate de que el archivo existe en: /var/www/html/private/apps/tools/public/data/docs/template/formulariosolicitudmaquina.docx
                2. Sube tu propia plantilla usando el botón "Subir Plantilla"`);
            setTemplateLoaded(false);
        }
    };

    // Función para cargar template desde archivo local subido por el usuario
    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        try {
            setTemplateError('');
            setTemplateSource('uploaded');
            setUploadedFileName(file.name);
            
            // Verificar que sea un archivo .docx
            if (!file.name.toLowerCase().endsWith('.docx')) {
                throw new Error('El archivo debe ser un documento Word (.docx)');
            }
            
            // Leer el archivo como ArrayBuffer
            const arrayBuffer = await file.arrayBuffer();
            
            await processTemplateBuffer(arrayBuffer);
            
        } catch (err) {
            setTemplateError(`Error al cargar el archivo: ${err.message}`);
            setTemplateLoaded(false);
        }
        
        // Limpiar el input
        event.target.value = '';
    };

    // Función para recargar template (usa la fuente actual)
    const reloadTemplate = async () => {
        if (templateSource === 'uploaded') {
            setTemplateError('Para recargar un archivo subido, selecciona el archivo nuevamente.');
            return;
        }
        await loadDefaultTemplate();
    };

    // Función auxiliar para procesar el buffer de la plantilla
    const processTemplateBuffer = async (arrayBuffer) => {
        if (!arrayBuffer || arrayBuffer.byteLength === 0) {
            throw new Error('La plantilla está vacía o corrupta');
        }

        // Verificar la firma del archivo (magic bytes)
        const uint8Array = new Uint8Array(arrayBuffer);
        const firstBytes = Array.from(uint8Array.slice(0, 4)).map(b => b.toString(16).padStart(2, '0')).join(' ');

        // Verificar si es un archivo ZIP (los .docx son archivos ZIP)
        // ZIP files start with 'PK' (0x50 0x4B)
        if (uint8Array[0] !== 0x50 || uint8Array[1] !== 0x4B) {
            // Convertir los primeros bytes a texto para ver si es HTML o texto plano
            const textDecoder = new TextDecoder();
            const firstChars = textDecoder.decode(uint8Array.slice(0, 100));

            throw new Error(`El archivo no es un documento Word válido. 
                Los archivos .docx deben comenzar con la firma ZIP (PK).
                Firma encontrada: ${firstBytes}
                Posibles causas:
                - El archivo es HTML en lugar de un .docx
                - El archivo está corrupto
                - El servidor está devolviendo una página de error
                - El archivo no es realmente un documento Word
                
                Contenido detectado: ${firstChars.substring(0, 50)}...`);
        }

        // Verificar que es un archivo ZIP válido (los .docx son archivos ZIP)
        let zip;
        try {
            zip = new PizZip(arrayBuffer);
        } catch (zipError) {
            // Información adicional de debugging
            const textSample = new TextDecoder().decode(uint8Array.slice(0, 200));
            
            throw new Error(`El archivo no es un ZIP válido (los .docx son archivos ZIP). 
                Error específico: ${zipError.message}
                
                Información del archivo:
                - Tamaño: ${arrayBuffer.byteLength} bytes
                - Firma: ${firstBytes}
                - Muestra: ${textSample.substring(0, 100)}
                
                Soluciones posibles:
                1. Verificar que el archivo .docx no esté corrupto
                2. Recrear el archivo .docx desde Word
                3. Verificar que el servidor no está devolviendo HTML en lugar del archivo
                4. Comprobar los permisos del archivo en el servidor`);
        }

        // Verificar que contiene los archivos básicos de un documento Word
        try {
            const files = Object.keys(zip.files);
            
            const requiredFiles = ['word/document.xml', '[Content_Types].xml'];
            const missingFiles = requiredFiles.filter(file => !files.includes(file));
            
            if (missingFiles.length > 0) {
                throw new Error(`El archivo no contiene los archivos requeridos de Word: ${missingFiles.join(', ')}`);
            }
        } catch (fileCheckError) {
            throw new Error(`Error verificando estructura del documento: ${fileCheckError.message}`);
        }

        // Intentar crear el documento con Docxtemplater
        try {
            const doc = new Docxtemplater(zip, {
                paragraphLoop: true,
                linebreaks: true,
                errorLogging: true,
                // Evitar romper si faltan variables: retornar vacío
                nullGetter: () => ''
            });
        } catch (docError) {
            throw new Error(`Error al procesar el documento con Docxtemplater: ${docError.message}`);
        }

        setTemplateBuffer(arrayBuffer);
        setTemplateLoaded(true);
    };

    // Función para generar identificador único
    const generateUniqueId = () => {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    };

    const handleInputChange = (key, value) => {
        setFormData(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const handleCheckboxChange = (key, checked) => {
        setCheckboxFields(prev => ({
            ...prev,
            [key]: checked
        }));
    };

    const handleRadioChange = (groupName, value) => {
        setRadioGroups(prev => ({
            ...prev,
            [groupName]: value
        }));
    };

    const generateDocument = async () => {
        if (!templateLoaded || !templateBuffer) {
            setError('La plantilla no está cargada. Intenta recargar la página.');
            return;
        }

        setIsGenerating(true);
        setError('');

        try {
            let zip;
            try {
                zip = new PizZip(templateBuffer);
            } catch (zipError) {
                throw new Error('Error al procesar la plantilla');
            }

            let doc;
            try {
                doc = new Docxtemplater(zip, {
                    paragraphLoop: true,
                    linebreaks: true,
                    errorLogging: false,
                    // Si la plantilla tiene variables no presentes, devolver ''
                    nullGetter: () => ''
                });
            } catch (docError) {
                throw new Error('Error al procesar la plantilla Word: ' + docError.message);
            }

            // Derivar variables de "instalación" (selector múltiple)
            const instalacionLabels = selectedInstalaciones.map(getInstalacionLabel);
            const instalacionLista = instalacionLabels.join(', ');
            const instalacionBullets = instalacionLabels.map(l => `- ${l}`).join('\n');
            const instalacionChecks = {};
            INSTALL_OPTIONS.forEach(group => {
                group.options.forEach(opt => {
                    const sel = selectedInstalaciones.includes(opt.value);
                    instalacionChecks[`instalacion_${opt.value}`] = sel ? '☑' : '☐';
                    instalacionChecks[`instalacion_${opt.value}_checked`] = sel ? 'X' : '';
                });
            });
            // NUEVO: fusionar texto libre + selecciones al campo "instalacion"
            const mergedInstalacion = [String(formData.instalacion || '').trim(), instalacionBullets]
                .filter(Boolean)
                .join('\n');

            // Combinar formData con checkboxes y radio groups procesados
            const templateData = {
                ...formData,
                // Checkboxes individuales
                ...Object.keys(checkboxFields).reduce((acc, key) => {
                    acc[key] = checkboxFields[key] ? '☑' : '☐';
                    acc[`${key}_checked`] = checkboxFields[key] ? 'X' : '';
                    acc[`${key}_text`] = checkboxFields[key] ? 'SÍ' : 'NO';
                    return acc;
                }, {}),
                // Radio groups
                ...Object.keys(radioGroups).reduce((acc, groupName) => {
                    const selectedValue = radioGroups[groupName];
                    const groupOptions = getRadioOptions(groupName);
                    groupOptions.forEach(option => {
                        const isSelected = selectedValue === option.value;
                        acc[`${groupName}_${option.value}`] = isSelected ? '☑' : '☐';
                        acc[`${groupName}_${option.value}_checked`] = isSelected ? 'X' : '';
                    });
                    acc[groupName] = selectedValue;
                    acc[`${groupName}_text`] = groupOptions.find(opt => opt.value === selectedValue)?.label || '';
                    return acc;
                }, {}),
                // Instalación multi-selección
                instalacion_lista: instalacionLista,
                instalacion_bullets: instalacionBullets,
                instalacion_count: selectedInstalaciones.length,
                ...instalacionChecks,
                // NUEVO: sobrescribir "instalacion" con el merge
                instalacion: mergedInstalacion
            };
            console.log(templateData)

            try {
                doc.render(templateData);
            } catch (renderError) {
                if (renderError.message.includes('not found')) {
                    throw new Error('Algunas variables en la plantilla no coinciden con los datos proporcionados');
                }
                throw new Error('Error al procesar las variables: ' + renderError.message);
            }

            let output;
            try {
                output = doc.getZip().generate({
                    type: 'blob',
                    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    compression: 'DEFLATE'
                });
            } catch (generateError) {
                throw new Error('Error al generar el documento final');
            }

            const blob = new Blob([output], {
                type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            });

            if (!blob || blob.size === 0) {
                throw new Error('Error al crear el documento final');
            }

            const serverName = formData.server
                ? formData.server.replace(/[^a-zA-Z0-9\-_]/g, '-')
                : generateUniqueId();

            const fileName = `Formulario Solicitud de Servidores Virtuales-${serverName}.docx`;

            try {
                const url = URL.createObjectURL(blob);
                const enlace = document.createElement('a');
                enlace.href = url;
                enlace.download = fileName;
                enlace.style.display = 'none';
                document.body.appendChild(enlace);
                enlace.click();
                setTimeout(() => {
                    if (document.body.contains(enlace)) {
                        document.body.removeChild(enlace);
                    }
                    URL.revokeObjectURL(url);
                }, 1000);
            } catch (downloadError) {
                throw new Error('Error al descargar el documento');
            }
        } catch (err) {
            setError(err.message || 'Error desconocido al generar el documento');
        } finally {
            setIsGenerating(false);
        }
    };

    const addCustomField = () => {
        if (newFieldName.trim() && !customFields.includes(newFieldName.trim())) {
            const fieldName = newFieldName.trim();
            setCustomFields(prev => [...prev, fieldName]);
            setFormData(prev => ({ ...prev, [fieldName]: '' }));
            setNewFieldName('');
        }
    };

    const removeCustomField = (fieldName) => {
        setCustomFields(prev => prev.filter(field => field !== fieldName));
        setFormData(prev => {
            const newData = { ...prev };
            delete newData[fieldName];
            return newData;
        });
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            addCustomField();
        }
    };

    // Función para obtener el label legible de una clave
    const getFieldLabel = (key) => {
        const labelMap = {
            'solicitante': 'Solicitante',
            'fecha': 'Fecha',
            'server': 'Server',
            'descripcion-proyecto': 'Descripción proyecto',
            'instalacion': 'Instalación',
            'server-relacion': 'Server relación',
            'vpns': 'Vpns',
            'clonar_desde': 'Clonar desde'
        };
        return labelMap[key] || key.charAt(0).toUpperCase() + key.slice(1).replace('-', ' ');
    };

    // Función para obtener el label legible de checkboxes
    const getCheckboxLabel = (key) => {
        const checkboxLabelMap = {
            // 'opcion_a': 'Opción A',
            // 'opcion_b': 'Opción B', 
            // 'opcion_c': 'Opción C',
            // 'backup_requerido': 'Backup requerido',
            // 'monitoreo_activo': 'Monitoreo activo'
        };
        return checkboxLabelMap[key] || key.charAt(0).toUpperCase() + key.slice(1).replace('_', ' ');
    };

    // Función para obtener opciones de radio groups
    const getRadioOptions = (groupName) => {
        const radioOptionsMap = {
            'tipo_ambiente': [
                { value: 'testing', label: 'Testing' },
                { value: 'desarrollo', label: 'Desarrollo' },
                { value: 'integracion', label: 'Integración' },
                { value: 'produccion', label: 'Producción' }
            ],
            'ip_publica': [
                { value: 'si', label: 'Si' },
                { value: 'no', label: 'No' }
            ],
            // NUEVO
            'configuracion_recursos': [
                { value: 'baja', label: 'Baja' },
                { value: 'media', label: 'Media' },
                { value: 'alta', label: 'Alta' }
            ],
            'sistema_operativo': [
                { value: 'windows', label: 'Windows' },
                { value: 'linux', label: 'Linux' }
            ]
        };
        return radioOptionsMap[groupName] || [];
    };

    // Función para obtener el label del grupo
    const getRadioGroupLabel = (groupName) => {
        const groupLabelMap = {
            'tipo_ambiente': 'Tipo de ambiente',
            'ip_publica': 'IP Pública',
            // NUEVO
            'configuracion_recursos': 'Configuración de recursos',
            'sistema_operativo': 'Sistema operativo a utilizar'
        };
        return groupLabelMap[groupName] || groupName;
    };

    // Separar campos predefinidos de campos personalizados
    const predefinedFields = Object.keys(formData).filter(key => !customFields.includes(key));

    return (
        <Container fluid className="mt-4">
            <Row className="mb-3">
                <Col>
                    <h3>Crear solicitud máquinas UPT</h3>

                    {/* Estado de la plantilla */}
                    <Card className="mb-4">
                        <Card.Body className="text-center">
                            <Card.Title>Estado de la plantilla</Card.Title>
                            {templateLoaded ? (
                                <Alert variant="success" className="mb-3">
                                    <strong>✓ Plantilla cargada:</strong> 
                                    {templateSource === 'uploaded' ? uploadedFileName : 'formulariosolicitudmaquina.docx'}
                                    <br />
                                    <small className="text-muted">
                                        Tamaño: {templateBuffer ? `${(templateBuffer.byteLength / 1024).toFixed(1)} KB` : 'Desconocido'}
                                        {templateSource === 'uploaded' && ' (archivo subido)'}
                                        {templateSource === 'default' && ' (desde public)'}
                                    </small>
                                </Alert>
                            ) : templateError ? (
                                <Alert variant="danger" className="mb-3">
                                    <strong>✗ Error al cargar plantilla:</strong>
                                    <div className="mt-2 p-2 bg-light rounded">
                                        <small className="text-danger">{templateError}</small>
                                    </div>
                                    <div className="mt-3">
                                        <Button variant="outline-danger" size="sm" onClick={reloadTemplate} className="me-2">
                                            Intentar recargar
                                        </Button>
                                        <Button 
                                            variant="outline-info" 
                                            size="sm" 
                                            onClick={() => {
                                                const debugInfo = {
                                                    templateBuffer: templateBuffer ? `${templateBuffer.byteLength} bytes` : 'null',
                                                    templateLoaded,
                                                    templateError,
                                                    templateSource,
                                                    baseUrl: import.meta.env.VITE_BASE_URL,
                                                    entorno: import.meta.env.MODE
                                                };
                                                
                                                if (templateBuffer) {
                                                    const uint8Array = new Uint8Array(templateBuffer);
                                                    const firstBytes = Array.from(uint8Array.slice(0, 8)).map(b => b.toString(16).padStart(2, '0')).join(' ');
                                                    const textSample = new TextDecoder().decode(uint8Array.slice(0, 100));
                                                    debugInfo.bufferInfo = {
                                                        tamaño: templateBuffer.byteLength,
                                                        primeros8Bytes: firstBytes,
                                                        muestraTexto: textSample
                                                    };
                                                }
                                                
                                                console.log('=== INFORMACIÓN DE DEBUGGING ===', debugInfo);
                                                alert('Revisa la consola del navegador para ver la información de debugging');
                                            }}
                                        >
                                            Debug Info
                                        </Button>
                                    </div>
                                </Alert>
                            ) : (
                                <Alert variant="info" className="mb-0">
                                    <strong>⏳ Cargando plantilla...</strong>
                                </Alert>
                            )}
                            
                            {/* Sección para subir plantilla personalizada */}
                            <div className="mt-3">
                                <hr />
                                <h6>Plantilla personalizada</h6>
                                <p className="text-muted small mb-3">
                                    Si tienes problemas con la plantilla por defecto, puedes subir tu propia plantilla .docx
                                </p>
                                <Form.Group className="d-flex align-items-center justify-content-center">
                                    <Form.Control
                                        type="file"
                                        accept=".docx"
                                        onChange={handleFileUpload}
                                        className="me-2"
                                        style={{ maxWidth: '300px' }}
                                    />
                                    <Button 
                                        variant="outline-secondary" 
                                        size="sm"
                                        onClick={loadDefaultTemplate}
                                        disabled={templateSource === 'default'}
                                    >
                                        Usar plantilla por defecto
                                    </Button>
                                </Form.Group>
                            </div>
                        </Card.Body>
                    </Card>

                    {/* Instrucciones */}
                    <Card className="mb-4">
                        <Card.Header>
                            <h6 className="mb-0">Instrucciones:</h6>
                        </Card.Header>
                        <Card.Body>
                            <ol className="mb-0">
                                <li>La plantilla <code>formulariosolicitudmaquina.docx</code> se carga desde la carpeta public</li>
                                <li>Completa los campos del formulario según tus necesidades</li>
                                <li>Para radio groups usa variables como: <code>{'{tipo_ambiente_testing}'}</code>, <code>{'{tipo_ambiente_desarrollo}'}</code></li>
                                <li>También puedes usar el valor seleccionado: <code>{'{tipo_ambiente}'}</code> → "testing"</li>
                                <li>Haz clic en "Generar Documento" para descargar el archivo</li>
                                <li>Puedes usar variables nuevas: <code>{'{clonar_desde}'}</code>, <code>{'{instalacion_lista}'}</code>, <code>{'{instalacion_bullets}'}</code></li>
                                <li>Para checks de instalaciones usa: <code>{'{instalacion_php_lts}'}</code>, <code>{'{instalacion_node_20}'}</code> o su versión <code>{'{..._checked}'}</code></li>
                            </ol>
                        </Card.Body>
                    </Card>

                    {/* Sección de formulario - Solo mostrar si la plantilla está cargada */}
                    {templateLoaded && (
                        <Card className="mb-4">
                            <Card.Header>
                                <h5 className="mb-0">Datos para la solicitud</h5>
                            </Card.Header>
                            <Card.Body>
                                <Alert variant="info" className="mb-4">
                                    <small>
                                        Variables de texto: <code>{'{solicitante}'}</code>, checkboxes: <code>{'{backup_requerido}'}</code>, radio groups: <code>{'{tipo_ambiente_testing}'}</code>
                                    </small>
                                </Alert>


                                {/* Grupos de radio buttons */}
                                {Object.keys(radioGroups).length > 0 && (
                                    <>
                                        <h6 className="mb-3">Selección única (Radio Groups)</h6>
                                        <Row className="mb-4">
                                            {Object.keys(radioGroups).map((groupName) => (
                                                <Col key={groupName} xs={12} md={6} lg={4} className="mb-3">
                                                    <Form.Group>
                                                        <Form.Label className="fw-bold">
                                                            {getRadioGroupLabel(groupName)}:
                                                        </Form.Label>
                                                        {getRadioOptions(groupName).map((option) => (
                                                            <Form.Check
                                                                key={option.value}
                                                                type="radio"
                                                                id={`radio-${groupName}-${option.value}`}
                                                                name={groupName}
                                                                label={option.label}
                                                                checked={radioGroups[groupName] === option.value}
                                                                onChange={() => handleRadioChange(groupName, option.value)}
                                                                className="mb-1"
                                                            />
                                                        ))}
                                                        <Form.Text className="text-muted">
                                                            Variables: <code>{'{' + groupName + '_opcion}'}</code> o <code>{'{' + groupName + '}'}</code>
                                                        </Form.Text>
                                                    </Form.Group>
                                                </Col>
                                            ))}
                                        </Row>
                                    </>
                                )}

                                {/* Campos de checkbox individuales - Solo si hay checkboxes */}
                                {Object.keys(checkboxFields).length > 0 && (
                                    <>
                                        <h6 className="mb-3">Opciones múltiples (Checkboxes)</h6>
                                        <Row className="mb-4">
                                            {Object.keys(checkboxFields).map((key) => (
                                                <Col key={key} xs={12} md={6} lg={4} className="mb-3">
                                                    <Form.Group>
                                                        <Form.Check
                                                            type="checkbox"
                                                            id={`checkbox-${key}`}
                                                            label={getCheckboxLabel(key)}
                                                            checked={checkboxFields[key]}
                                                            onChange={(e) => handleCheckboxChange(key, e.target.checked)}
                                                        />
                                                        <Form.Text className="text-muted">
                                                            Variable: <code>{'{' + key + '}'}</code>
                                                        </Form.Text>
                                                    </Form.Group>
                                                </Col>
                                            ))}
                                        </Row>
                                    </>
                                )}

                                {/* Campos de texto */}
                                <h6 className="mb-3">Campos de texto</h6>
                                <Row className="mb-4">
                                    {/* Campos predefinidos */}
                                    {predefinedFields.map((key) => (
                                        <Col key={key} xs={12} md={6} lg={4} className="mb-3">
                                            <Form.Group>
                                                <Form.Label>{getFieldLabel(key)}:</Form.Label>
                                                {key === 'instalacion' ? (
                                                    <>
                                                        <Form.Control
                                                            as="textarea"
                                                            rows={2}
                                                            value={formData[key] || ''}
                                                            onChange={(e) => handleInputChange(key, e.target.value)}
                                                            placeholder={`Ingresa ${getFieldLabel(key).toLowerCase()}`}
                                                        />
                                                        {/* NUEVO: selector múltiple de tecnologías */}
                                                        <Form.Label className="mt-2">Seleccionar tecnologías:</Form.Label>
                                                        <Form.Select
                                                            multiple
                                                            value={selectedInstalaciones}
                                                            onChange={handleInstalacionesChange}
                                                        >
                                                            {INSTALL_OPTIONS.map(group => (
                                                                <optgroup key={group.group} label={group.group}>
                                                                    {group.options.map(opt => (
                                                                        <option key={opt.value} value={opt.value}>
                                                                            {opt.label}
                                                                        </option>
                                                                    ))}
                                                                </optgroup>
                                                            ))}
                                                        </Form.Select>
                                                        <Form.Text className="text-muted">
                                                            Variables: <code>{'{instalacion_lista}'}</code>, <code>{'{instalacion_bullets}'}</code>, checks como <code>{'{instalacion_php_lts}'}</code>
                                                        </Form.Text>
                                                        <div className="mt-2">
                                                            {selectedInstalaciones.map(val => (
                                                                <Badge key={val} bg="secondary" className="me-1">
                                                                    {getInstalacionLabel(val)}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    </>
                                                ) : (
                                                    <Form.Control
                                                        type="text"
                                                        value={formData[key] || ''}
                                                        onChange={(e) => handleInputChange(key, e.target.value)}
                                                        placeholder={`Ingresa ${getFieldLabel(key).toLowerCase()}`}
                                                    />
                                                )}
                                            </Form.Group>
                                        </Col>
                                    ))}

                                    {/* Campos personalizados */}
                                    {customFields.map((fieldName) => (
                                        <Col key={fieldName} xs={12} md={6} lg={4} className="mb-3">
                                            <Form.Group>
                                                <Form.Label className="d-flex justify-content-between align-items-center">
                                                    {getFieldLabel(fieldName)}:
                                                    <Button
                                                        variant="outline-danger"
                                                        size="sm"
                                                        onClick={() => removeCustomField(fieldName)}
                                                        title="Eliminar campo"
                                                        className="ms-2"
                                                    >
                                                        ×
                                                    </Button>
                                                </Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    value={formData[fieldName] || ''}
                                                    onChange={(e) => handleInputChange(fieldName, e.target.value)}
                                                    placeholder={`Ingresa ${getFieldLabel(fieldName).toLowerCase()}`}
                                                />
                                            </Form.Group>
                                        </Col>
                                    ))}
                                </Row>

                                {/* Agregar campos personalizados */}
                                <Card className="mt-4">
                                    <Card.Header>
                                        <h6 className="mb-0">Agregar campo personalizado</h6>
                                    </Card.Header>
                                    <Card.Body>
                                        <Row className="align-items-end">
                                            <Col xs={12} md={8}>
                                                <Form.Group>
                                                    <Form.Control
                                                        type="text"
                                                        value={newFieldName}
                                                        placeholder="Nombre de variable (ej: direccion)"
                                                        onChange={(e) => setNewFieldName(e.target.value)}
                                                        onKeyPress={handleKeyPress}
                                                    />
                                                </Form.Group>
                                            </Col>
                                            <Col xs={12} md={4}>
                                                <Button
                                                    variant="success"
                                                    size="sm"
                                                    onClick={addCustomField}
                                                    disabled={!newFieldName.trim()}
                                                    className="w-100"
                                                >
                                                    Agregar
                                                </Button>
                                            </Col>
                                        </Row>
                                        {customFields.length > 0 && (
                                            <div className="mt-3">
                                                <small className="text-muted">Campos personalizados: </small>
                                                {customFields.map((field, index) => (
                                                    <Badge key={field} bg="secondary" className="me-1">
                                                        {field}
                                                    </Badge>
                                                ))}
                                            </div>
                                        )}
                                    </Card.Body>
                                </Card>

                                {/* Previsualización de variables */}
                                {/* <Card className="mt-4">
                                    <Card.Header>
                                        <h6 className="mb-0">Ejemplo de variables para "Tipo de ambiente"</h6>
                                    </Card.Header>
                                    <Card.Body>
                                        <Alert variant="light" className="mb-0">
                                            <small>
                                                <strong>En tu plantilla Word puedes usar:</strong><br/>
                                                Tipo de ambiente: Testing {'{tipo_ambiente_testing}'} Desarrollo {'{tipo_ambiente_desarrollo}'} Producción {'{tipo_ambiente_produccion}'} Integración {'{tipo_ambiente_integracion}'}<br/>
                                                <strong>Resultado:</strong><br/>
                                                Tipo de ambiente: Testing {radioGroups.tipo_ambiente === 'testing' ? '☑' : '☐'} Desarrollo {radioGroups.tipo_ambiente === 'desarrollo' ? '☑' : '☐'} Producción {radioGroups.tipo_ambiente === 'produccion' ? '☑' : '☐'} Integración {radioGroups.tipo_ambiente === 'integracion' ? '☑' : '☐'}
                                            </small>
                                        </Alert>
                                    </Card.Body>
                                </Card> */}
                            </Card.Body>
                        </Card>
                    )}

                    {/* Mensaje de error */}
                    {error && (
                        <Alert variant="danger" className="mb-4">
                            <Alert.Heading>Error</Alert.Heading>
                            <p className="mb-0">{error}</p>
                        </Alert>
                    )}

                    {/* Botón de generar - Solo habilitado si la plantilla está cargada */}
                    <div className="d-grid mb-4">
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={generateDocument}
                            disabled={!templateLoaded || isGenerating}
                        >
                            {isGenerating ? 'Generando...' : 'Generar Documento'}
                        </Button>
                    </div>
                </Col>
            </Row>
        </Container>
    );
};

export default ServersRequest;
