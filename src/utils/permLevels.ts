import { DiscordenoInteraction, validatePermissions } from '../../deps.ts';
import { Command } from '../bot/types/command.ts';

export default async function hasPermissionLevel(
    /* deno-lint-ignore no-explicit-any */
    command: Command<any>,
    payload: DiscordenoInteraction,
) {

    if (!command.permissionLevels) return true;
    /* if a custom function was provided */
    if (typeof command.permissionLevels === 'function') {
        return await command.permissionLevels(payload, command);
    }
    /* if an array of perm levels was provided */
    for (const permlevel of command.permissionLevels) {
        /* if this user has one of the allowed perm level, the loop is canceled and command is allowed */
        if (await PermissionLevelHandlers[permlevel](payload, command)) return true;
    }
    /* none of the perm levels were met. so cancel the commad */
    return false;
}

export const PermissionLevelHandlers: Record<
    keyof typeof PermissionLevels,
    (
        payload: DiscordenoInteraction,
        /* deno-lint-ignore no-explicit-any */
        command: Command<any>,
    ) => boolean | Promise<boolean>
> = {
    MEMBER: () => true,
    MODERATOR: (payload) =>
        Boolean(payload.member?.permissions) &&
        validatePermissions(payload.member!.permissions!, ['MANAGE_GUILD']),
    ADMIN: (payload) =>
        Boolean(payload.member?.permissions) &&
        validatePermissions(payload.member!.permissions!, ['ADMINISTRATOR']),
    SERVER_OWNER: () => false,
    BOT_SUPPORT: () => false,
    BOT_DEVS: () => false,
    BOT_OWNERS: () => false,
};

export enum PermissionLevels {
    MEMBER,
    MODERATOR,
    ADMIN,
    SERVER_OWNER,
    BOT_SUPPORT,
    BOT_DEVS,
    BOT_OWNERS,
};