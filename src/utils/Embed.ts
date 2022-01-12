import { Bot, DiscorddenoUser, Embed } from "../../deps.ts";

const embedLimits = {
    title: 256,
    description: 4096,
    fieldName: 256,
    fieldValue: 1024,
    footerText: 2048,
    authorName: 256,
    fields: 25,
    total: 6000,
};

export class Embeds extends Array<Embed> {
    /* the amount of characters in the embed */
    currentTotal = 0;
    /* wheather the limits should be enforced or not */
    enforceLimits = true;
    /* if a file is attached to the message it will be added here */
    file?: EmbedFile;
    bot: Bot;

    constructor(bot: Bot, enforceLimits = true) {
        super();
        this.bot = bot;
        /**
         * by default we will always want to enfore discord
         * limits but this option allows us to bypass for
         * whatever reason
         */
        if (!enforceLimits) this.enforceLimits = false;
        return this;
    }

    fitData(data: string, max: number) {
        /* if the string is bigger then the allowed max shortedn it */
        if (data.length > max) data = data.substring(0, max);
        /* check the amount of characters left for this embed */
        const availableCharacters = embedLimits.total - this.currentTotal;
        /* if it is maxed out already return empty string as nothing can be added anymore */
        if (!availableCharacters) return ``;
        /* if the string breaks the maximum embed limit then shorten it */
        if (this.currentTotal + data.length > embedLimits.total) {
            return data.substring(0, availableCharacters);
        }
        /* return the data as is with no change */
        return data;
    }

    setAuthor(name: string, iconUrl: string | DiscorddenoUser, url?: string) {
        const embed = this.#getLastEmbed();
        const finalName = this.enforceLimits ? this.fitData(name, embedLimits.authorName): name;

        if (typeof iconUrl === 'string') {
            embed.author = { name: finalName, iconUrl: url };
        } else if (iconUrl) {
            embed.author = {
                name: finalName,
                iconUrl: this.bot.helpers.avatarURL(
                    iconUrl.id,
                    iconUrl?.discriminator,
                    {
                        avatar: iconUrl.avatar!,
                    },
                ),
                url,
            };
        } else {
            embed.author = { name: finalName, url };
        }
        return this;
    }

    setColor(color: string) {
        this.#getLastEmbed().color = color.toLowerCase() === `random`
            ? /* random color */
                Math.floor(Math.random() * (0xffffff + 1))
            : /* convert the hex to a acceptable color for discord */
                parseInt(color.replace('#', ""), 16);
        return this;
    }

    setDescription(description: string | string[]) {
        if (Array.isArray(description)) description = description.join("\n");
        this.#getLastEmbed().description = this.fitData(
            description,
            embedLimits.description,
        );
        return this;
    }

    addField(name: string, value: string, inline = false) {
        const embed = this.#getLastEmbed();
        if (embed.fields!.length >= 25) return this;
        embed.fields!.push({
            name: this.fitData(name, embedLimits.fieldName),
            value: this.fitData(value, embedLimits.fieldValue),
            inline,
        });
        return this;
    }

    addBlankField(inline = false) {
        return this.addField('\u200B', '\u200B', inline);
    }

    attachFile(file: unknown, name: string) {
        this.file = {
            blob: file,
            name,
        };
        this.setImage(`attachment://${name}`)
        return this;
    }

    setFooter(text: string, icon?: string) {
        this.#getLastEmbed().footer = {
            text: this.fitData(text, embedLimits.footerText),
            iconUrl: icon,
        };
        return this;
    }
    
    setImage(url: string | DiscordenoUser) {
        if (typeof url === "string") this.#getLastEmbed().image = { url };
        else {
            this.#getLastEmbed().image = {
                url: this.bot.helpers.avatarURL(url.id, url.discriminator, {
                    avatar: url.avatar!,
                    size: 2048,
                }),
            };
        }
        return this;
    }

    setTimestamp(time = Date.now()) {
        this.#getLastEmbed().timestamp = new Date(time).toISOString();
        return this;
    }
    
    setTitle(title: string, url?: string) {
        this.#getLastEmbed().title = this.fitData(title, embedLimits.title);
        if (url) this.#getLastEmbed().url = url;
        return this;
    }
    
    setThumbnail(url: string) {
        this.#getLastEmbed().thumbnail = { url };
        return this;
    }
    
    addEmbed(embed?: Embed) {
        if (this.length === 10) return this;
        this.push({ ...embed, fields: embed?.fields ?? [] });
        return this;
    }

    /* get the last Embed, if there is no it will create one */
    #getLastEmbed() {
        if (this.length) return this[this.length - 1];
        this.push({
            fields: [],
        });
        return this[0];
    }
}

export interface EmbedFile {
    blob: unknown;
    name: string;
}

export default Embeds;