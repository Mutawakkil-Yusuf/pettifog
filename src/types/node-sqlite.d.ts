// Minimal ambient types for Node's built-in SQLite driver.
// @types/node@20 predates `node:sqlite`; this covers the surface we use.
declare module "node:sqlite" {
  export type SqlValue = null | number | bigint | string | Uint8Array;

  export interface StatementSync {
    all(...params: SqlValue[]): Record<string, SqlValue>[];
    get(...params: SqlValue[]): Record<string, SqlValue> | undefined;
    run(...params: SqlValue[]): {
      changes: number;
      lastInsertRowid: number | bigint;
    };
  }

  export class DatabaseSync {
    constructor(path: string);
    exec(sql: string): void;
    prepare(sql: string): StatementSync;
    close(): void;
  }
}
