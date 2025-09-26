import {ObjectId} from "mongodb";
import {getDb} from "../utils/db.mjs";

const COL = "sessions";

// Insérer une nouvelle séance
export async function insertSession(doc) {
    const db = await getDb();
    const { insertedId } = await db.collection(COL).insertOne(doc);
    return { ...doc, _id: insertedId };
}

// Récupérer toutes les séances
export async function findSessions() {
    const db = await getDb();
    return db.collection(COL).find({}).sort({ name: 1 }).toArray();
}

// Récupérer une séance par son ID
export async function findSessionById(id) {
    const db = await getDb();
    return db.collection(COL).findOne({ _id: new ObjectId(id) });
}

// Mettre à jour une séance (retourne la version mise à jour)
export async function updateSession(id, patch) {
    const db = await getDb();
    return await db.collection(COL).findOneAndUpdate(
        {_id: new ObjectId(id)},
        {$set: patch},
        {returnDocument: "after"}
    );
}

// Supprimer une séance
export async function deleteSession(id) {
    const db = await getDb();
    await db.collection(COL).deleteOne({ _id: new ObjectId(id) });
}