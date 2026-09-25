import { describe, it, expect } from '@jest/globals';
import { countStatuses, sortReviews, reviewCadence, reviewFreshness, sortByFreshness } from '../src/utils/reviewTracking.js';

const review = (id, applied_at, statuses = {}) => ({
  id, applied_at,
  results: Object.entries(statuses).map(([point_id, status]) => ({ point_id: Number(point_id), status, observation: '' })),
});

describe('reviewTracking', () => {
  it('ordena de la más reciente a la más antigua; a igual fecha, por id', () => {
    const reviews = [review(1, '2026-01-01'), review(3, '2026-03-01'), review(2, '2026-03-01')];
    expect(sortReviews(reviews).map((r) => r.id)).toEqual([3, 2, 1]);
  });

  it('cuenta estados sin incluir "No aplica" entre los evaluados', () => {
    expect(countStatuses(review(1, '2026-01-01', { 1: 'bien', 2: 'deficiente', 3: 'No aplica' })))
      .toEqual({ bien: 1, regular: 0, deficiente: 1, noAplica: 1, evaluados: 2 });
  });

  it('una revisión sin checklist tiene cero evaluados', () => {
    expect(countStatuses(review(1, '2026-01-01')).evaluados).toBe(0);
  });

  it('calcula días desde la última revisión y el promedio entre revisiones', () => {
    const reviews = [review(1, '2026-01-01'), review(2, '2026-01-11'), review(3, '2026-01-31')];
    expect(reviewCadence(reviews, new Date(2026, 1, 5))).toEqual({ daysSinceLast: 5, averageDays: 15 });
  });

  it('con una sola revisión no hay promedio y sin revisiones no hay frecuencia', () => {
    expect(reviewCadence([review(1, '2026-01-01')], new Date(2026, 0, 1))).toEqual({ daysSinceLast: 0, averageDays: null });
    expect(reviewCadence([])).toBeNull();
  });

  it('clasifica la vigencia de la última revisión según los umbrales', () => {
    const today = new Date(2026, 8, 25);
    expect(reviewFreshness(null, today)).toEqual({ estado: 'sin-revisiones', days: null });
    expect(reviewFreshness('2026-09-11', today)).toEqual({ estado: 'al-dia', days: 14 });
    expect(reviewFreshness('2026-09-10', today)).toEqual({ estado: 'atencion', days: 15 });
    expect(reviewFreshness('2026-08-26', today)).toEqual({ estado: 'atencion', days: 30 });
    expect(reviewFreshness('2026-08-25', today)).toEqual({ estado: 'atrasado', days: 31 });
  });

  it('ordena proyectos del más urgente al más reciente', () => {
    const projects = [
      { name: 'B', last_review_at: '2026-09-20' },
      { name: 'C', last_review_at: null },
      { name: 'A', last_review_at: '2026-06-30' },
    ];
    expect(sortByFreshness(projects).map((p) => p.name)).toEqual(['C', 'A', 'B']);
  });
});
