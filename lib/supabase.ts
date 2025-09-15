import { sql } from "./database"
import type { Database } from "./database"
import { DatabaseUtils, getSql } from "./database"

// Create a Neon adapter that mimics Supabase client interface using DatabaseUtils
export const supabase = {
  from: (table: string) => ({
    select: (columns = "*") => {
      const query = {
        _table: table,
        _columns: columns,
        _where: [] as Array<{ column: string; operator: string; value: any }>,
        _order: null as { column: string; ascending: boolean } | null,
        _limit: null as number | null,

        eq: function (column: string, value: any) {
          this._where.push({ column, operator: "=", value })
          return this
        },

        in: function (column: string, values: any[]) {
          this._where.push({ column, operator: "IN", value: values })
          return this
        },

        order: function (column: string, options?: { ascending?: boolean }) {
          this._order = { column, ascending: options?.ascending !== false }
          return this
        },

        limit: function (count: number) {
          this._limit = count
          return this
        },

        single: async function () {
          try {
            const result = await this._execute()
            return { data: (result as any)[0] || null, error: null }
          } catch (error) {
            console.error("Database error in single:", error)
            if (error instanceof Error && error.message.includes("No database connection string found")) {
              console.warn("Database connection not available, returning null")
              return { data: null, error: null }
            }
            return { data: null, error }
          }
        },

        then: async function (resolve: any) {
          try {
            const result = await this._execute()
            resolve({ data: result, error: null })
          } catch (error) {
            console.error("Database error in then:", error)
            if (error instanceof Error && error.message.includes("No database connection string found")) {
              console.warn("Database connection not available, returning empty result")
              resolve({ data: [], error: null })
            } else {
              resolve({ data: [], error })
            }
          }
        },

        _execute: async function () {
          try {
            // Build conditions for DatabaseUtils
            const conditions: Record<string, any> = {}
            let hasInClause = false
            let inColumn = ""
            let inValues: any[] = []

            for (const where of this._where) {
              if (where.operator === "=") {
                conditions[where.column] = where.value
              } else if (where.operator === "IN") {
                hasInClause = true
                inColumn = where.column
                inValues = where.value
              }
            }

            // Handle IN clause with raw SQL
            if (hasInClause) {
              const placeholders = inValues.map((_, index) => `$${index + 1}`).join(", ")
              let query = `SELECT ${this._columns} FROM ${this._table} WHERE ${inColumn} IN (${placeholders})`

              if (this._order) {
                const direction = this._order.ascending ? "ASC" : "DESC"
                query += ` ORDER BY ${this._order.column} ${direction}`
              }

              if (this._limit) {
                query += ` LIMIT ${this._limit}`
              }

              return await getSql()(query, inValues)
            }

            // Use DatabaseUtils for simple queries
            const orderBy = this._order
              ? {
                  column: this._order.column,
                  direction: (this._order.ascending ? "ASC" : "DESC") as "ASC" | "DESC",
                }
              : undefined

            if (Object.keys(conditions).length === 0) {
              // Select all
              return await DatabaseUtils.findMany(this._table, {}, orderBy)
            } else {
              // Select with conditions
              return await DatabaseUtils.findMany(this._table, conditions, orderBy)
            }
          } catch (error) {
            console.error("Database error in _execute:", error)
            if (error instanceof Error && error.message.includes("No database connection string found")) {
              console.warn("Database connection not available, returning empty result")
              return []
            }
            throw error
          }
        },
      }

      return query
    },

    insert: (data: any | any[]) => {
      const insertQuery = {
        _selectColumns: "*",

        select: function (columns = "*") {
          this._selectColumns = columns
          return this
        },

        then: async (resolve: any) => {
          try {
            const records = Array.isArray(data) ? data : [data]
            const results = []

            for (const record of records) {
              const result = await DatabaseUtils.create(table, record)
              results.push(result)
            }

            resolve({
              data: Array.isArray(data) ? results : results[0],
              error: null,
            })
          } catch (error) {
            console.error("Database error in insert:", error)
            if (error instanceof Error && error.message.includes("No database connection string found")) {
              console.warn("Database connection not available, returning null")
              resolve({ data: null, error: null })
            } else {
              resolve({ data: null, error })
            }
          }
        },

        single: async () => {
          try {
            const record = Array.isArray(data) ? data[0] : data
            const result = await DatabaseUtils.create(table, record)
            return { data: result, error: null }
          } catch (error) {
            console.error("Database error in insert single:", error)
            if (error instanceof Error && error.message.includes("No database connection string found")) {
              console.warn("Database connection not available, returning null")
              return { data: null, error: null }
            }
            return { data: null, error }
          }
        },
      }

      return insertQuery
    },

    update: (data: any) => ({
      eq: (column: string, value: any) => ({
        then: async (resolve: any) => {
          try {
            // For updates, we need to find by the column first
            if (column === "id") {
              const result = await DatabaseUtils.update(table, value, data)
              resolve({ data: result, error: null })
            } else {
              // For non-id columns, use raw SQL
              const columns = Object.keys(data)
              const values = Object.values(data)
              const setClause = columns.map((col, index) => `${col} = $${index + 1}`).join(", ")

              const query = `UPDATE ${table} SET ${setClause}, updated_at = NOW() WHERE ${column} = $${values.length + 1} RETURNING *`
              const result = await getSql()(query, [...values, value])
              resolve({ data: (result as any)[0] || null, error: null })
            }
          } catch (error) {
            console.error("Database error in update:", error)
            if (error instanceof Error && error.message.includes("No database connection string found")) {
              console.warn("Database connection not available, returning null")
              resolve({ data: null, error: null })
            } else {
              resolve({ data: null, error })
            }
          }
        },
      }),
    }),

    delete: () => ({
      eq: (column: string, value: any) => ({
        then: async (resolve: any) => {
          try {
            if (column === "id") {
              await DatabaseUtils.delete(table, value)
            } else {
              // For non-id columns, use raw SQL
              const query = `DELETE FROM ${table} WHERE ${column} = $1`
              await getSql()(query, [value])
            }
            resolve({ data: null, error: null })
          } catch (error) {
            console.error("Database error in delete:", error)
            if (error instanceof Error && error.message.includes("No database connection string found")) {
              console.warn("Database connection not available, operation skipped")
              resolve({ data: null, error: null })
            } else {
              resolve({ data: null, error })
            }
          }
        },
      }),
    }),
  }),
}

// Re-export the Database type and sql connection from the existing database.ts
export type { Database }
export { sql }
