import React from 'react';
import { FaBan } from 'react-icons/fa';
import StatusBadge from './StatusBadge'; // ajusta la ruta según tu estructura

export default function ProjectReviewDetailModal({ visible, checklist, review, onClose }) {
    if (!visible) return null;
    return (
        <>
            {/* Overlay (fondo oscuro) */}
            <div className="modal-backdrop fade show"></div>
            <div className="modal show d-block" tabIndex="-1">
                <div className="modal-dialog modal-lg modal-dialog-scrollable">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">Detalle de Revisión - {review.applied_at}</h5>
                            <button type="button" className="btn-close" onClick={onClose}></button>
                        </div>
                        <div className="modal-body">
                            {checklist.map(aspect => {
                                const collapseId = `reviewCollapse-${aspect.id}`;
                                return (
                                    <div key={aspect.id} className="card mb-3">
                                        <div className="card-header" data-bs-toggle="collapse" data-bs-target={`#${collapseId}`} style={{ cursor: 'pointer' }}>
                                            {aspect.name}
                                        </div>
                                        <div id={collapseId} className="collapse show">
                                            <div className="card-body">
                                                {aspect.points.map(point => {
                                                    // return null;
                                                    const result = review.results.find(r => r.point_id === point.id);
                                                    if (!result) return null;

                                                    return (
                                                        <div key={point.id} className="row align-items-start border-bottom py-2 mb-2">
                                                            <div className="col-md-5 fw-bold">{point.name}</div>
                                                            <div className="col-md-1">
                                                                <StatusBadge status={result.status} />
                                                            </div>
                                                            <div className="col-md-6">
                                                                {result.observation && (
                                                                    <div>
                                                                        <span className="text-muted small">Observación:</span>
                                                                        <p className="mb-0">{result.observation}</p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="modal-footer">
                            <button
                                className="btn btn-sm btn-danger d-inline-flex align-items-center"
                                onClick={onClose}
                            >
                                <FaBan className="me-2" />
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
