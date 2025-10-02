import { 
    findWeightById, 
    deleteWeight, 
    findWeights, 
    updateWeight, 
    insertWeight,
    findLatestWeight 
} from "../models/weight.model.mjs";

export async function listWeights() {
    return findWeights();
}

export async function createWeight(payload) {
    const now = new Date().toISOString();
    return insertWeight({
        weight: payload.weight,
        unit: payload.unit || 'kg',
        measureDate: payload.measureDate || now,
        notes: payload.notes,
        createdAt: now,
        updatedAt: now
    });
}

export async function patchWeight(id, payload) {
    const patch = { ...payload, updatedAt: new Date().toISOString() };
    return updateWeight(id, patch);
}

export async function removeWeight(id) {
    await deleteWeight(id);
    return true;
}

export async function getWeightById(id) {
    return findWeightById(id);
}

export async function getLatestWeight() {
    return findLatestWeight();
}