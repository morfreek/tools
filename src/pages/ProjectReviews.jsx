import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { FaPlus, FaFileExcel } from 'react-icons/fa';
import { Button, Card } from 'react-bootstrap';
import { STATUS_OPTIONS } from '@u/Constants';
import { listReviews, getChecklist, createReview, deleteReview as removeReview } from '@/services/reviews.service';
import { exportReviewsExcel } from '@u/exportReviewsExcel';
import { useDialog } from '@c/DialogProvider';
import { useToast } from '@c/ToastContext';
import ProjectReviewModal from '@c/review/ProjectReviewModal';
import ProjectReviewDetailModal from '@c/review/ProjectReviewDetailModal';
import ProjectReviewCards from '@c/review/ProjectReviewCards';
import ProjectPageLayout from '@c/layout/ProjectPageLayout';

export default function ProjectReviews() {
    const { id } = useParams();
    const dialog = useDialog();
    const { showToast } = useToast();
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
        // El checklist se precarga con la última revisión que lo evaluó (no con la última a secas)
        const lastEvaluated = reviews.find((r) => r.results?.some((res) => STATUS_OPTIONS.includes(res.status)));
        const lastResults = lastEvaluated?.results || [];

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
            general_notes: '',
            evaluateChecklist: false,
            results,
        });
        setNewReviewVisible(true);
    };

    const saveReview = async () => {
        try {
            await createReview(id, {
                applied_at: form.applied_at,
                general_notes: form.general_notes,
                results: form.evaluateChecklist ? form.results : [],
            });
            showToast('success', 'Revisión guardada');
            setNewReviewVisible(false);
            fetchReviews();
        } catch (err) {
            showToast('error', err.response?.data?.error || 'Error al guardar la revisión');
        }
    };

    const deleteReview = async (reviewId) => {
        const target = reviews.find((r) => r.id === reviewId);
        const date = target ? new Date(`${target.applied_at}T00:00:00`).toLocaleDateString('es-CL') : '';
        const ok = await dialog.confirm({
            title: 'Eliminar revisión',
            message: `¿Eliminar la revisión${date ? ` del ${date}` : ''}? Esta acción no se puede deshacer.`,
            acceptText: 'Eliminar',
            danger: true,
        });
        if (!ok) return;

        try {
            await removeReview(id, reviewId);
            showToast('success', 'Revisión eliminada');
            fetchReviews();
        } catch {
            showToast('error', 'Error al eliminar la revisión');
        }
    };

    const handleViewDetail = (review) => {
        setReview(review);
        setReviewVisible(true);
    };

    return (
        <ProjectPageLayout>
            <Card>
                <Card.Header className="d-flex flex-wrap justify-content-between align-items-center gap-2">
                    <h2 className="h6 fw-semibold mb-0">Revisiones <span className="sub fw-normal">{reviews.length}</span></h2>
                    <div className="d-flex gap-2">
                        <Button
                            variant="outline-secondary"
                            size="sm"
                            className="d-inline-flex align-items-center"
                            onClick={() => exportReviewsExcel(checklist, reviews)}
                            disabled={reviews.length === 0}
                        >
                            <FaFileExcel className="me-2" />Exportar Excel
                        </Button>
                        <Button
                            size="sm"
                            className="d-inline-flex align-items-center"
                            onClick={startNewReview}
                        >
                            <FaPlus className="me-2" />Nueva revisión
                        </Button>
                    </div>
                </Card.Header>
                <Card.Body>
                    {reviews.length === 0 ? (
                        <div className="vacio">Este proyecto aún no tiene revisiones. Crea la primera con «Nueva revisión».</div>
                    ) : (
                        <ProjectReviewCards
                            reviews={reviews}
                            startReview={handleViewDetail}
                            deleteReview={deleteReview}
                        />
                    )}
                </Card.Body>
            </Card>

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
