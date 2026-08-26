/**
 * A small fake of the PostgREST surface this app uses, seeded with the REAL
 * column list of the live project (lopurzvtignkqyubqgtz), read from
 * information_schema.columns.
 *
 * The point is that asking for a column that does not exist fails here exactly
 * the way it fails in production (PGRST204), so a test that drives real code
 * through this fake catches the "app expects `folder`, database has
 * `folder_id`" class of bug instead of passing against an imagined shape.
 */

export const LIVE_COLUMNS: Record<string, string[]> = {
  folders: ['id', 'user_id', 'name', 'created_at'],
  flashcard_sets: [
    'id',
    'user_id',
    'title',
    'color',
    'last_studied',
    'created_at',
    'updated_at',
    'folder_id',
  ],
  flashcards: [
    'id',
    'set_id',
    'user_id',
    'front',
    'back',
    'status',
    'last_reviewed',
    'created_at',
    'ease_factor',
    'interval_days',
    'repetitions',
    'due_at',
  ],
  reviewers: [
    'id',
    'user_id',
    'title',
    'source_content',
    'extraction_mode',
    'created_at',
    'updated_at',
    'folder_id',
  ],
  reviewer_categories: ['id', 'reviewer_id', 'user_id', 'name', 'color', 'created_at'],
  reviewer_terms: [
    'id',
    'category_id',
    'user_id',
    'term',
    'definition',
    'examples',
    'keywords',
    'created_at',
  ],
}

/** Embeddable relations, i.e. tables reachable by a foreign key. */
const LIVE_RELATIONS: Record<string, string[]> = {
  folders: [],
  flashcard_sets: ['folders', 'flashcards'],
  flashcards: [],
  reviewers: ['folders', 'reviewer_categories'],
  reviewer_categories: ['reviewer_terms'],
  reviewer_terms: [],
}

export interface FakeError {
  code: string
  message: string
}

export type Row = Record<string, unknown>

interface Result {
  data: unknown
  error: FakeError | null
}

function missingColumn(table: string, column: string): FakeError {
  return {
    code: 'PGRST204',
    message: `Could not find the '${column}' column of '${table}' in the schema cache`,
  }
}

function splitTopLevel(input: string): string[] {
  const parts: string[] = []
  let depth = 0
  let current = ''
  for (const char of input) {
    if (char === '(') depth += 1
    if (char === ')') depth -= 1
    if (char === ',' && depth === 0) {
      parts.push(current)
      current = ''
    } else {
      current += char
    }
  }
  parts.push(current)
  return parts.map((part) => part.trim()).filter(Boolean)
}

/** Mirrors private.sanitize_folder_name(). */
function sanitizeName(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const cleaned = value.replace(/[<>]/g, '').replace(/\s+/g, ' ').trim()
  return cleaned ? cleaned.slice(0, 40) : null
}

export interface FakeOptions {
  tables?: Record<string, Row[]>
  authUid?: string
  /** Force every request to fail, for error-path tests. */
  failWith?: FakeError
}

export class FakeSupabase {
  readonly tables: Record<string, Row[]>
  readonly authUid: string
  readonly calls: Array<{ table: string; op: string; payload?: Row; columns?: string }> = []
  private failWith?: FakeError
  private idCounter = 0

  constructor(options: FakeOptions = {}) {
    this.tables = {
      folders: [],
      flashcard_sets: [],
      reviewers: [],
      flashcards: [],
      reviewer_categories: [],
      ...(options.tables ?? {}),
    }
    this.authUid = options.authUid ?? 'user-1'
    this.failWith = options.failWith
  }

  nextId(prefix: string): string {
    this.idCounter += 1
    return `${prefix}-${this.idCounter}`
  }

  from(table: string) {
    return new FakeBuilder(this, table)
  }

  get auth() {
    return {
      getUser: async () => ({ data: { user: { id: this.authUid } }, error: null }),
    }
  }

  _fail(): FakeError | undefined {
    return this.failWith
  }

