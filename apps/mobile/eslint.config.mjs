import base from '../../eslint.config.mjs';

// Os scripts .mjs do e2e rodam em Node.
const nodeGlobals = { process: 'readonly', console: 'readonly', URL: 'readonly' };

export default [...base, { files: ['e2e/**/*.mjs'], languageOptions: { globals: nodeGlobals } }];
