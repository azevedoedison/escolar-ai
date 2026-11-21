import { describe, expect, it } from 'vitest';
import { APP_NAME } from './index';

describe('shared', () => {
  it('expõe o nome do app', () => {
    expect(APP_NAME).toBe('Tatá IA');
  });
});
