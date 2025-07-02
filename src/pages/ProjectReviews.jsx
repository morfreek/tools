import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { FaPlus, FaFileExcel } from 'react-icons/fa';
import * as XLSX from 'xlsx';
import { Container, ButtonGroup, Button } from 'react-bootstrap';
import { STATUS_OPTIONS } from '@/utils/Constants';
import api from '@/api';
import ProjectInfoCard from '@/components/ProjectInfoCard';
import ProjectReviewModal from '@/components/ProjectReviewModal';
import ProjectReviewDetailModal from '@/components/ProjectReviewDetailModal';
import ProjectReviewCards from '@/components/ProjectReviewCards';
import Breadcrumb from '@/components/Breadcrumb';

export default function ProjectReviews() {
    const { id } = useParams();
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

    const exportGroupedReviewsToExcel = (checklist, reviews) => {
        // Obtener fechas únicas ordenadas
        const dates = reviews.map(r => r.applied_at).sort();

        // Crear cabecera
        const headerRow1 = ['Aspecto', 'Punto', ...dates.flatMap(date => [date, ''])];
        const headerRow2 = ['', '', ...dates.flatMap(() => ['Estado', 'Observación'])];

        const data = [headerRow1, headerRow2];

        // Crear mapa de resultados por punto
        checklist.forEach(aspect => {
            aspect.points.forEach(point => {
                const row = [aspect.name, point.name];

                dates.forEach(date => {
                    const review = reviews.find(r => r.applied_at === date);
                    const result = review?.results.find(r => r.point_id === point.id) || {};

                    row.push(result.status || '');
                    row.push(result.observation || '');
                });

                data.push(row);
            });
        });

        // Crear la hoja de cálculo
        const worksheet = XLSX.utils.aoa_to_sheet(data);

        // Combinar celdas de fechas en la primera fila
        let col = 2; // A1 -> Aspecto, B1 -> Punto
        dates.forEach(() => {
            const start = XLSX.utils.encode_cell({ r: 0, c: col });
            const end = XLSX.utils.encode_cell({ r: 0, c: col + 1 });
            worksheet['!merges'] = worksheet['!merges'] || [];
            worksheet['!merges'].push({ s: XLSX.utils.decode_cell(start), e: XLSX.utils.decode_cell(end) });
            col += 2;
        });

        // Crear el libro y exportar
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Revisiones');

        XLSX.writeFile(workbook, 'revisiones_tecnicas.xlsx');
    }

    const fetchReviews = async () => {
        const res = await api.get(`/projects/${id}/reviews`);
        setReviews(res.data);
    };

    const fetchChecklist = async () => {
        const res = await api.get(`/checklist`);
        setChecklist(res.data);
    };

    const startNewReview = () => {
        const lastReview = reviews[reviews.length - 1];
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

        setForm({ applied_at: new Date().toISOString().split('T')[0], results });
        setNewReviewVisible(true);
    };

    const saveReview = async () => {
        await api.post(`/projects/${id}/reviews`, form);
        setNewReviewVisible(false);
        fetchReviews();
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
                <ProjectReviewCards reviews={reviews} startReview={handleViewDetail} />
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
