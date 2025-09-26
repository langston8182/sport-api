import { jest } from "@jest/globals";
import { MongoMemoryServer } from "mongodb-memory-server";

let mongod;
let model;
let getDb;
const OLD_ENV = { ...process.env };

function setEnv(key, value) {
    if (value === undefined || value === null) return;
    process.env[key] = String(value);
}

beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();

    // Mock config pour utiliser Mongo in-memory
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

    model = await import("../../src/models/program.model.mjs");
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

test("insert/find/update/delete programs (modèle)", async () => {
    const createdAt = new Date().toISOString();

    // Insert
    const doc = await model.insertProgram({
        name: "Programme test",
        goal: "Endurance",
        weeks: 4,
        sessionsPerWeek: 2,
        schedule: [],
        createdAt,
        updatedAt: createdAt
    });
    expect(doc._id).toBeDefined();

    // Find all
    const all = await model.findPrograms();
    expect(all.length).toBe(1);
    expect(all[0].name).toBe("Programme test");

    // Find by id
    const found = await model.findProgramById(String(doc._id));
    expect(found.goal).toBe("Endurance");

    // Update
    await model.updateProgram(String(doc._id), { name: "Programme modifié", updatedAt: new Date().toISOString() });
    const afterUpdate = await model.findPrograms();
    expect(afterUpdate[0].name).toBe("Programme modifié");

    // Delete
    await model.deleteProgram(String(doc._id));
    const afterDelete = await model.findPrograms();
    expect(afterDelete.length).toBe(0);
});

test("schedule add/replace/remove (modèle)", async () => {
    const createdAt = new Date().toISOString();

    const prog = await model.insertProgram({
        name: "Programme planning",
        weeks: 2,
        sessionsPerWeek: 2,
        schedule: [],
        createdAt,
        updatedAt: createdAt
    });

    // Add entry
    const entry = {
        entryId: "wk1-s1",
        week: 1,
        slot: 1,
        sessionId: "sess-123"
    };
    let updated = await model.addScheduleEntry(String(prog._id), entry);
    expect(updated.schedule.length).toBe(1);
    expect(updated.schedule[0].sessionId).toBe("sess-123");

    // Replace entry
    const newEntry = {
        entryId: "wk1-s1",
        week: 1,
        slot: 1,
        sessionId: "sess-456"
    };
    updated = await model.replaceScheduleEntry(String(prog._id), "wk1-s1", newEntry);
    expect(updated.schedule[0].sessionId).toBe("sess-456");

    // Remove entry
    updated = await model.removeScheduleEntry(String(prog._id), "wk1-s1");
    expect(updated.schedule.length).toBe(0);
});