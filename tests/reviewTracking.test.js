import { describe, it, expect } from '@jest/globals';
import { pendingPoints, lastChange, trendSeries, countStatuses, sortReviews } from '../src/utils/reviewTracking.js';

const checklist = [
  { id: 1, name: 'Arquitectura', points: [{ id: 10, aspect_id: 1, name: 'Patrones' }, { id: 11, aspect_id: 1, name: 'Escalabilidad' }] },
  { id: 2, name: 'Seguridad', points: [{ id: 20, aspect_id: 2, name: 'Valida token jwt' }] },
];

const review = (id, applied_at, statuses) => ({
  id, applied_at,
  results: Object.entries(statuses).map(([point_id, status]) => ({ point_id: Number(point_id), status, observation: `obs ${id}-${point_id}` })),
});

// La API entrega las revisiones de la más reciente a la más antigua
const reviews = [
  review(3, '2026-03-01', { 10: 'regular', 11: 'bien', 20: 'deficiente' }),
  review(2, '2026-02-01', { 10: 'regular', 11: 'regular', 20: 'bien' }),
  review(1, '2026-01-01', { 10: 'bien', 11: 'deficiente', 20: 'No aplica' }),
];

describe('reviewTracking', () => {
  it('ordena de la más reciente a la más antigua aunque llegue desordenado', () => {
    expect(sortReviews([reviews[2], reviews[0], reviews[1]]).map((r) => r.id)).toEqual([3, 2, 1]);
  });

  it('cuenta estados sin incluir "No aplica" entre los evaluados', () => {
    expect(countStatuses(reviews[2])).toEqual({ bien: 1, regular: 0, deficiente: 1, noAplica: 1, evaluados: 2 });
  });

  it('lista pendientes de la última revisión por aspecto, con racha y fecha de inicio', () => {
    const groups = pendingPoints(reviews, checklist);
    expect(groups.map((g) => g.aspect)).toEqual(['Arquitectura', 'Seguridad']);
    expect(groups[0].items).toEqual([
      { pointId: 10, name: 'Patrones', status: 'regular', observation: 'obs 3-10', streak: 2, since: '2026-02-01' },
    ]);
    expect(groups[1].items[0]).toMatchObject({ pointId: 20, status: 'deficiente', streak: 1, since: '2026-03-01' });
  });

  it('sin revisiones no hay pendientes', () => {
    expect(pendingPoints([], checklist)).toEqual([]);
  });

  it('detecta mejoras y retrocesos en el último cambio registrado', () => {
    const change = lastChange(reviews, checklist);
    expect(change).toMatchObject({ changed: true, unchangedSince: 0 });
    expect(change.previous.id).toBe(2);
    expect(change.improved).toEqual([{ pointId: 11, name: 'Escalabilidad', before: 'regular', now: 'bien' }]);
    expect(change.worsened).toEqual([{ pointId: 20, name: 'Valida token jwt', before: 'bien', now: 'deficiente' }]);
  });

  it('salta las revisiones copiadas sin cambios hasta el último cambio real', () => {
    const copia = review(4, '2026-04-01', { 10: 'regular', 11: 'bien', 20: 'deficiente' });
    const change = lastChange([copia, ...reviews], checklist);
    expect(change).toMatchObject({ changed: true, unchangedSince: 1 });
    expect(change.current.id).toBe(3);
    expect(change.previous.id).toBe(2);
  });

  it('indica cuando nunca hubo cambios y cuando no hay con qué comparar', () => {
    const igual = [review(2, '2026-02-01', { 10: 'bien' }), review(1, '2026-01-01', { 10: 'bien' })];
    expect(lastChange(igual, checklist)).toMatchObject({ changed: false, unchangedSince: 1 });
    expect(lastChange([reviews[0]], checklist)).toBeNull();
  });

  it('arma la serie de evolución de la más antigua a la más reciente, con porcentajes sobre evaluados', () => {
    const series = trendSeries(reviews);
    expect(series.map((s) => s.id)).toEqual([1, 2, 3]);
    expect(series[0]).toMatchObject({ bien: 1, deficiente: 1, noAplica: 1, pctBien: 50, pctDeficiente: 50 });
    expect(trendSeries(reviews, 2).map((s) => s.id)).toEqual([2, 3]);
  });
});
