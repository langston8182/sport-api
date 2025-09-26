import {
    ok,
    created,
    noContent,
    badRequest,
    serverError,
    parseJsonBody
} from "../utils/http.mjs";

import {
    createSession,
    getSessionById,
    listSessions,
    removeSession,
    patchSession
} from "../services/session.service.mjs";

export async function handleSessions(event) {
    try {
        const method = event.requestContext?.http?.method || event.httpMethod; // HTTP API v2 ou REST API
        if (method === "OPTIONS") return ok({}); // Préflight CORS

        if (method === "GET") {
            const id = event.pathParameters?.sessionId;
            if (id) {
                const session = await getSessionById(id);
                return ok(session);
            } else {
                const sessions = await listSessions();
                return ok({ sessions });
            }
        }

        if (method === "POST") {
            const body = parseJsonBody(event);
            if (!body.name) return badRequest("Missing 'name'");
            const doc = await createSession(body);
            return created(doc);
        }

        if (method === "PATCH") {
            const id = event.pathParameters?.sessionId;
            if (!id) return badRequest("Missing id");
            const body = parseJsonBody(event);
            const updated = await patchSession(id, body);
            return ok(updated);
        }

        if (method === "DELETE") {
            const id = event.pathParameters?.sessionId;
            if (!id) return badRequest("Missing id");
            await removeSession(id);
            return noContent();
        }

        return badRequest("Unsupported method");
    } catch (err) {
        return serverError(err);
    }
}