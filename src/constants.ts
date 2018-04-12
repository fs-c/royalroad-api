import { readFileSync } from 'fs';

const PROTOCOL_PREFIX = 'https://';
const PROTOCOL_PREFIX_INSECURE = 'http://';

const HOST_NAME = 'royalroadl.com';

/**
 * @returns - Version read from package.json.
 */
export function getVersion() {
  const { version } = JSON.parse(readFileSync('./package.json', 'utf8'));

  return version;
}

/**
 * @param insecure - HTTP / HTTPS
 * @returns - Base address with prepended protocol.
 */
export function getBaseAddress(insecure = false) {
  return (insecure ? PROTOCOL_PREFIX_INSECURE : PROTOCOL_PREFIX) + HOST_NAME;
}

/**
 * @returns - The user agent sent along with every request, containing name
 * and version.
 */
export function getUserAgent() {
  return `royalroadl-api/${getVersion()}`;
}
