import {
    ApplicationCommandOption,
    ApplicationCommandOptionTypes,
    Bot,
    ChannelTypes,
    Collection,
    DiscordenoChannel,
    DiscordenoMember,
    DiscordenoMessage,
    DiscordenoRole,
    DiscordenoUser,
    InteractionDataOption
} from "../../deps.ts";
import { getLanguage, translate } from "../bot/languages/translate.ts";
import { SNOWFLAKE_REGEX } from "../constants/regexes.ts";

/* mapped by `language-commandName` */
const translatedOptionNamesCache = new Map<string, Record<string, string>>();

/* translates all options of the command to an object: translatedOptionName: optionName */
export function translateOptionNames(
    bot: Bot,
    guildId: bigint,
    options: ApplicationCommandOption[],
    commandName?: string,
): Record<string, string> {
    const language = getLanguage(guildId);
    /* return the already translated options which are in cache */
    if (
        commandName && translatedOptionNamesCache.has(`${language}-${commandName}`)
    ) {
        return translatedOptionNamesCache.get(`${language}-${commandName}`)!;
    }

    /* translate all options */
    let translated: Record<string, string> = {};
    for (const option of options) {
        /* @ts-ignore ts being dumb */
        translated[translate(bot, guildId, option.name).toLowerCase()] = translate(
            bot,
            "english",
            /* @ts-ignore ts being dumb */
            option.name,
        );
        if (option.options) {
            translated = {
                ...translated,
                ...translateOptionNames(bot, guildId, option.options),
            };
        }
    }

    /* save the translated options in cache for faster access */
    if (commandName) {
        translatedOptionNamesCache.set(`${language}-${commandName}`, translated);
    }

    return translated;
}

function convertOptionValue(
    option: InteractionDataOption,
    resolved?: {
        /* The Ids and Message objects */
        messages?: Collection<bigint, DiscordenoMessage>;
        /* The Ids and User objects */
        users?: Collection<bigint, DiscordenoUser>;
        /* The Ids and partial Member objects */
        members?: Collection<bigint, DiscordenoMember>;
        /* The Ids and Role objects */
        roles?: Collection<bigint, DiscordenoRole>;
        /* The Ids and partial Channel objects */
        channels?: Collection<
            bigint,
            {
                id: bigint;
                name: string;
                type: ChannelTypes;
                permissions: bigint;
            }
        >;
    },
    translateOptions?: Record<string, string>,
): [
        string,
        (
            | { user: DiscordenoUser; member: DiscordenoMember }
            | DiscordenoRole
            | {
                id: bigint;
                name: string;
                type: ChannelTypes;
                permissions: bigint;
            }
            | boolean
            | string
            | number
        ),
    ] {
    const value = typeof option.value === "string" && SNOWFLAKE_REGEX.test(option.value) ? BigInt(option.value) : 0n;
    /* the option is a channel */
    if (option.type === ApplicationCommandOptionTypes.Channel) {
        const channel = resolved?.channels?.get(value);

        /* save the argument with the correct name */
        return [translateOptions?.[option.name] ?? option.name, channel!];
    }

    /* the option is a role */
    if (option.type === ApplicationCommandOptionTypes.Role) {
        const role = resolved?.roles?.get(value);

        /* save the argument with the correct name */
        return [translateOptions?.[option.name] ?? option.name, role!];
    }

    /*the option is a user */
    if (option.type === ApplicationCommandOptionTypes.User) {
        const user = resolved?.users?.get(value);
        const member = resolved?.members?.get(value);

        /* save the argument with the correct name */
        return [
            translateOptions?.[option.name] ?? option.name,
            {
                member: member!,
                user: user!,
            },
        ];
    }

    /* the option is a mentionable */
    if (option.type === ApplicationCommandOptionTypes.Mentionable) {
        const role = resolved?.roles?.get(value);
        const user = resolved?.users?.get(value);
        const member = resolved?.members?.get(value);

        const final = user && member ? { user, member } : role!;

        /* save the argument with the correct name */
        return [translateOptions?.[option.name] ?? option.name, final];
    }

    /**
     * the rest of options don't need any convertion
     * save the argument with the correct name
     */
    /* @ts-ignore ts leave me alone */
    return [translateOptions?.[option.name] ?? option.name, option.value];
}

