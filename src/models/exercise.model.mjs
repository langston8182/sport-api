import {ObjectId} from "mongodb";
import {getDb} from "../utils/db.mjs";

const COL = "exercises";

export async function insertExercise(doc) {
    const db = await getDb();
    const { insertedId } = await db.collection(COL).insertOne(doc);
    return { ...doc, _id: insertedId };
}

export async function findExercises() {
    const db = await getDb();
    return db.collection(COL).find({}).sort({ name: 1 }).toArray();
}

export async function updateExercise(id, patch) {
    const db = await getDb();
    return await db.collection(COL).findOneAndUpdate(
        {_id: new ObjectId(id)},
        {$set: patch},
        {returnDocument: "after"}
    );
}

export async function findExerciseById(id) {
    const db = await getDb();
    return db.collection(COL).findOne({ _id: new ObjectId(id) });
}

export async function deleteExercise(id) {
    const db = await getDb();
    await db.collection(COL).deleteOne({ _id: new ObjectId(id) });
}