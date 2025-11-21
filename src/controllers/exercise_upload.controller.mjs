import { ok, badRequest, serverError, parseJsonBody } from "../utils/http.mjs";
import { newObjectKey, presignPutUrl } from "../utils/s3.mjs";
import {getConfigValue} from "../utils/config.appconfig.mjs";

const ENV = process.env.ENVIRONMENT || "preprod";

export async function handleExerciseUploadInit(event) {
    const envCfg = await getConfigValue("upload_image", "", {});
    try {
        const method = event.requestContext?.http?.method || event.httpMethod;
        if (method !== "POST") return badRequest("Unsupported method");

        const body = parseJsonBody(event) || {};
        const { contentType = "image/jpeg", ext = "jpg" } = body;

        if (!envCfg.ALLOWED_MIME.includes(String(contentType).toLowerCase())) {
            return badRequest(`Unsupported contentType. Allowed: ${envCfg.ALLOWED_MIME.join(", ")}`);
        }

        const key = await newObjectKey(ext);
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
