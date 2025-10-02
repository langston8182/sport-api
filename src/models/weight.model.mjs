import {ObjectId} from "mongodb";
import {getDb} from "../utils/db.mjs";

const COL = "weights";

export async function insertWeight(doc) {
    const db = await getDb();
    const { insertedId } = await db.collection(COL).insertOne(doc);
    return { ...doc, _id: insertedId };
}

export async function findWeights() {
    const db = await getDb();
    return db.collection(COL).find({}).sort({ measureDate: -1 }).toArray();
}

export async function updateWeight(id, patch) {
    const db = await getDb();
    return await db.collection(COL).findOneAndUpdate(
        {_id: new ObjectId(id)},
        {$set: patch},
        {returnDocument: "after"}
    );
}

export async function findWeightById(id) {
    const db = await getDb();
    return db.collection(COL).findOne({ _id: new ObjectId(id) });
}

export async function deleteWeight(id) {
    const db = await getDb();
    await db.collection(COL).deleteOne({ _id: new ObjectId(id) });
}

export async function findLatestWeight() {
    const db = await getDb();
    return db.collection(COL)
        .findOne(
            {}, 
            { sort: { measureDate: -1 } }
        );
}