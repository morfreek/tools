import React, { useEffect, useRef, useState } from 'react';
import { Button, Table } from 'react-bootstrap';

// Evolución de las revisiones: barras apiladas al 100 % de los puntos evaluados.
// Colores de estado validados para CVD en claro y oscuro (--grafico-* en index.css).
const SERIES = [
    { key: 'bien', label: 'Bien', color: 'var(--grafico-bien)' },
    { key: 'regular', label: 'Regular', color: 'var(--grafico-regular)' },
    { key: 'deficiente', label: 'Deficiente', color: 'var(--grafico-deficiente)' },
];

const HEIGHT = 200;
const MARGIN = { top: 8, right: 8, bottom: 26, left: 38 };
const GAP = 2;
const RADIUS = 4;
const MAX_BAR = 24;

const shortDate = (date) => new Date(`${date}T00:00:00`).toLocaleDateString('es-CL', { day: '2-digit', month: 'short' });
const longDate = (date) => new Date(`${date}T00:00:00`).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' });
const pct = (n) => `${Math.round(n)} %`;

// Rectángulo con solo las esquinas superiores redondeadas (extremo del dato)
const topRoundedRect = (x, y, w, h, r) => {
    const rr = Math.min(r, h, w / 2);
    return `M${x},${y + h}V${y + rr}Q${x},${y} ${x + rr},${y}H${x + w - rr}Q${x + w},${y} ${x + w},${y + rr}V${y + h}Z`;
};

const useWidth = () => {
    const ref = useRef(null);
    const [width, setWidth] = useState(0);
    useEffect(() => {
        if (!ref.current) return undefined;
        const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
        observer.observe(ref.current);
        return () => observer.disconnect();
    }, []);
    return [ref, width];
};

export default function ReviewTrendChart({ series, total }) {
    const [ref, width] = useWidth();
    const [active, setActive] = useState(null);
    const [showTable, setShowTable] = useState(false);

    const plotW = Math.max(0, width - MARGIN.left - MARGIN.right);
    const plotH = HEIGHT - MARGIN.top - MARGIN.bottom;
    const band = series.length ? plotW / series.length : 0;
    const barW = Math.min(MAX_BAR, band * 0.6);
    const y = (p) => MARGIN.top + plotH - (p / 100) * plotH;
    const labelEvery = band >= 46 ? 1 : Math.ceil(46 / Math.max(band, 1));
    const current = active !== null ? series[active] : null;

    return (
        <div>
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
                <ul className="grafico-leyenda" aria-label="Leyenda">
                    {SERIES.map((s) => (
                        <li key={s.key}><span className="grafico-clave" style={{ background: s.color }} />{s.label}</li>
                    ))}
                </ul>
                <Button variant="outline-secondary" size="sm" onClick={() => setShowTable((v) => !v)} aria-pressed={showTable}>
                    {showTable ? 'Ver gráfico' : 'Ver tabla'}
                </Button>
            </div>

            {showTable ? (
                <div className="panel-tabla">
                    <Table size="sm" className="mb-0">
                        <thead>
                            <tr><th>Fecha</th><th>Bien</th><th>Regular</th><th>Deficiente</th><th>No aplica</th></tr>
                        </thead>
                        <tbody>
                            {[...series].reverse().map((s) => (
                                <tr key={s.id}>
                                    <td>{longDate(s.date)}</td>
                                    <td>{s.bien} ({pct(s.pctBien)})</td>
                                    <td>{s.regular} ({pct(s.pctRegular)})</td>
                                    <td>{s.deficiente} ({pct(s.pctDeficiente)})</td>
                                    <td>{s.noAplica}</td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </div>
            ) : (
                <div ref={ref} className="grafico" onPointerLeave={() => setActive(null)}>
                    {width > 0 && (
                        <svg width={width} height={HEIGHT} role="img" aria-label={`Evolución de ${series.length} revisiones: porcentaje de puntos bien, regular y deficiente`}>
                            {[0, 50, 100].map((p) => (
                                <g key={p}>
                                    <line x1={MARGIN.left} x2={width - MARGIN.right} y1={y(p)} y2={y(p)} className="grafico-grilla" />
                                    <text x={MARGIN.left - 6} y={y(p)} dy="0.32em" textAnchor="end" className="grafico-eje">{p} %</text>
                                </g>
                            ))}

                            {series.map((s, i) => {
                                const cx = MARGIN.left + band * i + band / 2;
                                const x = cx - barW / 2;
                                const segments = [
                                    { ...SERIES[0], value: s.pctBien },
                                    { ...SERIES[1], value: s.pctRegular },
                                    { ...SERIES[2], value: s.pctDeficiente },
                                ].filter((seg) => seg.value > 0);
                                let top = y(0);
                                return (
                                    <g
                                        key={s.id}
                                        tabIndex={0}
                                        className={`grafico-columna${active === i ? ' activa' : ''}`}
                                        aria-label={`${longDate(s.date)}: bien ${s.bien}, regular ${s.regular}, deficiente ${s.deficiente}`}
                                        onPointerEnter={() => setActive(i)}
                                        onFocus={() => setActive(i)}
                                        onBlur={() => setActive(null)}
                                    >
                                        {/* Zona de interacción: toda la banda, más grande que la barra */}
                                        <rect x={MARGIN.left + band * i} y={MARGIN.top} width={band} height={plotH} fill="transparent" />
                                        {segments.map((seg, k) => {
                                            const h = Math.max(0, (seg.value / 100) * plotH - (k > 0 ? GAP : 0));
                                            const yTop = top - h - (k > 0 ? GAP : 0);
                                            const d = k === segments.length - 1
                                                ? topRoundedRect(x, yTop, barW, h, RADIUS)
                                                : `M${x},${yTop}h${barW}v${h}h${-barW}Z`;
                                            top = yTop;
                                            return <path key={seg.key} d={d} fill={seg.color} />;
                                        })}
                                        {i % labelEvery === 0 && (
                                            <text x={cx} y={HEIGHT - 8} textAnchor="middle" className="grafico-eje">{shortDate(s.date)}</text>
                                        )}
                                    </g>
                                );
                            })}
                        </svg>
                    )}

                    {current && (
                        <div
                            className="grafico-tooltip"
                            role="status"
                            style={{ left: Math.min(Math.max(MARGIN.left + band * active + band / 2, 90), width - 90) }}
                        >
                            <div className="sub mb-1">{longDate(current.date)}</div>
                            {SERIES.map((s) => (
                                <div key={s.key} className="grafico-tooltip-fila">
                                    <span className="grafico-tooltip-clave" style={{ background: s.color }} />
                                    <strong>{current[s.key]}</strong>
                                    <span className="sub">{s.label} · {pct(current[`pct${s.label}`])}</span>
                                </div>
                            ))}
                            {current.noAplica > 0 && <div className="sub mt-1">{current.noAplica} no aplica (no se grafican)</div>}
                        </div>
                    )}
                </div>
            )}

            {total > series.length && (
                <p className="sub mt-2 mb-0">Se muestran las últimas {series.length} de {total} revisiones.</p>
            )}
        </div>
    );
}
