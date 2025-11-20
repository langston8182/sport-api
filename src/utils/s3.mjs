import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "node:crypto";

const s3 = new S3Client({});

const BUCKET = process.env.BUCKET_NAME;             // ex: sport-media-preprod
const ORIGINALS_PREFIX = process.env.ORIGINALS_PREFIX || "originals/";
const UPLOAD_EXPIRES_SEC = parseInt(process.env.UPLOAD_EXPIRES_SEC || "300", 10); // 5 min

export function newObjectKey(ext = "jpg") {
    const id = crypto.randomUUID();
    const safeExt = String(ext).replace(/[^a-z0-9]/gi, "") || "jpg";
    return `${ORIGINALS_PREFIX}${id}.${safeExt}`;
}

export async function presignPutUrl({ key, contentType, expiresInSec = UPLOAD_EXPIRES_SEC }) {
    const cmd = new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        ContentType: contentType || "application/octet-stream",
    });
    const url = await getSignedUrl(s3, cmd, { expiresIn: expiresInSec });
    return url;
}
