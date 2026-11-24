import type { Caso } from '../types';
import { burlas } from './burlas';
import { crises } from './crises';
import { legitimos } from './legitimos';
import { perigosos } from './perigosos';

export const CASOS: Caso[] = [...legitimos, ...perigosos, ...burlas, ...crises];