/** 
 * parse the options to a nice object.
 * note: this does not work with subcommands
 */
export function optionParser(
    options?: InteractionDataOption[],
    resolved?: {
        /* the Ids and Message objects */
        messages?: Collection<bigint, DiscordenoMessage>;
        /* the Ids and User objects */
        users?: Collection<bigint, DiscordenoUser>;
        /* the Ids and partial Member objects */
        members?: Collection<bigint, DiscordenoMember>;
        /* the Ids and Role objects */
        roles?: Collection<bigint, DiscordenoRole>;
        /* the Ids and partial Channel objects */
        channels?: Collection<
            bigint,
            {
                id: bigint;
                name: string;
                type: ChannelTypes;
                permissions: bigint;
            }
        >;
    },
    translateOptions?: Record<string, string>,
):
    | InteractionCommandArgs
    | { [key: string]: InteractionCommandArgs }
    | { [key: string]: { [key: string]: InteractionCommandArgs } } {
    /* options can be undefined so we just return an empty object */
    if (!options) return {};

    /* a subcommand was used */
    if (options[0].type === ApplicationCommandOptionTypes.SubCommand) {
        const convertedOptions: Record<
            string,
            | { user: DiscordenoUser; member: DiscordenoMember }
            | DiscordenoRole
            | {
                id: bigint;
                name: string;
                type: ChannelTypes;
                permissions: bigint;
            }
            | boolean
            | string
            | number
        > = {};
        /* convert all the options */
        for (const option of options[0].options ?? []) {
            const [name, value] = convertOptionValue(
                option,
                resolved,
                translateOptions,
            );
            convertedOptions[name] = value;
        }

        /* @ts-ignore leave me alone */
        return {
            [translateOptions?.[options[0].name] ?? options[0].name]: convertedOptions,
        };
    }

    /* a subcommand group was used */
    if (options[0].type === ApplicationCommandOptionTypes.SubCommandGroup) {
        const convertedOptions: Record<
            string,
            | DiscordenoMember
            | DiscordenoRole
            | DiscordenoChannel
            | boolean
            | string
            | number
        > = {};
        /* convert all the options */
        for (const option of options[0].options![0].options ?? []) {
            const [name, value] = convertOptionValue(
                option,
                resolved,
                translateOptions,
            );
            /* @ts-ignore ts leave me alone */
            convertedOptions[name] = value;
        }

        /* @ts-ignore ts leave me alone */
        return {
            [translateOptions?.[options[0].name] ?? options[0].name]: {
                [
                    translateOptions?.[options[0].options![0].name] ??
                    options[0].options![0].name
                ]: convertedOptions,
            },
        };
    }

    /* a normal command was used */
    const convertedOptions: Record<
        string,
        | DiscordenoMember
        | DiscordenoRole
        | Record<
            string,
            Pick<DiscordenoChannel, "id" | "name" | "type" | "permissions">
        >
        | boolean
        | string
        | number
    > = {};
    for (const option of options ?? []) {
        const [name, value] = convertOptionValue(
            option,
            resolved,
            translateOptions,
        );
        // @ts-ignore ts leave me alone
        convertedOptions[name] = value;
    }

    return convertedOptions;
}

/** 
 * the interaction arguments.
 * important the members `deaf` and `mute` properties will always be false.
 */
export type InteractionCommandArgs = Record<
    string,
    | DiscordenoMember
    | DiscordenoRole
    | Record<
        string,
        Pick<DiscordenoChannel, "id" | "name" | "type" | "permissions">
    >
    | boolean
    | string
    | number
>;