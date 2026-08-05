import { createRequire } from 'node:module';

const nodeRequire = createRequire(import.meta.url);
const esbuild = nodeRequire('esbuild');

export const analyzeMetafile = esbuild.analyzeMetafile;
export const analyzeMetafileSync = esbuild.analyzeMetafileSync;
export const build = esbuild.build;
export const buildSync = esbuild.buildSync;
export const context = esbuild.context;
export const formatMessages = esbuild.formatMessages;
export const formatMessagesSync = esbuild.formatMessagesSync;
export const initialize = esbuild.initialize;
export const stop = esbuild.stop;
export const transform = esbuild.transform;
export const transformSync = esbuild.transformSync;
export const version = esbuild.version;
export default esbuild;
