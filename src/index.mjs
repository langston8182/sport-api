import {handleExercises} from "./controllers/exercise.controller.mjs";
import { handleSessions } from "./controllers/session.controller.mjs";
import { handlePrograms } from "./controllers/program.controller.mjs";
import { handleWeights } from "./controllers/weight.controller.mjs";
import { handleExerciseWeights, handleExerciseProgression } from "./controllers/exercise-weights.controller.mjs";
import {ok, notFound} from "./utils/http.mjs";

// normalise un path comme /api/v1/expenses/123 -> ["expenses", "123"]
function seg(event) {
    const raw = event.rawPath || event.path || "";
    const path = raw.replace(/^\/+|\/+$/g, "");
    return path.split("/").filter(Boolean);
}

export const handler = async (event) => {
    const method = event.requestContext?.http?.method || event.httpMethod || "GET";
    const s = seg(event);

    // CORS preflight
    if (method === "OPTIONS") return ok({});

    // Routing simple
    if (s[0] === "exercises") {
        // Route pour la progression d'un exercice spécifique
        if (s[1] && s[2] === "progression") {
            return handleExerciseProgression(event);
        }
        return handleExercises(event);
    }
    if (s[0] === "sessions") return handleSessions(event);
    if (s[0] === "programs") return handlePrograms(event);
    if (s[0] === "weights") return handleWeights(event);
    if (s[0] === "exercise-weights") return handleExerciseWeights(event);

    return notFound("Route not found");
};