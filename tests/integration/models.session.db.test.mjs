import {jest} from "@jest/globals";
import {MongoMemoryServer} from "mongodb-memory-server";

let mongod;
let model;
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

    model = await import("../../src/models/session.model.mjs");
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

test("insert/find/update/delete sessions (modèle)", async () => {
    const createdAt = new Date().toISOString();
    const doc = await model.insertSession({
        name: "Séance A",
        items: [
            {
                order: 1,
                exerciseId: "dummy-ex-id",
                sets: 3,
                reps: 12,
                restSec: 60
            }
        ],
        createdAt,
        updatedAt: createdAt
    });
    expect(doc._id).toBeDefined();

    const all = await model.findSessions();
    expect(all.length).toBe(1);
    expect(all[0].name).toBe("Séance A");

    const session = await model.findSessionById(String(doc._id));
    expect(session.name).toBe("Séance A");

    await model.updateSession(String(doc._id), { name: "Séance B", updatedAt: new Date().toISOString() });
    const allAfterUpdate = await model.findSessions();
    expect(allAfterUpdate[0].name).toBe("Séance B");

    await model.deleteSession(String(doc._id));
    const after = await model.findSessions();
    expect(after.length).toBe(0);
});