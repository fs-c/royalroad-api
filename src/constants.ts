import { readFileSync } from 'node:fs';

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
    } catch (err: unknown) {
        return '0.0.0';
    }
}

/**
 * Get the base address with prepended protocol.
 */
export function getBaseAddress() {
    return 'https://' + HOST_NAME;
}

/**
 * Return the user agent sent along with every request, containing name
 * and version.
 */
export function getUserAgent() {
    return `royalroad-api@${getVersion()}:github.com/fs-c/royalroad-api`;
}

// some random change
