import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { FaPlus, FaFileExcel } from 'react-icons/fa';
import ExcelJS from 'exceljs';
import { Container, ButtonGroup, Button } from 'react-bootstrap';
import { STATUS_OPTIONS } from '@u/Constants';
import api from '@/api';
import { useConfirm } from '@c/ConfirmContext';
import ProjectInfoCard from '@c/info/ProjectInfoCard';
import ProjectReviewModal from '@c/review/ProjectReviewModal';
import ProjectReviewDetailModal from '@c/review/ProjectReviewDetailModal';
import ProjectReviewCards from '@c/review/ProjectReviewCards';
import Breadcrumb from '@c/Breadcrumb';

export default function ProjectReviews() {
    const { id } = useParams();
    const { showConfirm } = useConfirm();
    const [reviews, setReviews] = useState([]);
    const [checklist, setChecklist] = useState([]);
    const [reviewVisible, setReviewVisible] = useState(false);
    const [newReviewVisible, setNewReviewVisible] = useState(false);
    const [form, setForm] = useState({ applied_at: '', results: [] });
    const [review, setReview] = useState(null);

    useEffect(() => {
        fetchReviews();
        fetchChecklist();
    }, []);

    const exportGroupedReviewsToExcel = async (checklist, reviews) => {
        // Función para capitalizar texto
        const capitalize = (str) => {
            if (!str) return '';
            return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
        };

        // Función para convertir HTML a rich text para Excel
        const htmlToRichText = (html) => {
            if (!html) return '';
            
            // Crear un elemento temporal para parsear el HTML
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = html;
            
            const richTextArray = [];
            
            // Función recursiva para procesar nodos y crear rich text
            const processNode = (node) => {
                for (let child of node.childNodes) {
                    if (child.nodeType === Node.TEXT_NODE) {
                        const textContent = child.textContent.trim();
                        if (textContent) {
                            richTextArray.push({
                                text: textContent
                            });
                        }
                    } else if (child.nodeType === Node.ELEMENT_NODE) {
                        const tagName = child.tagName.toLowerCase();
                        
                        if (['p', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tagName)) {
                            processNode(child);
                            richTextArray.push({ text: '\n' });
                        } else if (tagName === 'br') {
                            richTextArray.push({ text: '\n' });
                        } else if (tagName === 'li') {
                            richTextArray.push({ text: '• ' });
                            processNode(child);
                            richTextArray.push({ text: '\n' });
                        } else if (tagName === 'strong' || tagName === 'b') {
                            const beforeLength = richTextArray.length;
                            processNode(child);
                            // Marcar el texto agregado como bold
                            for (let i = beforeLength; i < richTextArray.length; i++) {
                                if (richTextArray[i].text && richTextArray[i].text !== '\n') {
                                    richTextArray[i].font = { bold: true };
                                }
                            }
                        } else if (tagName === 'em' || tagName === 'i') {
                            const beforeLength = richTextArray.length;
                            processNode(child);
                            // Marcar el texto agregado como italic
                            for (let i = beforeLength; i < richTextArray.length; i++) {
                                if (richTextArray[i].text && richTextArray[i].text !== '\n') {
                                    richTextArray[i].font = { italic: true };
                                }
                            }
                        } else {
                            processNode(child);
                        }
                    }
                }
            };
            
            processNode(tempDiv);
            
            // Limpiar elementos vacíos y múltiples saltos de línea
            const cleanedArray = richTextArray.filter(item => item.text);
            
            // Combinar múltiples saltos de línea consecutivos
            const finalArray = [];
            let consecutiveNewlines = 0;
            
            for (const item of cleanedArray) {
                if (item.text === '\n') {
                    consecutiveNewlines++;
                    if (consecutiveNewlines <= 2) {
                        finalArray.push(item);
                    }
                } else {
                    consecutiveNewlines = 0;
                    finalArray.push(item);
                }
            }
            
            return finalArray.length > 0 ? { richText: finalArray } : '';
        };

        // Definir colores para cada estado
        const getStatusColor = (status) => {
            const colors = {
                'bien': 'FFC8E6C9',      // Verde pastel
                'regular': 'FFFFF9C4',   // Amarillo pastel
                'deficiente': 'FFFFCDD2', // Rojo pastel
                'no aplica': 'FFF5F5F5'    // Gris pastel
            };
            return colors[status?.toLowerCase()] || 'FFFFFFFF';
        };

        // Crear nuevo workbook
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Revisiones');

        // Obtener fechas únicas ordenadas
        const dates = reviews.map(r => r.applied_at).sort();

        // Configurar cabeceras
        worksheet.addRow(['Aspecto', 'Punto', ...dates.flatMap(date => [date, ''])]);
        worksheet.addRow(['', '', ...dates.flatMap(() => ['Estado', 'Observación'])]);

        // Mergear celdas de fechas en la primera fila de cabecera
        dates.forEach((date, index) => {
            const startCol = 3 + (index * 2); // Columna donde inicia la fecha
            const endCol = startCol + 1;      // Columna siguiente (vacía)
            worksheet.mergeCells(1, startCol, 1, endCol);
        });

        // Agregar fila de notas generales
        worksheet.addRow(['NOTAS GENERALES', '', ...dates.flatMap(date => {
            const review = reviews.find(r => r.applied_at === date);
            const htmlNote = review?.note || '';
            const richTextNote = htmlToRichText(htmlNote);
            return [richTextNote, ''];
        })]);

        // Mergear celdas de notas generales para cada fecha
        dates.forEach((date, index) => {
            const startCol = 3 + (index * 2); // Columna donde inicia la nota
            const endCol = startCol + 1;      // Columna siguiente (vacía)
            worksheet.mergeCells(3, startCol, 3, endCol); // Fila 3 es donde están las notas
            
            // Configurar alineación para las notas mergeadas
            const mergedNoteCell = worksheet.getCell(3, startCol);
            mergedNoteCell.alignment = { 
                horizontal: 'left', 
                vertical: 'top',
                wrapText: true 
            };
            
            // Establecer altura mínima para la fila de notas
            worksheet.getRow(3).height = 60;
        });

        // Agregar fila separadora
        worksheet.addRow(['', '', ...dates.flatMap(() => ['', ''])]);

        // Agregar datos de cada punto
        checklist.forEach(aspect => {
            aspect.points.forEach(point => {
                const rowData = [aspect.name, point.name];

                dates.forEach(date => {
                    const review = reviews.find(r => r.applied_at === date);
                    const result = review?.results.find(r => r.point_id === point.id) || {};

                    rowData.push(capitalize(result.status) || '');
                    rowData.push(result.observation || '');
                });

                worksheet.addRow(rowData);
            });
        });

        // Configurar ancho de columnas
        worksheet.getColumn(1).width = 20; // Aspecto
        worksheet.getColumn(2).width = 30; // Punto

        // Para cada fecha, configurar columnas de Estado y Observación
        dates.forEach((date, index) => {
            const baseCol = 3 + (index * 2);
            worksheet.getColumn(baseCol).width = 12;     // Estado
            worksheet.getColumn(baseCol + 1).width = 35; // Observación
        });

        // Aplicar estilos a todas las celdas
        worksheet.eachRow((row, rowNumber) => {
            row.eachCell((cell, colNumber) => {
                // Bordes para todas las celdas
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };

                // Alineación
                cell.alignment = { 
                    vertical: 'top', 
                    wrapText: true 
                };
            });
        });

        // Aplicar colores a las celdas de estado
        let currentRow = 5; // Comenzar después de las cabeceras y notas
        checklist.forEach(aspect => {
            aspect.points.forEach(point => {
                let currentCol = 3; // Comenzar en la tercera columna

                dates.forEach(date => {
                    const review = reviews.find(r => r.applied_at === date);
                    const result = review?.results.find(r => r.point_id === point.id) || {};

                    if (result.status) {
                        const statusCell = worksheet.getCell(currentRow, currentCol);
                        const color = getStatusColor(result.status);
                        
                        statusCell.fill = {
                            type: 'pattern',
                            pattern: 'solid',
                            fgColor: { argb: color }
                        };
                    }

                    currentCol += 2; // Saltar a la siguiente fecha
                });

                currentRow++;
            });
        });

        // Mergear celdas de aspectos en la columna A
        let aspectStartRow = 5; // Comenzar después de las cabeceras y notas
        checklist.forEach(aspect => {
            const pointsCount = aspect.points.length;
            
            if (pointsCount > 1) {
                // Solo mergear si hay más de un punto en el aspecto
                const aspectEndRow = aspectStartRow + pointsCount - 1;
                worksheet.mergeCells(aspectStartRow, 1, aspectEndRow, 1);
                
                // Centrar verticalmente el texto del aspecto
                const aspectCell = worksheet.getCell(aspectStartRow, 1);
                aspectCell.alignment = {
                    vertical: 'top',
                    wrapText: true
                };
            }
            
            aspectStartRow += pointsCount; // Mover al siguiente aspecto
        });

        // Generar el archivo y descargarlo
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { 
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
        });

        // Crear enlace de descarga
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'revisiones_tecnicas.xlsx';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    };

    const fetchReviews = async () => {
        const res = await api.get(`/projects/${id}/reviews`);
        setReviews(res.data);
    };

    const fetchChecklist = async () => {
        const res = await api.get(`/checklist`);
        setChecklist(res.data);
    };

    const startNewReview = () => {
        const lastReview = reviews[0];
        const lastResults = lastReview?.results || [];

        const results = checklist.flatMap(aspect =>
            aspect.points.map(point => {
                const previous = lastResults.find(r => r.point_id === point.id);
                return {
                    point_id: point.id,
                    status: STATUS_OPTIONS.includes(previous?.status) ? previous.status : '',
                    observation: previous?.observation || ''
                };
            })
        );

        setForm({
            applied_at: new Date().toISOString().split('T')[0],
            results,
            general_notes: '' // Add this line to initialize general_notes
        });
        setNewReviewVisible(true);
    };

    const saveReview = async () => {
        await api.post(`/projects/${id}/reviews`, form);
        setNewReviewVisible(false);
        fetchReviews();
    };

    const deleteReview = async (reviewId) => {
        showConfirm({
            title: 'Eliminar Revisión',
            message: '¿Estás seguro de que deseas eliminar esta revisión? Esta acción no se puede deshacer.',
            confirmText: 'Eliminar',
            cancelText: 'Cancelar',
            confirmButtonClass: 'btn-danger',
            onConfirm: async () => {
                await api.delete(`/projects/${id}/reviews`, { data: { reviewId } });
                fetchReviews();
            }
        });
    };

    const handleViewDetail = (review) => {
        setReview(review);
        setReviewVisible(true);
    };

    return (
        <Container fluid className="mt-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <Breadcrumb />

                <ButtonGroup>
                    <Button
                        variant="success"
                        size="sm"
                        className="d-inline-flex align-items-center"
                        onClick={startNewReview}
                    >
                        <FaPlus className="me-2" />Revisión
                    </Button>
                    <Button
                        variant="outline-success"
                        size="sm"
                        className="d-inline-flex align-items-center"
                        onClick={() => exportGroupedReviewsToExcel(checklist, reviews)}
                    >
                        <FaFileExcel />
                    </Button>
                </ButtonGroup>
            </div>

            <ProjectInfoCard id={id} />

            {reviews.length === 0 ? (
                <p>No hay revisiones</p>
            ) : (
                <ProjectReviewCards 
                    reviews={reviews} 
                    startReview={handleViewDetail}
                    deleteReview={deleteReview}
                />
            )}

            <ProjectReviewDetailModal
                visible={reviewVisible}
                checklist={checklist}
                review={review}
                onClose={() => setReviewVisible(false)}
            />

            <ProjectReviewModal
                visible={newReviewVisible}
                checklist={checklist}
                form={form}
                setForm={setForm}
                onClose={() => setNewReviewVisible(false)}
                onSave={saveReview}
            />
        </Container>
    );
}
