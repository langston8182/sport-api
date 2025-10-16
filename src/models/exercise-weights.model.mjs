import {ObjectId} from "mongodb";
import {getDb} from "../utils/db.mjs";

const COL = "exercise_weights";

// Insérer un nouveau poids d'exercice
export async function insertExerciseWeight(doc) {
    const db = await getDb();
    const { insertedId } = await db.collection(COL).insertOne(doc);
    return { ...doc, _id: insertedId };
}

// Récupérer tous les poids pour un exercice donné
export async function findExerciseWeightsByExerciseId(exerciseId) {
    const db = await getDb();
    return db.collection(COL).find({ exerciseId }).sort({ createdAt: -1 }).toArray();
}

// Récupérer tous les poids pour une session donnée
export async function findExerciseWeightsBySessionId(sessionId) {
    const db = await getDb();
    return db.collection(COL).find({ sessionId }).sort({ createdAt: -1 }).toArray();
}

// Récupérer un poids d'exercice par son ID
export async function findExerciseWeightById(id) {
    const db = await getDb();
    return db.collection(COL).findOne({ _id: new ObjectId(id) });
}

// Récupérer les poids pour un exercice spécifique dans une session spécifique
export async function findExerciseWeightBySessionAndExercise(sessionId, exerciseId) {
    const db = await getDb();
    return db.collection(COL).find({ sessionId, exerciseId }).sort({ createdAt: -1 }).toArray();
}

// Mettre à jour un poids d'exercice
export async function updateExerciseWeight(id, patch) {
    const db = await getDb();
    return await db.collection(COL).findOneAndUpdate(
        {_id: new ObjectId(id)},
        {$set: patch},
        {returnDocument: "after"}
    );
}

// Supprimer un poids d'exercice
export async function deleteExerciseWeight(id) {
    const db = await getDb();
    await db.collection(COL).deleteOne({ _id: new ObjectId(id) });
}

// Supprimer tous les poids d'exercice pour une session donnée
export async function deleteExerciseWeightsBySessionId(sessionId) {
    const db = await getDb();
    await db.collection(COL).deleteMany({ sessionId });
}