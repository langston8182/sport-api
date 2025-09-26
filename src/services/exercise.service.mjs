import { findExerciseById, deleteExercise, findExercises, updateExercise, insertExercise } from "../models/exercise.model.mjs";

export async function listExercises() {
    return findExercises();
}

export async function createExercise(payload) {
    const now = new Date().toISOString();
    return insertExercise({
        name: payload.name,
        mode: payload.mode,
        imageUrl: payload.imageUrl,
        createdAt: now,
        updatedAt: now
    });
}

export async function patchExercise(id, payload) {
    const patch = { ...payload, updatedAt: new Date().toISOString() };
    return updateExercise(id, patch);
}

export async function removeExercise(id) {
    await deleteExercise(id);
    return true;
}

export async function getExerciseById(id) {
    return findExerciseById(id);
}