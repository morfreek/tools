import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Placeholder } from 'react-bootstrap';
import { FaClipboardCheck, FaStickyNote, FaFile, FaRocket } from 'react-icons/fa';
import ProjectPageLayout from '@c/layout/ProjectPageLayout';
import StatusBadge from '@c/StatusBadge';
import { listReviews } from '@/services/reviews.service';
import { listNotes } from '@/services/notes.service';
import { listFiles } from '@/services/files.service';
import { listConfigs } from '@/services/configs.service';

const formatDate = (value, withTime = false) => new Date(withTime ? value : `${value}T00:00:00`)
    .toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' });

// Texto plano de una nota (HTML del editor), para la vista previa
const plainText = (html) => new DOMParser().parseFromString(html || '', 'text/html').body.textContent.trim();

const countByStatus = (results = []) => results.reduce((acc, r) => ({ ...acc, [r.status]: (acc[r.status] || 0) + 1 }), {});

// Carga cada sección por separado: si una falla, las demás se muestran igual
const useSummary = (projectId) => {
    const [data, setData] = useState({});

    useEffect(() => {
        setData({});
        const sources = { reviews: listReviews, notes: listNotes, files: listFiles, configs: listConfigs };
        Object.entries(sources).forEach(([key, load]) => {
            load(projectId)
                .then((value) => setData((prev) => ({ ...prev, [key]: value })))
                .catch(() => setData((prev) => ({ ...prev, [key]: null })));
        });
    }, [projectId]);

    return data;
};

const SummaryCard = ({ to, icon: Icon, title, value, children }) => (
    <Link to={to} className="tarjeta">
        <Icon className="icono" size={18} aria-hidden="true" />
        <h2>{title}</h2>
        {value === undefined ? (
            <Placeholder as="p" animation="glow"><Placeholder xs={8} /></Placeholder>
        ) : value === null ? (
            <p>No se pudo cargar.</p>
        ) : children}
    </Link>
);

// Pestaña "Resumen": estado de cada sección, con acceso directo a su pestaña
export default function ProjectDetail() {
    const { id } = useParams();
    const { reviews, notes, files, configs } = useSummary(id);
    const lastReview = reviews?.[0];
    const lastNote = notes?.length ? [...notes].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0] : null;

    return (
        <ProjectPageLayout>
            <div className="rejilla">
                <SummaryCard to={`/projects/${id}/review`} icon={FaClipboardCheck} title="Revisiones" value={reviews}>
                    {lastReview ? (
                        <>
                            <p className="mb-2">Última del {formatDate(lastReview.applied_at)} · {reviews.length} en total</p>
                            <div className="d-flex flex-wrap gap-1">
                                {Object.entries(countByStatus(lastReview.results)).map(([status, count]) => (
                                    <StatusBadge key={status} status={status} text={`: ${count}`} />
                                ))}
                            </div>
                        </>
                    ) : <p>Sin revisiones todavía.</p>}
                </SummaryCard>

                <SummaryCard to={`/projects/${id}/notes`} icon={FaStickyNote} title="Notas" value={notes}>
                    {lastNote ? (
                        <>
                            <p className="mb-1">{notes.length} {notes.length === 1 ? 'nota' : 'notas'} · última del {formatDate(lastNote.created_at, true)}</p>
                            <p className="resumen-nota">{plainText(lastNote.detail)}</p>
                        </>
                    ) : <p>Sin notas todavía.</p>}
                </SummaryCard>

                <SummaryCard to={`/projects/${id}/files`} icon={FaFile} title="Archivos" value={files}>
                    <p>{files?.length ? `${files.length} ${files.length === 1 ? 'archivo' : 'archivos'} · último del ${formatDate(files[0].created_at, true)}` : 'Sin archivos todavía.'}</p>
                </SummaryCard>

                <SummaryCard to={`/projects/${id}/continuous-deployment`} icon={FaRocket} title="Despliegue continuo" value={configs}>
                    <p>{configs?.length ? `${configs.length} ${configs.length === 1 ? 'configuración guardada' : 'configuraciones guardadas'}: ${configs.map((c) => c.name).join(', ')}` : 'Sin configuraciones guardadas.'}</p>
                </SummaryCard>
            </div>
        </ProjectPageLayout>
    );
}
