/**
 * Schema name for all kernl tables.
 */
export const SCHEMA_NAME = "kernl";

/**
 * Table definition with name, columns, and optional constraints.
 */
export interface Table<
  Name extends string,
  Cols extends Record<string, Column>,
> {
  name: Name;
  columns: Cols;
  constraints?: TableConstraint[];
}

/**
 * Define a table with name, columns, and optional constraints.
 */
export function defineTable<
  const Name extends string,
  const Cols extends Record<string, Column>,
>(
  name: Name,
  columns: Cols,
  constraints?: TableConstraint[],
): Table<Name, Cols> {
  // set table/column metadata on each column for FK resolution
  for (const cname in columns) {
    columns[cname]._table = name;
    columns[cname]._column = cname;
  }

  return { name, columns, constraints };
}

/* ---- Column Types ---- */

export type ColumnType = "text" | "integer" | "bigint" | "boolean" | "jsonb";
export type OnDeleteAction = "CASCADE" | "SET NULL" | "RESTRICT";

/**
 * Column definition with type and constraints.
 */
export interface Column<T = unknown> {
  type: ColumnType;

  _table?: string;
  _column?: string;

  // Constraints
  _pk?: boolean;
  _nullable?: boolean;
  _unique?: boolean;
  _default?: T;
  _fk?: {
    table: string;
    column: string;
  };
  _onDelete?: OnDeleteAction;

  // -- builders --
  primaryKey(): Column<T>;
  nullable(): Column<T>;
  default(val: T): Column<T>;
  unique(): Column<T>;
  references(
    ref: () => Column,
    opts?: { onDelete?: OnDeleteAction },
  ): Column<T>;

  // -- codec --
  encode(val: T): string;
  decode(val: string): T;
}

export const text = (): Column<string> => col("text");
export const integer = (): Column<number> => col("integer");
export const bigint = (): Column<number> => col("bigint");
export const boolean = (): Column<boolean> => col("boolean");
export const jsonb = <T = unknown>(): Column<T> => col("jsonb");

export const timestamps = {
  created_at: bigint(),
  updated_at: bigint(),
};

function col<T>(type: ColumnType): Column<T> {
  const c: Column<T> = {
    type,

    primaryKey() {
      this._pk = true;
      return this;
    },

    nullable() {
      this._nullable = true;
      return this;
    },

    default(val) {
      this._default = val;
      return this;
    },

    unique() {
      this._unique = true;
      return this;
    },

    references(ref, opts) {
      const targetCol = ref();
      if (targetCol._table && targetCol._column) {
        this._fk = {
          table: targetCol._table,
          column: targetCol._column,
        };
      }
      this._onDelete = opts?.onDelete;
      return this;
    },

    encode(val: T): string {
      if (val === null || val === undefined) return "NULL";

      switch (this.type) {
        case "text":
          return `'${String(val).replace(/'/g, "''")}'`;
        case "integer":
        case "bigint":
          return String(val);
        case "boolean":
          return val ? "TRUE" : "FALSE";
        case "jsonb":
          return `'${JSON.stringify(val)}'`;
      }
    },

    decode(val: string): T {
      switch (this.type) {
        case "text":
          return val as T;
        case "integer":
        case "bigint":
          return Number.parseInt(val, 10) as T;
        case "boolean":
          return (val === "t" || val === "true" || val === "TRUE") as T;
        case "jsonb":
          return JSON.parse(val) as T;
      }
    },
  };

  return c;
}

/* ---- Constraints ---- */

/**
 * Table-level constraint types.
 */
export type TableConstraint =
  | UniqueConstraint
  | PrimaryKeyConstraint
  | ForeignKeyConstraint
  | CheckConstraint
  | IndexConstraint;

export interface UniqueConstraint {
  readonly kind: "unique";
  columns: string[];
  name?: string; // optional constraint name
}

export interface IndexConstraint {
  readonly kind: "index";
  columns: string[];
  unique?: boolean;
}

export interface PrimaryKeyConstraint {
  readonly kind: "pkey";
  columns: string[];
  name?: string;
}

export interface ForeignKeyConstraint {
  readonly kind: "fkey";
  columns: string[];
  references: {
    table: string;
    columns: string[];
  };
  onDelete?: OnDeleteAction;
  name?: string;
}

export interface CheckConstraint {
  readonly kind: "check";
  expression: string;
  name?: string;
}