  _validateColumns(table: string, columns: string): FakeError | null {
    const known = LIVE_COLUMNS[table]
    if (!known) return { code: '42P01', message: `relation "${table}" does not exist` }
    const relations = LIVE_RELATIONS[table] ?? []

    for (const token of splitTopLevel(columns)) {
      if (token === '*') continue
      if (token.includes('(')) {
        const head = token.slice(0, token.indexOf('(')).trim()
        const relation = head.includes(':') ? head.split(':')[1].trim() : head
        if (!relations.includes(relation)) {
          return {
            code: 'PGRST200',
            message: `Could not find a relationship between '${table}' and '${relation}'`,
          }
        }
        continue
      }
      const column = token.includes(':') ? token.split(':')[1].trim() : token
      if (!known.includes(column)) return missingColumn(table, column)
    }
    return null
  }

  _project(table: string, row: Row, columns: string): Row {
    const out: Row = {}
    for (const token of splitTopLevel(columns)) {
      if (token === '*') {
        Object.assign(out, row)
        continue
      }
      if (token.includes('(')) {
        const head = token.slice(0, token.indexOf('(')).trim()
        const alias = head.includes(':') ? head.split(':')[0].trim() : head
        const relation = head.includes(':') ? head.split(':')[1].trim() : head
        const inner = token.slice(token.indexOf('(') + 1, token.lastIndexOf(')'))

        if (relation === 'folders') {
          const folder = this.tables.folders.find((f) => f.id === row.folder_id) ?? null
          out[alias] = folder ? { id: folder.id, name: folder.name } : null
        } else if (inner.trim() === 'count') {
          const fk = table === 'flashcard_sets' ? 'set_id' : 'reviewer_id'
          const count = (this.tables[relation] ?? []).filter((child) => child[fk] === row.id).length
          out[alias] = [{ count }]
        } else {
          out[alias] = []
        }
        continue
      }
      out[token] = row[token] ?? null
    }
    return out
  }
}

class FakeBuilder implements PromiseLike<Result> {
  private op: 'select' | 'insert' | 'update' | 'delete' = 'select'
  private columns = '*'
  private hasSelect = false
  private payload: Row = {}
  private filters: Array<[string, unknown]> = []
  private wantSingle = false

  constructor(private db: FakeSupabase, private table: string) {}

  select(columns = '*') {
    if (this.op === 'select') this.columns = columns
    else {
      this.columns = columns
      this.hasSelect = true
    }
    return this
  }

  insert(values: Row) {
    this.op = 'insert'
    this.payload = values
    return this
  }

  update(values: Row) {
    this.op = 'update'
    this.payload = values
    return this
  }

  delete() {
    this.op = 'delete'
    return this
  }

  eq(column: string, value: unknown) {
    this.filters.push([column, value])
    return this
  }

  order() {
    return this
  }

  single() {
    this.wantSingle = true
    return this
  }

  maybeSingle() {
    return this.single()
  }

