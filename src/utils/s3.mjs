import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "node:crypto";
import {getConfigValue} from "./config.appconfig.mjs";

const s3 = new S3Client({});
const ENV = process.env.ENVIRONMENT || "preprod";

const BUCKET = process.env.BUCKET_NAME;             // ex: sport-media-preprod
const ORIGINALS_PREFIX = process.env.ORIGINALS_PREFIX || "originals/";
const UPLOAD_EXPIRES_SEC = parseInt(process.env.UPLOAD_EXPIRES_SEC || "300", 10); // 5 min

export async function newObjectKey(ext = "jpg") {
    const envCfg = await getConfigValue("upload_image", ENV, {});
    const id = crypto.randomUUID();
    const safeExt = String(ext).replace(/[^a-z0-9]/gi, "") || "jpg";
    return `${envCfg.ORIGINALS_PREFIX}${id}.${safeExt}`;
}

export async function presignPutUrl({ key, contentType, expiresInSec = UPLOAD_EXPIRES_SEC }) {
    const envCfg = await getConfigValue("upload_image", ENV, {});
    const cmd = new PutObjectCommand({
        Bucket: envCfg.BUCKET,
        Key: key,
        ContentType: contentType || "application/octet-stream",
    });
    const url = await getSignedUrl(s3, cmd, { expiresIn: expiresInSec });
    return url;
}
