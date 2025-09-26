import {
    insertProgram,
    findPrograms,
    findProgramById,
    updateProgram,
    deleteProgram,
    addScheduleEntry,
    replaceScheduleEntry,
    removeScheduleEntry
} from "../models/program.model.mjs";

// Lister tous les programmes
export async function listPrograms() {
    return findPrograms();
}

// Créer un programme
export async function createProgram(payload) {
    const now = new Date().toISOString();
    return insertProgram({
        name: payload.name,
        weeks: payload.weeks,
        sessionsPerWeek: payload.sessionsPerWeek,
        schedule: payload.schedule || [],
        createdAt: now,
        updatedAt: now
    });
}

// Récupérer un programme par ID
export async function getProgramById(id) {
    return findProgramById(id);
}

// Mettre à jour un programme
export async function patchProgram(id, payload) {
    const patch = { ...payload, updatedAt: new Date().toISOString() };
    return updateProgram(id, patch);
}

// Supprimer un programme
export async function removeProgram(id) {
    await deleteProgram(id);
    return true;
}

/**
 * ---------- Gestion du planning ----------
 * Ici on ajoute un peu de logique métier avant d’appeler le model.
 */

// Ajouter une entrée au planning
export async function addProgramScheduleEntry(programId, entry) {
    if (!entry.week || !entry.slot || !entry.sessionId) {
        throw new Error("Invalid schedule entry: week, slot, sessionId are required");
    }

    // Générer un entryId si absent (ex: wk{week}-s{slot})
    if (!entry.entryId) {
        entry.entryId = `wk${entry.week}-s${entry.slot}`;
    }

    entry.addedAt = new Date().toISOString();

    return addScheduleEntry(programId, entry);
}

// Remplacer une entrée du planning
export async function replaceProgramScheduleEntry(programId, entryId, newEntry) {
    if (!entryId) {
        throw new Error("Missing entryId for schedule replacement");
    }

    if (!newEntry.week || !newEntry.slot || !newEntry.sessionId) {
        throw new Error("Invalid new schedule entry: week, slot, sessionId are required");
    }

    // Forcer le même entryId
    newEntry.entryId = entryId;
    newEntry.updatedAt = new Date().toISOString();

    return replaceScheduleEntry(programId, entryId, newEntry);
}

// Supprimer une entrée du planning
export async function removeProgramScheduleEntry(programId, entryId) {
    if (!entryId) {
        throw new Error("Missing entryId for schedule removal");
    }
    return removeScheduleEntry(programId, entryId);
}