  then<TResult1 = Result, TResult2 = never>(
    onfulfilled?: ((value: Result) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    return Promise.resolve(this.run()).then(onfulfilled, onrejected)
  }

  private matches(row: Row): boolean {
    return this.filters.every(([column, value]) => row[column] === value)
  }

  private validatePayload(): FakeError | null {
    const known = LIVE_COLUMNS[this.table]
    if (!known) return { code: '42P01', message: `relation "${this.table}" does not exist` }
    for (const key of Object.keys(this.payload)) {
      if (!known.includes(key)) return missingColumn(this.table, key)
    }
    return null
  }

  /** Mirrors private.assert_folder_owner(). */
  private assertFolderOwner(row: Row): FakeError | null {
    if (row.folder_id == null) return null
    const owned = this.db.tables.folders.some(
      (folder) => folder.id === row.folder_id && folder.user_id === row.user_id,
    )
    return owned ? null : { code: 'P0001', message: 'Folder not found' }
  }

  private run(): Result {
    const forced = this.db._fail()
    if (forced) return { data: null, error: forced }

    this.db.calls.push({
      table: this.table,
      op: this.op,
      payload: this.op === 'select' || this.op === 'delete' ? undefined : this.payload,
      columns: this.columns,
    })

    if (this.op === 'select') {
      const invalid = this.db._validateColumns(this.table, this.columns)
      if (invalid) return { data: null, error: invalid }
      const rows = (this.db.tables[this.table] ?? [])
        .filter((row) => this.matches(row))
        .map((row) => this.db._project(this.table, row, this.columns))
      return this.finish(rows)
    }

    if (this.op === 'insert') {
      const invalid = this.validatePayload()
      if (invalid) return { data: null, error: invalid }

      const row: Row = { ...this.payload }
      row.id = row.id ?? this.db.nextId(this.table)
      row.created_at = row.created_at ?? new Date('2026-01-01T00:00:00.000Z').toISOString()

      if (this.table === 'folders') {
        // folders_normalize: pin the owner and sanitize the name.
        row.user_id = this.db.authUid
        const name = sanitizeName(row.name)
        if (!name) return { data: null, error: { code: 'P0001', message: 'Folder name is required' } }
        row.name = name
        const clash = this.db.tables.folders.some(
          (folder) =>
            folder.user_id === row.user_id &&
            String(folder.name).toLowerCase() === name.toLowerCase(),
        )
        if (clash) {
          return {
            data: null,
            error: {
              code: '23505',
              message: 'duplicate key value violates unique constraint "folders_user_lower_name_idx"',
            },
          }
        }
      } else {
        const ownerError = this.assertFolderOwner(row)
        if (ownerError) return { data: null, error: ownerError }
      }

      this.db.tables[this.table] = [...(this.db.tables[this.table] ?? []), row]
      return this.finish([this.db._project(this.table, row, this.hasSelect ? this.columns : '*')])
    }

    if (this.op === 'update') {
      const invalid = this.validatePayload()
      if (invalid) return { data: null, error: invalid }

      const affected: Row[] = []
      for (const row of this.db.tables[this.table] ?? []) {
        if (!this.matches(row)) continue
        const next = { ...row, ...this.payload }

        if (this.table === 'folders') {
          const name = sanitizeName(next.name)
          if (!name) return { data: null, error: { code: 'P0001', message: 'Folder name is required' } }
          const clash = this.db.tables.folders.some(
            (folder) =>
              folder.id !== row.id &&
              folder.user_id === next.user_id &&
              String(folder.name).toLowerCase() === name.toLowerCase(),
          )
          if (clash) {
            return {
              data: null,
              error: {
                code: '23505',
                message: 'duplicate key value violates unique constraint "folders_user_lower_name_idx"',
              },
            }
          }
          next.name = name
        } else {
          const ownerError = this.assertFolderOwner(next)
          if (ownerError) return { data: null, error: ownerError }
        }

        Object.assign(row, next)
        affected.push(row)
      }
      const projected = affected.map((row) =>
        this.db._project(this.table, row, this.hasSelect ? this.columns : '*'),
      )
      return this.hasSelect ? this.finish(projected) : { data: null, error: null }
    }

    // delete
    const removed = (this.db.tables[this.table] ?? []).filter((row) => this.matches(row))
    this.db.tables[this.table] = (this.db.tables[this.table] ?? []).filter(
      (row) => !this.matches(row),
    )

    if (this.table === 'folders') {
      // ON DELETE SET NULL on flashcard_sets.folder_id and reviewers.folder_id.
      for (const child of ['flashcard_sets', 'reviewers']) {
        for (const row of this.db.tables[child] ?? []) {
          if (removed.some((folder) => folder.id === row.folder_id)) row.folder_id = null
        }
      }
    }

    const projected = removed.map((row) =>
      this.db._project(this.table, row, this.hasSelect ? this.columns : '*'),
    )
    return this.hasSelect ? this.finish(projected) : { data: null, error: null }
  }

  private finish(rows: Row[]): Result {
    if (!this.wantSingle) return { data: rows, error: null }
    if (rows.length === 1) return { data: rows[0], error: null }
    return {
      data: null,
      error: {
        code: 'PGRST116',
        message: 'JSON object requested, multiple (or no) rows returned',
      },
    }
  }
}

export function createFakeSupabase(options: FakeOptions = {}) {
  return new FakeSupabase(options)
}
