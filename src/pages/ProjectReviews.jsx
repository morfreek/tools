import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { FaPlus, FaFileExcel } from 'react-icons/fa';
import { ButtonGroup, Button } from 'react-bootstrap';
import { STATUS_OPTIONS } from '@u/Constants';
import { listReviews, getChecklist, createReview, deleteReview as removeReview } from '@/services/reviews.service';
import { exportReviewsExcel } from '@u/exportReviewsExcel';
import { useConfirm } from '@c/ConfirmContext';
import ProjectReviewModal from '@c/review/ProjectReviewModal';
import ProjectReviewDetailModal from '@c/review/ProjectReviewDetailModal';
import ProjectReviewCards from '@c/review/ProjectReviewCards';
import ProjectPageLayout from '@c/layout/ProjectPageLayout';

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

    const fetchReviews = async () => {
        setReviews(await listReviews(id));
    };

    const fetchChecklist = async () => {
        setChecklist(await getChecklist());
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
            general_notes: ''
        });
        setNewReviewVisible(true);
    };

    const saveReview = async () => {
        await createReview(id, form);
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
                await removeReview(id, reviewId);
                fetchReviews();
            }
        });
    };

    const handleViewDetail = (review) => {
        setReview(review);
        setReviewVisible(true);
    };

    return (
        <ProjectPageLayout
            actions={(
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
                        title="Exportar a Excel"
                        onClick={() => exportReviewsExcel(checklist, reviews)}
                    >
                        <FaFileExcel />
                    </Button>
                </ButtonGroup>
            )}
        >
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
        </ProjectPageLayout>
    );
}
