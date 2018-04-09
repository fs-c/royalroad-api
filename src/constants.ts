const PROTOCOL_PREFIX = 'https://';
const PROTOCOL_PREFIX_INSECURE = 'http://';

const HOST_NAME = 'royalroadl.com';

export function getBaseAddress(insecure = false) {
  return (insecure ? PROTOCOL_PREFIX_INSECURE : PROTOCOL_PREFIX) + HOST_NAME;
}
