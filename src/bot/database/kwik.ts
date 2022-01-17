import { decode, encode, Kwik, KwikTable } from '../../../deps.ts';
import log from '../../utils/logger.ts';

log.info('Initializing database....');

interface CommandVersionsSchema {
    version: number;
}

export const kwik = new Kwik();
export const commandVersions = new KwikTable<CommandVersionsSchema>(
    kwik,
    "commandVersions",
);

/* add BigInt support */
kwik.msgpackExtensionCodec.register({
    type: 0,
    encode: (object: unknown): Uint8Array | null => {
        if (typeof object === 'bigint') {
            if (
                object <= Number.MAX_SAFE_INTEGER && object >= Number.MIN_SAFE_INTEGER
            ) {
                return encode(parseInt(object.toString(), 10), {
                });
            } else {
                return encode(object.toString(), {});
            }
        } else {
            return null;
        }
    },
    decode: (data: Uint8Array) => {
        return BigInt(decode(data, {}) as string);
    },
});

/* interface the database */
await kwik.init();

log.info("Database Initialized!");