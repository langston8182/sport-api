import {
    findSessionById,
    deleteSession,
    findSessions,
    updateSession,
    insertSession
} from "../models/session.model.mjs";

export async function listSessions() {
    return findSessions();
}

export async function createSession(payload) {
    const now = new Date().toISOString();
    return insertSession({
        name: payload.name,
        items: payload.items || [],
        createdAt: now,
        updatedAt: now
    });
}

export async function patchSession(id, payload) {
    const patch = { ...payload, updatedAt: new Date().toISOString() };
    return updateSession(id, patch);
}

export async function removeSession(id) {
    await deleteSession(id);
    return true;
}

export async function getSessionById(id) {
    return findSessionById(id);
}