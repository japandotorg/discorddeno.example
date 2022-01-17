import { Client } from '../Client.ts';
import { commandVersions } from './kwik.ts';

export const CURRENT_SLASH_COMMAND_VERSION = 1;

export async function usesLatestCommandVersion(
    bot: Client,
    guildId: bigint,
): Promise<boolean> {
    return (await getCurrentCommandVersion(bot, guildId)) === CURRENT_SLASH_COMMAND_VERSION;
}

/* get the current slash command version for this guild */
export async function getCurrentCommandVersion(
    bot: Client,
    guildId: bigint,
): Promise<number> {
    const current = await commandVersions.get(guildId.toString());
    if (current) return current.version;
    await commandVersions.set(
        guildId.toString(),
        { version: CURRENT_SLASH_COMMAND_VERSION },
    );
    bot.commandVersions.set(guildId, CURRENT_SLASH_COMMAND_VERSION);
    return CURRENT_SLASH_COMMAND_VERSION;
}

export async function updateCommandVersion(
    bot: Client,
    guildId: bigint,
): Promise<number> {
    /* update the version saved in the db */
    await commandVersions.set(guildId.toString(), {
        version: CURRENT_SLASH_COMMAND_VERSION,
    });
    /* update the cached version for next check */
    bot.commandVersions.set(guildId, CURRENT_SLASH_COMMAND_VERSION);
    return CURRENT_SLASH_COMMAND_VERSION;
}