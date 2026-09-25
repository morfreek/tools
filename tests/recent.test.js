import { describe, it, expect } from '@jest/globals';
import { addRecent } from '../src/utils/recent.js';

const item = (key) => ({ key, to: `/${key}`, label: key });

describe('recent', () => {
  it('agrega al inicio y mueve arriba un elemento ya visitado sin duplicarlo', () => {
    const list = [item('a'), item('b'), item('c')];
    expect(addRecent(list, item('c')).map((r) => r.key)).toEqual(['c', 'a', 'b']);
  });

  it('conserva como máximo la cantidad indicada', () => {
    const list = [item('a'), item('b'), item('c')];
    expect(addRecent(list, item('d'), 3).map((r) => r.key)).toEqual(['d', 'a', 'b']);
  });
});
