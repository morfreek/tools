import React from 'react';
import { FaSave, FaBan } from 'react-icons/fa';
import { STATUS_OPTIONS } from '@/utils/Constants';

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

                            <div className="accordion" id="aspectAccordion">
                                {checklist.map((aspect, index) => {
                                    const collapseId = `collapseAspect-${aspect.id}`;
                                    const headingId = `headingAspect-${aspect.id}`;
                                    const resultDefault = { status: '', observation: '' };

                                    return (
                                        <div key={aspect.id} className="accordion-item">
                                            <h2 className="accordion-header" id={headingId}>
                                                <button
                                                    className={`accordion-button ${index !== 0 ? 'collapsed' : ''}`}
                                                    type="button"
                                                    data-bs-toggle="collapse"
                                                    data-bs-target={`#${collapseId}`}
                                                    aria-expanded={index === 0}
                                                    aria-controls={collapseId}
                                                >
                                                    {aspect.name}
                                                </button>
                                            </h2>
                                            <div
                                                id={collapseId}
                                                className={`accordion-collapse collapse ${index === 0 ? 'show' : ''}`}
                                                aria-labelledby={headingId}
                                                data-bs-parent="#aspectAccordion"
                                            >
                                                <div className="accordion-body">
                                                    {aspect.points.map(point => {
                                                        const result = form.results.find(r => r.point_id === point.id) || resultDefault;
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
                                                                            {STATUS_OPTIONS.map((status) => (
                                                                                <option key={status} value={status}>
                                                                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                                                                </option>
                                                                            ))}
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

                            {/* {checklist.map((aspect, index) => {
                                const collapseId = `collapseAspect-${aspect.id}`;
                                return (
                                    <div key={aspect.id} className="card mb-3">
                                        <div className="card-header" data-bs-toggle="collapse" data-bs-target={`#${collapseId}`} style={{ cursor: 'pointer' }}>
                                            {aspect.name}
                                        </div>
                                        <div id={collapseId} className={`collapse ${index === 0 ? 'show' : ''}`}>
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
                                                                        {STATUS_OPTIONS.map((status) => (
                                                                            <option key={status} value={status}>
                                                                                {status.charAt(0).toUpperCase() + status.slice(1)}
                                                                            </option>
                                                                        ))}
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
                            })} */}
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
