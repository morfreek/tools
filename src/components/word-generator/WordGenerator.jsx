import React, { useState } from 'react';
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import { Container, Row, Col, Form, Button, Card, Alert, Badge } from 'react-bootstrap';

const WordGenerator = () => {
    const [templateFile, setTemplateFile] = useState(null);
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
        'vpns': ''
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
        'ip_publica': '', // testing, desarrollo, produccion, integracion
    });

    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState('');
    const [customFields, setCustomFields] = useState([]);
    const [newFieldName, setNewFieldName] = useState('');

    // Función para generar identificador único
    const generateUniqueId = () => {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    };

    const handleTemplateUpload = (event) => {
        const file = event.target.files[0];

        if (!file) {
            setError('No se seleccionó ningún archivo');
            return;
        }

        // Validar tipo de archivo
        if (file.type !== 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            setError('Por favor selecciona un archivo .docx válido');
            return;
        }

        // Validar tamaño de archivo (máximo 10MB)
        if (file.size > 10 * 1024 * 1024) {
            setError('El archivo es demasiado grande. Máximo 10MB permitido');
            return;
        }

        // Limpiar errores previos
        setError('');
        setTemplateFile(file);
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
        if (!templateFile) {
            setError('Por favor selecciona una plantilla primero');
            return;
        }

        setIsGenerating(true);
        setError('');

        try {
            // Verificar que el archivo sigue siendo accesible
            if (!templateFile.size || templateFile.size === 0) {
                throw new Error('El archivo seleccionado no es válido o está vacío');
            }

            // Leer el archivo con mejor manejo de errores
            let arrayBuffer;
            try {
                arrayBuffer = await templateFile.arrayBuffer();
            } catch (fileError) {
                throw new Error('No se pudo leer el archivo. Intenta seleccionarlo nuevamente');
            }

            if (!arrayBuffer || arrayBuffer.byteLength === 0) {
                throw new Error('El archivo está vacío o corrupto');
            }

            let zip;
            try {
                zip = new PizZip(arrayBuffer);
            } catch (zipError) {
                throw new Error('El archivo no es un documento Word válido');
            }

            let doc;
            try {
                doc = new Docxtemplater(zip, {
                    paragraphLoop: true,
                    linebreaks: true,
                    errorLogging: false
                });
            } catch (docError) {
                throw new Error('Error al procesar la plantilla Word: ' + docError.message);
            }

            // Combinar formData con checkboxes y radio groups procesados
            const templateData = {
                ...formData,
                // Procesar checkboxes individuales
                ...Object.keys(checkboxFields).reduce((acc, key) => {
                    acc[key] = checkboxFields[key] ? '☑' : '☐';
                    acc[`${key}_checked`] = checkboxFields[key] ? 'X' : '';
                    acc[`${key}_text`] = checkboxFields[key] ? 'SÍ' : 'NO';
                    return acc;
                }, {}),
                // Procesar radio groups
                ...Object.keys(radioGroups).reduce((acc, groupName) => {
                    const selectedValue = radioGroups[groupName];

                    // Para cada grupo, crear variables para cada opción
                    const groupOptions = getRadioOptions(groupName);
                    groupOptions.forEach(option => {
                        const isSelected = selectedValue === option.value;
                        acc[`${groupName}_${option.value}`] = isSelected ? '☑' : '☐';
                        acc[`${groupName}_${option.value}_checked`] = isSelected ? 'X' : '';
                    });

                    // También crear una variable con el valor seleccionado
                    acc[groupName] = selectedValue;
                    acc[`${groupName}_text`] = groupOptions.find(opt => opt.value === selectedValue)?.label || '';

                    return acc;
                }, {})
            };

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

            // Verificar que el blob se creó correctamente
            if (!blob || blob.size === 0) {
                throw new Error('Error al crear el documento final');
            }

            // Obtener el nombre base del archivo cargado (sin extensión)
            const templateBaseName = templateFile.name.replace(/\.[^/.]+$/, "");

            // Crear nombre del archivo con plantilla base y servidor o identificador único
            const serverName = formData.server ?
                formData.server.replace(/[^a-zA-Z0-9\-_]/g, '-') :
                generateUniqueId();

            const fileName = `${templateBaseName}-${serverName}.docx`;

            // Descargar el archivo
            try {
                const url = URL.createObjectURL(blob);
                const enlace = document.createElement('a');
                enlace.href = url;
                enlace.download = fileName;
                enlace.style.display = 'none';

                document.body.appendChild(enlace);
                enlace.click();

                // Limpiar recursos después de un breve delay
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
            console.error('Error detallado:', err);
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
            'vpns': 'Vpns'
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
            ]
        };
        return radioOptionsMap[groupName] || [];
    };

    // Función para obtener el label del grupo
    const getRadioGroupLabel = (groupName) => {
        const groupLabelMap = {
            'tipo_ambiente': 'Tipo de ambiente',
            'ip_publica': 'IP Pública'
        };
        return groupLabelMap[groupName] || groupName;
    };

    // Separar campos predefinidos de campos personalizados
    const predefinedFields = Object.keys(formData).filter(key => !customFields.includes(key));

    return (
        <Container fluid className="mt-4">
            <Row className="mb-3">
                <Col>
                    <h2 className="text-center mb-4">Crear solicitud máquinas UPS</h2>

                    {/* Sección de carga de plantilla */}
                    <Card className="mb-4">
                        <Card.Body className="text-center">
                            <Card.Title>Seleccionar plantilla (.docx):</Card.Title>
                            <Form.Group>
                                <Form.Control
                                    type="file"
                                    accept=".docx"
                                    onChange={handleTemplateUpload}
                                    className="mb-3"
                                    key={templateFile ? templateFile.name : 'empty'} // Force re-render
                                />
                                <Form.Text className="text-muted">
                                    Archivo máximo: 10MB. Solo archivos .docx
                                </Form.Text>
                                {templateFile && (
                                    <Alert variant="success" className="mb-0 mt-2">
                                        <strong>Plantilla cargada:</strong> {templateFile.name} ({(templateFile.size / 1024).toFixed(1)} KB)
                                    </Alert>
                                )}
                            </Form.Group>
                        </Card.Body>
                    </Card>

                    {/* Instrucciones actualizadas */}
                    <Card className="mb-4">
                        <Card.Header>
                            <h6 className="mb-0">Instrucciones:</h6>
                        </Card.Header>
                        <Card.Body>
                            <ol className="mb-0">
                                <li>Crea una plantilla Word (.docx) con variables como {Object.keys(formData).slice(0, 3).map(key => `{${key}}`).join(', ')}</li>
                                <li>Para checkboxes usa: <code>{'{backup_requerido}'}</code> (☑/☐)</li>
                                <li>Para radio groups usa: <code>{'{tipo_ambiente_testing}'}</code>, <code>{'{tipo_ambiente_desarrollo}'}</code>, etc.</li>
                                <li>O usa el valor seleccionado: <code>{'{tipo_ambiente}'}</code> → "testing", <code>{'{tipo_ambiente_text}'}</code> → "Testing"</li>
                                <li>Sube la plantilla, completa los datos y genera el documento</li>
                            </ol>
                        </Card.Body>
                    </Card>

                    {/* Sección de formulario */}
                    {templateFile && (
                        <Card className="mb-4">
                            <Card.Header>
                                <h5 className="mb-0">Datos para reemplazar en la plantilla</h5>
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
                                                    <Form.Control
                                                        as="textarea"
                                                        rows={1}
                                                        value={formData[key] || ''}
                                                        onChange={(e) => handleInputChange(key, e.target.value)}
                                                        placeholder={`Ingresa ${getFieldLabel(key).toLowerCase()}`}
                                                    />
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

                    {/* Mensaje de error mejorado */}
                    {error && (
                        <Alert variant="danger" className="mb-4">
                            <Alert.Heading>Error</Alert.Heading>
                            <p className="mb-2">{error}</p>
                            <hr />
                            <p className="mb-0">
                                <small>
                                    Si el problema persiste:
                                    <br />• Verifica que el archivo no esté abierto en otra aplicación
                                    <br />• Intenta seleccionar el archivo nuevamente
                                    <br />• Asegúrate de que el archivo no esté corrupto
                                </small>
                            </p>
                        </Alert>
                    )}

                    {/* Botón de generar */}
                    <div className="d-grid mb-4">
                        <Button
                            variant="primary"
                            size="lg"
                            onClick={generateDocument}
                            disabled={!templateFile || isGenerating}
                        >
                            {isGenerating ? 'Generando...' : 'Generar Documento'}
                        </Button>
                    </div>
                </Col>
            </Row>
        </Container>
    );
};

export default WordGenerator;
