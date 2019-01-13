import { readFileSync } from 'fs';

const PROTOCOL_PREFIX = 'https://';
const PROTOCOL_PREFIX_INSECURE = 'http://';

const HOST_NAME = 'www.royalroad.com';

/**
 * Get the version read from package.json.
 */
export function getVersion() {
    try {
        // TODO: This isn't going to change at runtime, just fetch it once and
        //       return that on subsequent calls.
        const { version } = JSON.parse(readFileSync('./package.json', 'utf8'));

        return version;
    } catch (err) {
        return '0.0.0';
    }
}

/**
 * Get the base address with prepended protocol.
 *
 * @param insecure - HTTP / HTTPS
 */
export function getBaseAddress(insecure = false) {
    return (insecure ? PROTOCOL_PREFIX_INSECURE : PROTOCOL_PREFIX) + HOST_NAME;
}

/**
 * Return the user agent sent along with every request, containing name
 * and version.
 */
export function getUserAgent() {
    return `royalroad-api@${getVersion()} by fsoc@firemail.cc`;
}
