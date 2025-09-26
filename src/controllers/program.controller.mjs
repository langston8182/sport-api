import {
    ok,
    created,
    noContent,
    badRequest,
    serverError,
    parseJsonBody
} from "../utils/http.mjs";

import {
    createProgram,
    getProgramById,
    listPrograms,
    removeProgram,
    patchProgram,
    addProgramScheduleEntry,
    replaceProgramScheduleEntry,
    removeProgramScheduleEntry
} from "../services/program.service.mjs";

export async function handlePrograms(event) {
    try {
        const method = event.requestContext?.http?.method || event.httpMethod;
        if (method === "OPTIONS") return ok({}); // Préflight CORS

        const id = event.pathParameters?.programId;
        const entryId = event.pathParameters?.entryId;

        if (method === "GET" && !entryId) {
            if (id) {
                const program = await getProgramById(id);
                return ok(program);
            } else {
                const programs = await listPrograms();
                return ok({ programs });
            }
        }

        if (method === "POST" && !id) {
            const body = parseJsonBody(event);
            if (!body.name) return badRequest("Missing 'name'");
            if (!body.weeks || !body.sessionsPerWeek) {
                return badRequest("Missing 'weeks' or 'sessionsPerWeek'");
            }
            const doc = await createProgram(body);
            return created(doc);
        }

        if (method === "PATCH" && id && !entryId) {
            const body = parseJsonBody(event);
            const updated = await patchProgram(id, body);
            return ok(updated);
        }

        if (method === "DELETE" && id && !entryId) {
            await removeProgram(id);
            return noContent();
        }

        // ---------- Gestion du planning ----------
        if (id && !entryId && method === "POST") {
            // POST /programs/:programId/schedule
            const body = parseJsonBody(event);
            const updated = await addProgramScheduleEntry(id, body);
            return ok(updated);
        }

        if (id && entryId && method === "PUT") {
            // PUT /programs/:programId/schedule/:entryId
            const body = parseJsonBody(event);
            const updated = await replaceProgramScheduleEntry(id, entryId, body);
            return ok(updated);
        }

        if (id && entryId && method === "DELETE") {
            // DELETE /programs/:programId/schedule/:entryId
            const updated = await removeProgramScheduleEntry(id, entryId);
            return ok(updated);
        }

        return badRequest("Unsupported method or route");
    } catch (err) {
        return serverError(err);
    }
}