import {
    ok,
    created,
    noContent,
    badRequest,
    serverError,
    parseJsonBody
} from "../utils/http.mjs";

import {
    createExerciseWeight,
    getExerciseWeightById,
    listExerciseWeightsByExercise,
    listExerciseWeightsBySession,
    getExerciseWeightsBySessionAndExercise,
    getExerciseProgression,
    removeExerciseWeight,
    patchExerciseWeight
} from "../services/exercise-weights.service.mjs";

export async function handleExerciseWeights(event) {
    try {
        const method = event.requestContext?.http?.method || event.httpMethod;
        if (method === "OPTIONS") return ok({});

        // Extraire les segments de l'URL: ["exercise-weights", "id"]
        const segments = (event.rawPath || event.path || "").split("/").filter(Boolean);
        
        if (method === "GET") {
            // GET /exercise-weights/{id} - Récupérer un poids spécifique
            const weightId = event.pathParameters?.weightId || segments[1];
            if (weightId) {
                const weight = await getExerciseWeightById(weightId);
                return ok(weight);
            }

            // GET /exercise-weights?exerciseId=xxx - Lister les poids par exercice
            const exerciseId = event.queryStringParameters?.exerciseId;
            if (exerciseId) {
                const weights = await listExerciseWeightsByExercise(exerciseId);
                return ok({ weights });
            }

            // GET /exercise-weights?sessionId=xxx - Lister les poids par session
            const sessionId = event.queryStringParameters?.sessionId;
            if (sessionId) {
                const weights = await listExerciseWeightsBySession(sessionId);
                return ok({ weights });
            }

            // GET /exercise-weights?exerciseId=xxx&sessionId=yyy - Poids pour un exercice dans une session
            if (exerciseId && sessionId) {
                const weights = await getExerciseWeightsBySessionAndExercise(sessionId, exerciseId);
                return ok({ weights });
            }

            return badRequest("Missing required query parameters: exerciseId or sessionId");
        }

        if (method === "POST") {
            const body = parseJsonBody(event);
            
            // Validation des champs requis
            if (!body.exerciseId) return badRequest("Missing 'exerciseId'");
            if (!body.sessionId) return badRequest("Missing 'sessionId'");
            if (!body.weight || body.weight <= 0) return badRequest("Missing or invalid 'weight'");
            if (!body.reps || body.reps <= 0) return badRequest("Missing or invalid 'reps'");

            const doc = await createExerciseWeight(body);
            return created(doc);
        }

        if (method === "PATCH") {
            const weightId = event.pathParameters?.weightId || segments[1];
            if (!weightId) return badRequest("Missing weight ID");
            
            const body = parseJsonBody(event);
            const updated = await patchExerciseWeight(weightId, body);
            return ok(updated);
        }

        if (method === "DELETE") {
            const weightId = event.pathParameters?.weightId || segments[1];
            if (!weightId) return badRequest("Missing weight ID");
            
            await removeExerciseWeight(weightId);
            return noContent();
        }

        return badRequest("Unsupported method");
    } catch (err) {
        if (err.message.includes("not found")) {
            return badRequest(err.message);
        }
        if (err.message.includes("Weight tracking is only available")) {
            return badRequest(err.message);
        }
        return serverError(err);
    }
}

// Contrôleur séparé pour les statistiques de progression
export async function handleExerciseProgression(event) {
    try {
        const method = event.requestContext?.http?.method || event.httpMethod;
        if (method === "OPTIONS") return ok({});

        if (method === "GET") {
            const exerciseId = event.pathParameters?.exerciseId;
            if (!exerciseId) return badRequest("Missing exerciseId");

            const progression = await getExerciseProgression(exerciseId);
            return ok(progression);
        }

        return badRequest("Unsupported method");
    } catch (err) {
        return serverError(err);
    }
}