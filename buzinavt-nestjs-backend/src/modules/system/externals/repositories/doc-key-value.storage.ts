import Keyv from 'keyv';

export const docKeyValueStorage = new Keyv({ namespace: 'doc', store: new Map<string, string>() });
