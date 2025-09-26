import {ObjectId} from "mongodb";
import {getDb} from "../utils/db.mjs";

const COL = "programs";

// Créer un programme
export async function insertProgram(doc) {
    const db = await getDb();
    const { insertedId } = await db.collection(COL).insertOne(doc);
    return { ...doc, _id: insertedId };
}

// Lister les programmes
export async function findPrograms() {
    const db = await getDb();
    return db.collection(COL).find({}).sort({ name: 1 }).toArray();
}

// Récupérer un programme par ID
export async function findProgramById(id) {
    const db = await getDb();
    return db.collection(COL).findOne({ _id: new ObjectId(id) });
}

// Mettre à jour un programme (retourne la version après MAJ)
export async function updateProgram(id, patch) {
    const db = await getDb();
    return await db.collection(COL).findOneAndUpdate(
        {_id: new ObjectId(id)},
        {$set: patch},
        {returnDocument: "after"}
    );
}

// Supprimer un programme
export async function deleteProgram(id) {
    const db = await getDb();
    await db.collection(COL).deleteOne({ _id: new ObjectId(id) });
}

/**
 * ---- Helpers planning (schedule) ----
 * Chaque entrée de schedule est typiquement :
 * { entryId: "wk1-s1", week: 1, slot: 1, sessionId: ObjectId, sessionSnapshot?: {...} }
 */

// Ajouter une entrée au planning (retourne le programme MAJ)
export async function addScheduleEntry(programId, entry) {
    const db = await getDb();
    return await db.collection(COL).findOneAndUpdate(
        {_id: new ObjectId(programId)},
        {$push: {schedule: entry}},
        {returnDocument: "after"}
    );
}

// Remplacer une entrée existante identifiée par entryId (retourne le programme MAJ)
export async function replaceScheduleEntry(programId, entryId, newEntry) {
    const db = await getDb();
    return await db.collection(COL).findOneAndUpdate(
        {_id: new ObjectId(programId)},
        {$set: {"schedule.$[e]": newEntry}},
        {arrayFilters: [{"e.entryId": entryId}], returnDocument: "after"}
    );
}

// Retirer une entrée du planning par entryId (retourne le programme MAJ)
export async function removeScheduleEntry(programId, entryId) {
    const db = await getDb();
    return await db.collection(COL).findOneAndUpdate(
        {_id: new ObjectId(programId)},
        {$pull: {schedule: {entryId}}},
        {returnDocument: "after"}
    );
}