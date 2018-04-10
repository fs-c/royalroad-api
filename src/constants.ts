const PROTOCOL_PREFIX = 'https://';
const PROTOCOL_PREFIX_INSECURE = 'http://';

const HOST_NAME = 'royalroadl.com';
/**
 * @param insecure - HTTP / HTTPS
 * @returns - Bbase address with prepended protocol.
 */
export function getBaseAddress(insecure = false) {
  return (insecure ? PROTOCOL_PREFIX_INSECURE : PROTOCOL_PREFIX) + HOST_NAME;
}

export function getUserAgent() {
  return `royalroad-api/x.x.x (Node.js)`; // TODO, get version.
}
