import { ok, created, noContent, badRequest, serverError, parseJsonBody } from "../utils/http.mjs";
import { createExercise, getExerciseById, listExercises, removeExercise, patchExercise } from "../services/exercise.service.mjs";

export async function handleExercises(event) {
    try {
        const method = event.requestContext?.http?.method || event.httpMethod; // REST or HTTP API
        if (method === "OPTIONS") return ok({}); // CORS preflight

        if (method === "GET") {
            const id = event.pathParameters?.exerciceId;
            if (id) {
                const exercise = await getExerciseById(id);
                return ok(exercise);
            } else {
                const exercises = await listExercises();
                return ok({ exercises });
            }
        }

        if (method === "POST") {
            const body = parseJsonBody(event);
            if (!body.name) return badRequest("Missing 'name'");
            const doc = await createExercise(body);
            return created(doc);
        }

        if (method === "PATCH") {
            const id = event.pathParameters?.exerciseId;
            if (!id) return badRequest("Missing id");
            const body = parseJsonBody(event);
            const updated = await patchExercise(id, body);
            return ok(updated);
        }

        if (method === "DELETE") {
            const id = event.pathParameters?.exerciseId;
            if (!id) return badRequest("Missing id");
            await removeExercise(id);
            return noContent();
        }

        return badRequest("Unsupported method");
    } catch (err) {
        return serverError(err);
    }
}