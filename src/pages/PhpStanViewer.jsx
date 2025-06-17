import React, { useState } from 'react';
import * as XLSX from 'xlsx';

const styles = {
    table: {
        tableLayout: 'fixed',
        width: '100%',
        borderCollapse: 'collapse',
        marginBottom: '2rem',
    },
    thead: {
        display: 'table',
        width: '100%',
        tableLayout: 'fixed',
    },
    tbody: {
        display: 'block',
        maxHeight: '400px',
        overflowY: 'auto',
        width: '100%',
        tableLayout: 'fixed',
    },
    trHead: {
        display: 'table',
        width: '100%',
        tableLayout: 'fixed',
    },
    trBody: {
        display: 'table',
        width: '100%',
        tableLayout: 'fixed',
    },
    th: {
        overflowWrap: 'break-word',
        whiteSpace: 'normal',
        wordWrap: 'break-word',
        borderBottom: '2px solid #dee2e6',
        padding: '0.75rem',
        backgroundColor: '#f1f1f1',
    },
    td: {
        overflowWrap: 'break-word',
        whiteSpace: 'normal',
        wordWrap: 'break-word',
        padding: '0.75rem',
        borderBottom: '1px solid #dee2e6',
    },
    col1: { width: '10%' },
    col2: { width: '60%' },
    col3: { width: '30%' },
    fileTitle: {
        fontWeight: 'bold',
        fontSize: '1.2rem',
        marginTop: '2rem',
        marginBottom: '0.5rem',
    },
};

const PhpStanViewer = () => {
    const [data, setData] = useState([]);
    const [filter, setFilter] = useState('');

    const handleFileChange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const text = await file.text();
        const json = JSON.parse(text);
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
    };

    // Agrupar por archivo
    const groupedData = data.reduce((acc, item) => {
        if (
            item.file.includes(filter) ||
            item.message.toLowerCase().includes(filter.toLowerCase())
        ) {
            if (!acc[item.file]) acc[item.file] = [];
            acc[item.file].push(item);
        }
        return acc;
    }, {});

    const exportToExcel = () => {
        const workbook = XLSX.utils.book_new();

        // Preparamos datos planos con todas las filas y columnas
        const sheetData = data
            .filter(row =>
                row.file.includes(filter) || row.message.toLowerCase().includes(filter.toLowerCase())
            )
            .map(({ file, line, message, tip }) => ({
                Archivo: file,
                Línea: line,
                Mensaje: message,
                Tip: tip,
            }));

        const worksheet = XLSX.utils.json_to_sheet(sheetData);

        XLSX.utils.book_append_sheet(workbook, worksheet, 'Errores PHPStan');

        XLSX.writeFile(workbook, 'errores_phpstan.xlsx');
    };


    return (
        <div className="container mt-4">
            <h3>Visor de Errores PHPStan</h3>

            <div className="mb-3">
                <input
                    type="file"
                    accept=".json"
                    onChange={handleFileChange}
                    className="form-control"
                />
            </div>

            <div className="mb-3">
                <input
                    type="text"
                    className="form-control"
                    placeholder="Filtrar por archivo o mensaje..."
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                />
            </div>

            {data.length > 0 && (
                <div className="mb-3">
                    <button onClick={exportToExcel} className="btn btn-sm btn-success">
                        Descargar Excel
                    </button>
                </div>
            )}

            {Object.entries(groupedData).map(([file, messages], idx) => (
                <div key={idx}>
                    <div style={styles.fileTitle}>{file}</div>
                    <table style={styles.table} className="table table-striped table-bordered table-hover">
                        <thead style={styles.thead}>
                            <tr style={styles.trHead}>
                                <th style={{ ...styles.th, ...styles.col1 }}>Línea</th>
                                <th style={{ ...styles.th, ...styles.col2 }}>Mensaje</th>
                                <th style={{ ...styles.th, ...styles.col3 }}>Tip</th>
                            </tr>
                        </thead>
                        <tbody style={styles.tbody}>
                            {messages.map((row, i) => (
                                <tr style={styles.trBody} key={i}>
                                    <td style={{ ...styles.td, ...styles.col1 }}>{row.line}</td>
                                    <td style={{ ...styles.td, ...styles.col2 }}>{row.message}</td>
                                    <td style={{ ...styles.td, ...styles.col3 }}>{row.tip}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ))}
        </div>
    );
};

export default PhpStanViewer;
