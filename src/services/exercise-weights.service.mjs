import {
    insertExerciseWeight,
    findExerciseWeightsByExerciseId,
    findExerciseWeightsBySessionId,
    findExerciseWeightById,
    findExerciseWeightBySessionAndExercise,
    updateExerciseWeight,
    deleteExerciseWeight,
    deleteExerciseWeightsBySessionId
} from "../models/exercise-weights.model.mjs";
import { findExerciseById } from "../models/exercise.model.mjs";

// Créer un nouveau poids d'exercice
export async function createExerciseWeight(payload) {
    // Vérifier que l'exercice existe et a le mode "reps"
    const exercise = await findExerciseById(payload.exerciseId);
    if (!exercise) {
        throw new Error("Exercise not found");
    }
    
    if (exercise.mode !== "reps") {
        throw new Error("Weight tracking is only available for exercises with 'reps' mode");
    }

    const now = new Date().toISOString();
    return insertExerciseWeight({
        exerciseId: payload.exerciseId,
        sessionId: payload.sessionId,
        weight: payload.weight,
        unit: payload.unit || "kg",
        setNumber: payload.setNumber || 1, // Numéro de la série (1, 2, 3...)
        reps: payload.reps, // Nombre de répétitions effectuées
        createdAt: now,
        updatedAt: now
    });
}

// Lister les poids d'exercice par exercice (historique de progression)
export async function listExerciseWeightsByExercise(exerciseId) {
    return findExerciseWeightsByExerciseId(exerciseId);
}

// Lister les poids d'exercice par session
export async function listExerciseWeightsBySession(sessionId) {
    return findExerciseWeightsBySessionId(sessionId);
}

// Récupérer un poids d'exercice par son ID
export async function getExerciseWeightById(id) {
    const weight = await findExerciseWeightById(id);
    if (!weight) {
        throw new Error("Exercise weight not found");
    }
    return weight;
}

// Récupérer les poids pour un exercice spécifique dans une session
export async function getExerciseWeightsBySessionAndExercise(sessionId, exerciseId) {
    return findExerciseWeightBySessionAndExercise(sessionId, exerciseId);
}

// Mettre à jour un poids d'exercice
export async function patchExerciseWeight(id, payload) {
    const patch = { ...payload, updatedAt: new Date().toISOString() };
    const result = await updateExerciseWeight(id, patch);
    if (!result) {
        throw new Error("Exercise weight not found");
    }
    return result;
}

// Supprimer un poids d'exercice
export async function removeExerciseWeight(id) {
    await deleteExerciseWeight(id);
    return true;
}

// Supprimer tous les poids d'exercice pour une session (utile lors de la suppression d'une session)
export async function removeExerciseWeightsBySession(sessionId) {
    await deleteExerciseWeightsBySessionId(sessionId);
    return true;
}

// Récupérer l'historique de progression pour un exercice (poids max, progression...)
export async function getExerciseProgression(exerciseId) {
    const weights = await findExerciseWeightsByExerciseId(exerciseId);
    
    if (weights.length === 0) {
        return {
            exerciseId,
            totalSessions: 0,
            maxWeight: null,
            latestWeight: null,
            progression: []
        };
    }

    // Grouper par session et calculer les stats
    const sessionStats = {};
    weights.forEach(weight => {
        if (!sessionStats[weight.sessionId]) {
            sessionStats[weight.sessionId] = {
                sessionId: weight.sessionId,
                date: weight.createdAt,
                maxWeight: weight.weight,
                totalSets: 0,
                weights: []
            };
        }
        
        sessionStats[weight.sessionId].weights.push(weight);
        sessionStats[weight.sessionId].totalSets++;
        
        if (weight.weight > sessionStats[weight.sessionId].maxWeight) {
            sessionStats[weight.sessionId].maxWeight = weight.weight;
        }
    });

    const progression = Object.values(sessionStats).sort((a, b) => new Date(a.date) - new Date(b.date));
    const maxWeight = Math.max(...weights.map(w => w.weight));
    const latestSession = progression[progression.length - 1];

    return {
        exerciseId,
        totalSessions: progression.length,
        maxWeight,
        latestWeight: latestSession ? latestSession.maxWeight : null,
        progression
    };
}