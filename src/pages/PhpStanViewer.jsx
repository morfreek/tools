import React, { useState } from 'react';
import ExcelJS from 'exceljs';
import { Button, Form, Table } from 'react-bootstrap';
import { useToast } from '@c/ToastContext';
import { matchesSearch } from '@u/text';

const PhpStanViewer = () => {
    const [data, setData] = useState([]);
    const [filter, setFilter] = useState('');
    const { showToast } = useToast();

    const matches = (item) => matchesSearch(filter, [item.file, item.message]);

    const handleFileChange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        let json;
        try {
            json = JSON.parse(await file.text());
        } catch {
            showToast('error', `"${file.name}" no es un JSON válido de PHPStan`);
            return;
        }
        const errors = json.files
            ? Object.entries(json.files).flatMap(([filePath, fileData]) =>
                fileData.messages.map((msg) => ({
                    file: filePath,
                    message: msg.message,
                    line: msg.line,
                    tip: msg.tip || '',
                }))
            )
            : [];

        setData(errors);
        showToast('success', `${errors.length} errores cargados de "${file.name}"`);
    };

    // Agrupar por archivo
    const groupedData = data.reduce((acc, item) => {
        if (matches(item)) {
            if (!acc[item.file]) acc[item.file] = [];
            acc[item.file].push(item);
        }
        return acc;
    }, {});

    const exportToExcel = async () => {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Errores PHPStan');

        // Configurar columnas
        worksheet.columns = [
            { header: 'Archivo', key: 'file', width: 50 },
            { header: 'Línea', key: 'line', width: 10 },
            { header: 'Mensaje', key: 'message', width: 80 },
            { header: 'Tip', key: 'tip', width: 50 }
        ];

        // Filtrar y agregar datos
        const filteredData = data.filter(matches);

        filteredData.forEach(({ file, line, message, tip }) => {
            worksheet.addRow({
                file,
                line,
                message,
                tip
            });
        });

        // Aplicar estilos al encabezado
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' }
        };

        // Generar buffer y descargar
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { 
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
        });
        
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'errores_phpstan.xlsx';
        link.click();
        URL.revokeObjectURL(url);
    };

    const files = Object.entries(groupedData);
    const visibleCount = files.reduce((n, [, messages]) => n + messages.length, 0);

    return (
        <>
            <div className="titulo-seccion">
                <h2>
                    Visor de errores PHPStan{' '}
                    {data.length > 0 && <span className="sub">{visibleCount} de {data.length} en {files.length} archivos</span>}
                </h2>
                {data.length > 0 && (
                    <Button size="sm" onClick={exportToExcel}>Descargar Excel</Button>
                )}
            </div>

            <div className="panel mb-3">
                <div className="rejilla-form">
                    <Form.Group controlId="phpstan-archivo">
                        <Form.Label>Reporte JSON</Form.Label>
                        <Form.Control type="file" accept=".json" onChange={handleFileChange} />
                        <Form.Text>Generado con <code>phpstan analyse --error-format=json</code>.</Form.Text>
                    </Form.Group>
                    <Form.Group controlId="phpstan-filtro">
                        <Form.Label>Filtrar</Form.Label>
                        <Form.Control
                            type="search"
                            placeholder="Archivo o mensaje"
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                        />
                    </Form.Group>
                </div>
            </div>

            {data.length === 0 ? (
                <div className="vacio">Carga un reporte JSON de PHPStan para ver sus errores.</div>
            ) : files.length === 0 ? (
                <div className="vacio">Ningún error coincide con el filtro.</div>
            ) : (
                files.map(([file, messages]) => (
                    <section key={file} className="mb-3">
                        <h3 className="h6 fw-semibold text-break mb-2">
                            {file} <span className="sub fw-normal">{messages.length}</span>
                        </h3>
                        <div className="panel-tabla phpstan-tabla">
                            <Table hover className="align-middle">
                                <thead>
                                    <tr>
                                        <th style={{ width: '10%' }}>Línea</th>
                                        <th style={{ width: '60%' }}>Mensaje</th>
                                        <th style={{ width: '30%' }}>Tip</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {messages.map((row, i) => (
                                        <tr key={i}>
                                            <td>{row.line}</td>
                                            <td className="text-break">{row.message}</td>
                                            <td className="text-break sub">{row.tip}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </div>
                    </section>
                ))
            )}
        </>
    );
};

export default PhpStanViewer;
