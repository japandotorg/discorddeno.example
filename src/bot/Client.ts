import { Bot, Collection } from "../../deps.ts";

export interface Client extends Bot {
    commandVersions: Collection<bigint, number>;
}

export function setupClient(bot: Client) {
    bot.commandVersions = new Collection();
}