/* start file for rest process */
import { DISCORD_TOKEN, REST_AUTH_KEY, REST_PORT } from "../../config.ts";
import { BASE_URL, createRestManager } from "../../deps.ts";
import { log } from "../utils/logger.ts";

/* creates the functionality for managing the rest requests */
const rest = createRestManager({
    token: DISCORD_TOKEN,
    secretKey: REST_AUTH_KEY,
    customUrl: `http://localhost:${REST_PORT}`,
    debug: console.log,
});

/* start listening to the url(localhost) */
const server = Deno.listen({ port: REST_PORT });
log.info(
    `HTTP webserver running.  Access it at:  http://localhost:${REST_PORT}/`,
);

/* connections to the server will be yielded up as an async iterable */
for await (const conn of server) {
    /**
     * in order to not be blocking, we need to handle each connection individually
     * in its own async function
     */
    handleRequest(conn);
}

async function handleRequest(conn: Deno.Conn) {
    /* this 'upgrades' a network connection into an HTTp connection */
    const httpConn = Deno.serveHttp(conn);
    /**
     * each request sent over the HTTP connection will be yielded as an async
     * iterator from the HTTP connection
     */
    for await (const requestEvent of httpConn) {
        if (
            !REST_AUTH_KEY || REST_AUTH_KEY !== requestEvent.request.headers.get('AUTHORIZATION')
        ) {
            return requestEvent.respondWith( new Response(JSON.stringify({ error: 'Invalid authorization key.' }), {
                status: 401,
            }));
        }

        const json = (await requestEvent.request.json());

        try {
            const result = await rest.runMethod(
                rest,
                requestEvent.request.method as RequestMethod,
                `${BASE_URL}${
                    requestEvent.request.url.substring(
                        `http://localhost:${REST_PORT}`.length,
                    )
                }`,
                json,
            );

            if (result) {
                requestEvent.respondWith(
                    new Response(undefined, {
                        status: 204,
                    }),
                );
            }
        } catch (error) {
            log.error(error);
            requestEvent.respondWith(
                new Response(JSON.stringify(error), {
                    status: error.code,
                }),
            );
        }
    }
}

type RequestMethod = "get" | "post" | "put" | "delete" | "patch";