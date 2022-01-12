import { ActionRow, ButtonStyles, MessageComponentTypes } from "../../deps.ts";
import { SNOWFLAKE_REGEX } from "../constants/regexes.ts";

export class Components extends Array<ActionRow> {
    constructor(...args: ActionRow[]) {
        super(...args);
        return this;
    }

    addActionRow() {
        /* don;t allow more than 5 action rows */
        if (this.length === 5) return this;
        this.push({
            type: 1,
            components: [] as unknown as ActionRow["components"],
        });
        return this;
    }

    addButton(
        label: string,
        style: keyof typeof ButtonStyles,
        customIdOrLink: string,
        options?: { emoji?: string | bigint; disabled?: boolean },
    ) {
        /* no action row has been created so do it */
        if (!this.length) this.addActionRow();
        /* get the last action row */
        let row = this[this.length - 1];
        /* if the action row already has 5 buttons create a new one */
        if (row.components.length === 5) {
            this.addActionRow();
            row = this[this.length - 1];
            /* apparently there are already 5 full rows so don't add the button */
            if (row.components.length === 5) return this;
        }

        row.components.push({
            type: MessageComponentTypes.Button,
            label: label,
            customId: style !== "Link" ? customIdOrLink : undefined,
            style: ButtonStyles[style],
            emoji: this.#stringToEmoji(options?.emoji),
            url: style === "Link" ? customIdOrLink : undefined,
            disabled: options?.disabled,
        });
        return this;
    }

    #stringToEmoji(emoji?: string | bigint) {
        if (!emoji) return;
        emoji = emoji.toString();
        /* a snowflake id was provided */
        if (SNOWFLAKE_REGEX.test(emoji)) {
            return {
                id: emoji.match(SNOWFLAKE_REGEX)![0],
            };
        }
        /* a unicode emoji was provided */
        return {
            name: emoji,
        };
    }
}