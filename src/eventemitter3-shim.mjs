import { createRequire } from 'node:module';

const nodeRequire = createRequire(import.meta.url);
const EventEmitter = nodeRequire('eventemitter3');

export { EventEmitter };
export default EventEmitter;
