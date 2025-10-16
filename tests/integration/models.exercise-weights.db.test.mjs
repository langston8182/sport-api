import {jest} from "@jest/globals";
import {MongoMemoryServer} from "mongodb-memory-server";

let mongod;
let model;
let exerciseModel;
let getDb;
const OLD_ENV = {...process.env};

function setEnv(key, value) {
    if (value === undefined || value === null) return;
    process.env[key] = String(value);
}

beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();

    // Mock la config pour pointer vers Mongo in-memory
    await jest.unstable_mockModule("../../src/utils/config.appconfig.mjs", () => ({
        getConfigValue: async (profileName, key) => {
            if (profileName === "mongodb") {
                return uri;
            }
            return undefined;
        }
    }));

    setEnv("DB_NAME", "testdb");
    setEnv("ENVIRONMENT", "preprod");
    setEnv("APP_NAME", "sport");

    jest.resetModules();

    model = await import("../../src/models/exercise-weights.model.mjs");
    exerciseModel = await import("../../src/models/exercise.model.mjs");
    ({ getDb } = await import("../../src/utils/db.mjs"));

    const db = await getDb();
    await db.dropDatabase();
});

beforeEach(async () => {
    const db = await getDb();
    await db.dropDatabase();
});

afterAll(async () => {
    for (const k of Object.keys(process.env)) {
        if (!(k in OLD_ENV)) delete process.env[k];
    }
    for (const [k, v] of Object.entries(OLD_ENV)) {
        process.env[k] = v;
    }

    try {
        const { closeDb } = await import("../../src/utils/db.mjs");
        await closeDb();
    } catch (e) {
        console.error("Error closing DB", e);
    }

    if (mongod) {
        await mongod.stop();
    }
});

test("insert/find/update/delete exercise weights (modèle)", async () => {
    // Créer d'abord un exercice de test
    const exercise = await exerciseModel.insertExercise({
        name: "Bench Press",
        mode: "reps",
        imageUrl: "https://example.com/bench.jpg",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    });

    const createdAt = new Date().toISOString();
    const doc = await model.insertExerciseWeight({
        exerciseId: String(exercise._id),
        sessionId: "session123",
        weight: 80.5,
        unit: "kg",
        setNumber: 1,
        reps: 12,
        createdAt,
        updatedAt: createdAt
    });
    expect(doc._id).toBeDefined();
    expect(doc.weight).toBe(80.5);
    expect(doc.unit).toBe("kg");
    expect(doc.reps).toBe(12);

    // Test findExerciseWeightsByExerciseId
    const byExercise = await model.findExerciseWeightsByExerciseId(String(exercise._id));
    expect(byExercise.length).toBe(1);
    expect(byExercise[0].weight).toBe(80.5);

    // Test findExerciseWeightsBySessionId
    const bySession = await model.findExerciseWeightsBySessionId("session123");
    expect(bySession.length).toBe(1);
    expect(bySession[0].weight).toBe(80.5);

    // Test findExerciseWeightById
    const weight = await model.findExerciseWeightById(String(doc._id));
    expect(weight.weight).toBe(80.5);

    // Test findExerciseWeightBySessionAndExercise
    const bySessionAndExercise = await model.findExerciseWeightBySessionAndExercise(
        "session123", 
        String(exercise._id)
    );
    expect(bySessionAndExercise.length).toBe(1);
    expect(bySessionAndExercise[0].weight).toBe(80.5);

    // Test updateExerciseWeight
    await model.updateExerciseWeight(String(doc._id), { 
        weight: 85.0, 
        updatedAt: new Date().toISOString() 
    });
    const byExerciseAfterUpdate = await model.findExerciseWeightsByExerciseId(String(exercise._id));
    expect(byExerciseAfterUpdate[0].weight).toBe(85.0);

    // Test deleteExerciseWeight
    await model.deleteExerciseWeight(String(doc._id));
    const after = await model.findExerciseWeightsByExerciseId(String(exercise._id));
    expect(after.length).toBe(0);
});

