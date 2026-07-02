/**
 * In-memory repository fakes for unit-testing storage-agnostic service helpers.
 * Map-backed, tenant-aware, soft-delete honoring; every method records its call
 * so tests can assert *what the helper asked the repo to do* (e.g. balance deltas)
 * rather than reaching into a real database.
 *
 * Fakes are intentionally loosely typed — pass them to helpers with `as any`
 * (the helpers only touch a few interface methods) and assert on `__calls`.
 */
import type { Session } from "@supabase/supabase-js";

export interface RecordedCall {
    method: string;
    args: any[];
}

export interface InMemoryRepo {
    __rows: Map<string, any>;
    __calls: RecordedCall[];
    callsTo(method: string): RecordedCall[];
    findById(id: string, tenantId: string): Promise<any>;
    findAll(tenantId: string, filters?: any): Promise<any[]>;
    create(data: any, tenantId: string): Promise<any>;
    update(id: string, data: any, tenantId: string): Promise<any>;
    delete(id: string, tenantId: string): Promise<void>;
    hardDelete(id: string, tenantId: string): Promise<void>;
    createMultiple(data: any[], tenantId: string): Promise<any[]>;
    updateMultiple(data: any[], tenantId: string): Promise<void>;
    deleteMultiple(ids: string[], tenantId: string): Promise<void>;
    restoreMultiple(ids: string[], tenantId: string): Promise<void>;
    softDelete(id: string, tenantId: string): Promise<void>;
    restore(id: string, tenantId: string): Promise<void>;
}

export function createInMemoryRepo(seed: any[] = []): InMemoryRepo {
    const rows = new Map<string, any>();
    const calls: RecordedCall[] = [];
    let auto = 0;
    const rec = (method: string, ...args: any[]) => {
        calls.push({ method, args });
    };
    for (const r of seed) rows.set(r.id, { ...r });

    const repo: InMemoryRepo = {
        __rows: rows,
        __calls: calls,
        callsTo: (m) => calls.filter((c) => c.method === m),
        async findById(id, tenantId) {
            rec("findById", id, tenantId);
            const r = rows.get(id);
            return r && r.tenantid === tenantId && !r.isdeleted ? r : null;
        },
        async findAll(tenantId, filters = {}) {
            rec("findAll", tenantId, filters);
            return [...rows.values()].filter(
                (r) => r.tenantid === tenantId && (filters.isDeleted ? r.isdeleted : !r.isdeleted),
            );
        },
        async create(data, tenantId) {
            rec("create", data, tenantId);
            const id = data.id ?? `auto-${++auto}`;
            const row = { ...data, id, tenantid: data.tenantid ?? tenantId, isdeleted: data.isdeleted ?? false };
            rows.set(id, row);
            return row;
        },
        async update(id, data, tenantId) {
            rec("update", id, data, tenantId);
            const cur = rows.get(id);
            if (!cur) return null;
            const row = { ...cur, ...data, id };
            rows.set(id, row);
            return row;
        },
        async delete(id, tenantId) {
            rec("delete", id, tenantId);
            rows.delete(id);
        },
        async hardDelete(id, tenantId) {
            rec("hardDelete", id, tenantId);
            rows.delete(id);
        },
        async createMultiple(data, tenantId) {
            rec("createMultiple", data, tenantId);
            const out: any[] = [];
            for (const d of data) out.push(await repo.create(d, tenantId));
            return out;
        },
        async updateMultiple(data, tenantId) {
            rec("updateMultiple", data, tenantId);
            for (const d of data) await repo.update(d.id, d, tenantId);
        },
        async deleteMultiple(ids, tenantId) {
            rec("deleteMultiple", ids, tenantId);
            ids.forEach((i) => rows.delete(i));
        },
        async restoreMultiple(ids, tenantId) {
            rec("restoreMultiple", ids, tenantId);
            ids.forEach((i) => {
                const r = rows.get(i);
                if (r) r.isdeleted = false;
            });
        },
        async softDelete(id, tenantId) {
            rec("softDelete", id, tenantId);
            const r = rows.get(id);
            if (r) r.isdeleted = true;
        },
        async restore(id, tenantId) {
            rec("restore", id, tenantId);
            const r = rows.get(id);
            if (r) r.isdeleted = false;
        },
    };
    return repo;
}

/** Account repo fake that also tracks running balances via updateAccountBalance. */
export function createFakeAccountRepo(seed: any[] = []) {
    const base = createInMemoryRepo(seed);
    return Object.assign(base, {
        async updateAccountBalance(accountid: string, amount: number, tenantId: string) {
            base.__calls.push({ method: "updateAccountBalance", args: [accountid, amount, tenantId] });
            const acc = base.__rows.get(accountid);
            if (acc) acc.balance = (acc.balance ?? 0) + amount;
            return acc?.balance ?? amount;
        },
        /** Net of all balance deltas applied to a given account (0 for a balanced transfer pair). */
        balanceDelta(accountid: string) {
            return base.__calls
                .filter((c) => c.method === "updateAccountBalance" && c.args[0] === accountid)
                .reduce((sum, c) => sum + c.args[1], 0);
        },
    });
}

/** Configuration repo fake; getConfiguration returns the supplied config (null to simulate "not found"). */
export function createFakeConfigRepo(config: any = { id: "cfg", value: "ops-category-id" }) {
    const base = createInMemoryRepo();
    return Object.assign(base, {
        async getConfiguration(...args: any[]) {
            base.__calls.push({ method: "getConfiguration", args });
            return config;
        },
    });
}

export function fakeSession(opts: { tenantid?: string; userId?: string } = {}): Session {
    return {
        user: { id: opts.userId ?? "user-1", user_metadata: { tenantid: opts.tenantid ?? "tenant-1" } },
    } as unknown as Session;
}
