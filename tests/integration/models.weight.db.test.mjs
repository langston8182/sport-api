import {jest} from "@jest/globals";
import {MongoMemoryServer} from "mongodb-memory-server";

let mongod;
let model;
let getDb;   // pour récupérer la connexion et la fermer
const OLD_ENV = {...process.env};

function setEnv(key, value) {
    if (value === undefined || value === null) return;
    process.env[key] = String(value);
}

beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();

    // Force the app to use the in‑memory Mongo instead of real AppConfig/Secrets
    await jest.unstable_mockModule("../../src/utils/config.appconfig.mjs", () => ({
        getConfigValue: async (profileName, key) => {
            if (profileName === "mongodb") {
                // db.mjs asks for `${ENV}.MONGO_URI` → always return our in‑memory URI
                return uri;
            }
            return undefined;
        }
    }));

    // Provide a DB name for tests (used by db.mjs)
    setEnv("DB_NAME", "testdb");

    setEnv("ENVIRONMENT", "preprod");
    setEnv("APP_NAME", "sport");

    jest.resetModules();

    model = await import("../../src/models/weight.model.mjs");
    ({ getDb } = await import("../../src/utils/db.mjs"));

    // Ensure clean DB state before starting tests
    const db = await getDb();
    await db.dropDatabase();
});

beforeEach(async () => {
    const db = await getDb();
    await db.dropDatabase();
});

afterAll(async () => {
    // Restore env
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

test("insert/find/update/delete weights (modèle)", async () => {
    const createdAt = new Date().toISOString();
    const measureDate = new Date('2025-10-02T10:00:00.000Z').toISOString();
    
    const doc = await model.insertWeight({
        weight: 75.5,
        unit: "kg",
        measureDate,
        notes: "Poids après entraînement",
        createdAt,
        updatedAt: createdAt
    });
    expect(doc._id).toBeDefined();

    const all = await model.findWeights();
    expect(all.length).toBe(1);
    expect(all[0].weight).toBe(75.5);

    const weight = await model.findWeightById(String(doc._id));
    expect(weight.weight).toBe(75.5);
    expect(weight.unit).toBe("kg");

    await model.updateWeight(String(doc._id), {
        weight: 76.0, 
        notes: "Poids rectifié",
        updatedAt: new Date().toISOString()
    });
    
    const allAfterUpdate = await model.findWeights();
    expect(allAfterUpdate[0].weight).toBe(76.0);
    expect(allAfterUpdate[0].notes).toBe("Poids rectifié");

    await model.deleteWeight(String(doc._id));
    const after = await model.findWeights();
    expect(after.length).toBe(0);
});

test("findLatestWeight", async () => {
    const baseDate = new Date('2025-10-01T00:00:00.000Z');
    const createdAt = new Date().toISOString();

    // Ajouter plusieurs poids à des dates différentes
    await model.insertWeight({
        weight: 75.5,
        unit: "kg",
        measureDate: new Date(baseDate.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(), // -2 jours
        createdAt,
        updatedAt: createdAt
    });

    await model.insertWeight({
        weight: 76.0,
        unit: "kg",
        measureDate: baseDate.toISOString(), // date de base
        createdAt,
        updatedAt: createdAt
    });

    await model.insertWeight({
        weight: 74.8,
        unit: "kg",
        measureDate: new Date(baseDate.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(), // -1 jour
        createdAt,
        updatedAt: createdAt
    });

    const latestWeight = await model.findLatestWeight();
    expect(latestWeight).toBeTruthy();
    expect(latestWeight.weight).toBe(76.0); // Le plus récent
    expect(latestWeight.measureDate).toBe(baseDate.toISOString());
});