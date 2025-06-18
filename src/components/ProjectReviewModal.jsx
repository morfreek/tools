import React from 'react';
import { FaSave, FaBan } from 'react-icons/fa';

export default function ProjectReviewModal({ visible, checklist, form, setForm, onClose, onSave }) {
    if (!visible) return null;

    const updateResult = (point_id, field, value) => {
        setForm(prev => ({
            ...prev,
            results: prev.results.map(r =>
                r.point_id === point_id ? { ...r, [field]: value } : r
            )
        }));
    };

    return (
        <>
            {/* Overlay (fondo oscuro) */}
            <div className="modal-backdrop fade show"></div>
            <div className="modal show d-block" tabIndex="-1">
                <div className="modal-dialog modal-lg modal-dialog-scrollable">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">Nueva Revisión Técnica</h5>
                            <button type="button" className="btn-close" onClick={onClose}></button>
                        </div>
                        <div className="modal-body">
                            <label>Fecha:</label>
                            <input
                                type="date"
                                className="form-control mb-3"
                                value={form.applied_at}
                                onChange={e => setForm({ ...form, applied_at: e.target.value })}
                            />

                            {checklist.map(aspect => {
                                const collapseId = `collapseAspect-${aspect.id}`;
                                return (
                                    <div key={aspect.id} className="card mb-3">
                                        <div className="card-header" data-bs-toggle="collapse" data-bs-target={`#${collapseId}`} style={{ cursor: 'pointer' }}>
                                            {aspect.name}
                                        </div>
                                        <div id={collapseId} className="collapse show">
                                            <div className="card-body">
                                                {aspect.points.map(point => {
                                                    const result = form.results.find(r => r.point_id === point.id) || { status: '', observation: '' };
                                                    return (
                                                        <div key={point.id} className="mb-4 border-bottom pb-2">
                                                            <label className="form-label fw-bold">{point.name}</label>
                                                            <div className="row mb-2">
                                                                <div className="col-md-4">
                                                                    <select
                                                                        className="form-select"
                                                                        value={result.status}
                                                                        onChange={(e) => updateResult(point.id, 'status', e.target.value)}
                                                                    >
                                                                        <option value="">Seleccione estado</option>
                                                                        <option value="bien">Bien</option>
                                                                        <option value="regular">Regular</option>
                                                                        <option value="deficiente">Deficiente</option>
                                                                    </select>
                                                                </div>
                                                                <div className="col-md-8">
                                                                    <textarea
                                                                        className="form-control"
                                                                        placeholder="Observación"
                                                                        rows="2"
                                                                        value={result.observation}
                                                                        onChange={(e) => updateResult(point.id, 'observation', e.target.value)}
                                                                    />
                                                                </div>
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
                            <button className="btn btn-sm btn-success d-inline-flex align-items-center"
                                onClick={onSave}>
                                <FaSave className="me-2" />
                                Guardar Revisión
                            </button>
                            <button
                                type="button"
                                className="btn btn-sm btn-danger d-inline-flex align-items-center"
                                onClick={onClose}
                            >
                                <FaBan className="me-2" />
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
