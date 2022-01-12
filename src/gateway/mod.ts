import {
    DISCORD_TOKEN,
    EVENT_HANDLER_PORT,
    EVENT_HANDLER_SECRET_KEY,
    EVENT_HANDLER_URL,
    GATEWAY_INTENTS,
    REST_AUTH_KEY,
    REST_PORT,
} from '../../config.ts';

import {
    createGatewayManager,
    createRestManager,
    endpoints
} from '../../deps.ts';

/* initializing a simple rest manager */
const rest = createRestManager({
    token: DISCORD_TOKEN,
    secretKey: REST_AUTH_KEY,
    customUrl: `http://localhost:${REST_PORT}`,
});

/* calling the rest process to get gateway data */
const result = await rest.runMethod(
    rest,
    "get",
    endpoints.GATEWAY_BOT
).then((res) => ({
    url: res.url,
    shards: res.shards,
    sessionStartLimit: {
        total: res.session_start_limit.total,
        remaining: res.session_start_limit.remaining,
        resetAfter: res.session_start_limit.reset_after,
        maxConcurrency: res.session_start_limit.max_concurrency,
    },
}));

const gateway = createGatewayManager({
    /**
     * for debugging
     * debug: console.log,
     * 
     * the authorization we will use on our event handler
     */
    secretKey: EVENT_HANDLER_SECRET_KEY,
    token: DISCORD_TOKEN,
    intents: GATEWAY_INTENTS,
    /* load data from discords recommendations on your custom ones here */
    shardsRecommended: result.shards,
    sessionStartLimitTotal: result.sessionStartLimit.total,
    sessionStartLimitRemaining: result.sessionStartLimit.remaining,
    sessionStartLimitResetAfter: result.sessionStartLimit.resetAfter,
    maxConcurrency: result.sessionStartLimit.maxConcurrency,
    maxShards: result.shards,
    lastShardId: result.shards,

    /* this will basically be the handler for your events */
    handleDiscordPayload: async function (_, data, shardId) {
        /* ToDo: change from sending through HTTP to using a WS for faster processing, or http3 or whatever */
        if (!data.t) return;
        
        await fetch(`${EVENT_HANDLER_URL}:${EVENT_HANDLER_PORT}`, {
            headers: {
                Authorization: gateway.secretKey,
            },
            method: 'POST',
            body: JSON.stringify({
                shardId,
                data,
            }),
        })
        /**
         * handling the deno memory leak
         */
        .then((res) => res.text())
        .catch(() => null);
    },
});

/* starting the gateway */
gateway.spawnShards(gateway)