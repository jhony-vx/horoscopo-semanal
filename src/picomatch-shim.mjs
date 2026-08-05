import { createRequire } from 'node:module';

const nodeRequire = createRequire(import.meta.url);
const picomatch = nodeRequire('picomatch');

export default picomatch;
export const parse = picomatch.parse;
export const scan = picomatch.scan;
export const compileRe = picomatch.compileRe;
export const makeRe = picomatch.makeRe;
export const toRegex = picomatch.toRegex;
export const test = picomatch.test;
export const isMatch = picomatch.isMatch;
export const defaults = picomatch.defaults;