test("deleteExerciseWeightsBySessionId should remove all weights for a session", async () => {
    // Créer d'abord un exercice de test
    const exercise = await exerciseModel.insertExercise({
        name: "Squat",
        mode: "reps",
        imageUrl: "https://example.com/squat.jpg",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    });

    const createdAt = new Date().toISOString();
    
    // Insérer plusieurs poids pour la même session
    await model.insertExerciseWeight({
        exerciseId: String(exercise._id),
        sessionId: "session456",
        weight: 100.0,
        unit: "kg",
        setNumber: 1,
        reps: 8,
        createdAt,
        updatedAt: createdAt
    });

    await model.insertExerciseWeight({
        exerciseId: String(exercise._id),
        sessionId: "session456",
        weight: 102.5,
        unit: "kg",
        setNumber: 2,
        reps: 6,
        createdAt,
        updatedAt: createdAt
    });

    // Insérer un poids pour une autre session
    await model.insertExerciseWeight({
        exerciseId: String(exercise._id),
        sessionId: "session789",
        weight: 95.0,
        unit: "kg",
        setNumber: 1,
        reps: 10,
        createdAt,
        updatedAt: createdAt
    });

    // Vérifier qu'il y a bien 3 poids au total
    const allWeights = await model.findExerciseWeightsByExerciseId(String(exercise._id));
    expect(allWeights.length).toBe(3);

    // Vérifier qu'il y a 2 poids pour la session456
    const session456Weights = await model.findExerciseWeightsBySessionId("session456");
    expect(session456Weights.length).toBe(2);

    // Supprimer tous les poids de la session456
    await model.deleteExerciseWeightsBySessionId("session456");

    // Vérifier qu'il ne reste qu'un poids (celui de la session789)
    const remainingWeights = await model.findExerciseWeightsByExerciseId(String(exercise._id));
    expect(remainingWeights.length).toBe(1);
    expect(remainingWeights[0].sessionId).toBe("session789");

    // Vérifier que la session456 n'a plus de poids
    const session456WeightsAfter = await model.findExerciseWeightsBySessionId("session456");
    expect(session456WeightsAfter.length).toBe(0);
});

test("findExerciseWeightBySessionAndExercise with multiple sets", async () => {
    // Créer d'abord un exercice de test
    const exercise = await exerciseModel.insertExercise({
        name: "Deadlift",
        mode: "reps",
        imageUrl: "https://example.com/deadlift.jpg",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    });

    const now = new Date();
    
    // Insérer plusieurs séries pour le même exercice dans la même session avec des timestamps différents
    await model.insertExerciseWeight({
        exerciseId: String(exercise._id),
        sessionId: "session100",
        weight: 120.0,
        unit: "kg",
        setNumber: 1,
        reps: 5,
        createdAt: new Date(now.getTime() - 3000).toISOString(),
        updatedAt: new Date(now.getTime() - 3000).toISOString()
    });

    await model.insertExerciseWeight({
        exerciseId: String(exercise._id),
        sessionId: "session100",
        weight: 125.0,
        unit: "kg",
        setNumber: 2,
        reps: 3,
        createdAt: new Date(now.getTime() - 2000).toISOString(),
        updatedAt: new Date(now.getTime() - 2000).toISOString()
    });

    await model.insertExerciseWeight({
        exerciseId: String(exercise._id),
        sessionId: "session100",
        weight: 130.0,
        unit: "kg",
        setNumber: 3,
        reps: 1,
        createdAt: new Date(now.getTime() - 1000).toISOString(),
        updatedAt: new Date(now.getTime() - 1000).toISOString()
    });

    // Récupérer tous les poids pour cet exercice dans cette session
    const weights = await model.findExerciseWeightBySessionAndExercise(
        "session100", 
        String(exercise._id)
    );

    expect(weights.length).toBe(3);
    
    // Vérifier que les poids sont triés par ordre de création (décroissant)
    expect(weights[0].weight).toBe(130.0); // Le plus récent
    expect(weights[1].weight).toBe(125.0);
    expect(weights[2].weight).toBe(120.0); // Le plus ancien
});