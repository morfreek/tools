import { globalTeardown } from './setup.js';

export default async function() {
  await globalTeardown();
}
