import { ok, created, noContent, badRequest, serverError, parseJsonBody } from "../utils/http.mjs";
import { 
    createWeight, 
    getWeightById, 
    listWeights, 
    removeWeight, 
    patchWeight,
    getLatestWeight 
} from "../services/weight.service.mjs";

export async function handleWeights(event) {
    try {
        const method = event.requestContext?.http?.method || event.httpMethod; // REST or HTTP API
        if (method === "OPTIONS") return ok({}); // CORS preflight

        if (method === "GET") {
            const id = event.pathParameters?.weightId;
            const latest = event.queryStringParameters?.latest === 'true';
            
            if (id) {
                const weight = await getWeightById(id);
                return ok(weight);
            } else if (latest) {
                const weight = await getLatestWeight();
                return ok(weight);
            } else {
                const weights = await listWeights();
                return ok({ weights });
            }
        }

        if (method === "POST") {
            const body = parseJsonBody(event);
            if (!body.weight) return badRequest("Missing 'weight'");
            if (isNaN(body.weight) || body.weight <= 0) return badRequest("Invalid 'weight' value");
            
            const doc = await createWeight(body);
            return created(doc);
        }

        if (method === "PATCH") {
            const id = event.pathParameters?.weightId;
            if (!id) return badRequest("Missing id");
            const body = parseJsonBody(event);
            
            if (body.weight && (isNaN(body.weight) || body.weight <= 0)) {
                return badRequest("Invalid 'weight' value");
            }
            
            const updated = await patchWeight(id, body);
            return ok(updated);
        }

        if (method === "DELETE") {
            const id = event.pathParameters?.weightId;
            if (!id) return badRequest("Missing id");
            await removeWeight(id);
            return noContent();
        }

        return badRequest("Unsupported method");
    } catch (err) {
        return serverError(err);
    }
}