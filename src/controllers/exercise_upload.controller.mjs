import { ok, badRequest, serverError, parseJsonBody } from "../utils/http.mjs";
import { newObjectKey, presignPutUrl } from "../utils/s3.mjs";

const ALLOWED_MIME = (process.env.ALLOWED_IMAGE_MIME || "image/jpeg,image/png,image/webp")
    .split(",").map(s => s.trim().toLowerCase()).filter(Boolean);

export async function handleExerciseUploadInit(event) {
    try {
        const method = event.requestContext?.http?.method || event.httpMethod;
        if (method !== "POST") return badRequest("Unsupported method");

        const body = parseJsonBody(event) || {};
        const { contentType = "image/jpeg", ext = "jpg" } = body;

        if (!ALLOWED_MIME.includes(String(contentType).toLowerCase())) {
            return badRequest(`Unsupported contentType. Allowed: ${ALLOWED_MIME.join(", ")}`);
        }

        const key = newObjectKey(ext);
        const uploadUrl = await presignPutUrl({ key, contentType });
        return ok({
            uploadUrl,
            object: { key, contentType },
            expiresInSec: parseInt(process.env.UPLOAD_EXPIRES_SEC || "300", 10),
        });
    } catch (err) {
        return serverError(err);
    }
}
