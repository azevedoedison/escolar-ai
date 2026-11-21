import { describe, expect, it } from 'vitest';
import type { SafetyClassifier } from './index';

describe('safety', () => {
  it('aceita um classificador que segue o contrato', async () => {
    const classify: SafetyClassifier = async () => ({ decision: 'allow', category: 'escola' });
    expect((await classify('o que é fotossíntese?')).decision).toBe('allow');
  });
});
