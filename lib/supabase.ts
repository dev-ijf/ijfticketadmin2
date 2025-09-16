import type { Database } from "./database";
import { DatabaseUtils, getSql } from "./database";

// Create a Neon adapter that mimics Supabase client interface using DatabaseUtils
export const supabase = {
  from: (table: string) => ({
    select: (columns = "*") => ({
      eq: function (column: string, value: any) {
        return {
          then: async (resolve: any) => {
            try {
              const conditions = { [column]: value };
              const result = await DatabaseUtils.findMany(table, conditions);
              resolve({ data: result, error: null });
            } catch (error) {
              console.error("Database error in select eq:", error);
              resolve({ data: [], error });
            }
          },
        };
      },

      order: function (column: string, options?: { ascending?: boolean }) {
        return {
          then: async (resolve: any) => {
            try {
              const orderBy = {
                column,
                direction: (options?.ascending !== false ? "ASC" : "DESC") as
                  | "ASC"
                  | "DESC",
              };
              const result = await DatabaseUtils.findMany(table, {}, orderBy);
              resolve({ data: result, error: null });
            } catch (error) {
              console.error("Database error in select order:", error);
              resolve({ data: [], error });
            }
          },
        };
      },

      single: async () => {
        try {
          const result = await DatabaseUtils.findMany(table, {});
          return { data: result[0] || null, error: null };
        } catch (error) {
          console.error("Database error in single:", error);
          return { data: null, error };
        }
      },

      then: async (resolve: any) => {
        try {
          const result = await DatabaseUtils.findMany(table, {});
          resolve({ data: result, error: null });
        } catch (error) {
          console.error("Database error in select:", error);
          resolve({ data: [], error });
        }
      },
    }),

    insert: (data: any | any[]) => ({
      select: function (columns = "*") {
        return this;
      },

      then: async (resolve: any) => {
        try {
          const records = Array.isArray(data) ? data : [data];
          const results = [];

          for (const record of records) {
            const result = await DatabaseUtils.create(table, record);
            results.push(result);
          }

          resolve({
            data: Array.isArray(data) ? results : results[0],
            error: null,
          });
        } catch (error) {
          console.error("Database error in insert:", error);
          resolve({ data: null, error });
        }
      },

      single: async () => {
        try {
          const record = Array.isArray(data) ? data[0] : data;
          const result = await DatabaseUtils.create(table, record);
          return { data: result, error: null };
        } catch (error) {
          console.error("Database error in insert single:", error);
          return { data: null, error };
        }
      },
    }),

    update: (data: any) => ({
      eq: (column: string, value: any) => ({
        then: async (resolve: any) => {
          try {
            if (column === "id") {
              const result = await DatabaseUtils.update(table, value, data);
              resolve({ data: result, error: null });
            } else {
              // For non-id columns, use raw SQL
              const columns = Object.keys(data);
              const values = Object.values(data);
              const setClause = columns
                .map((col, index) => `${col} = $${index + 1}`)
                .join(", ");

              const sql = getSql();
              const allValues = [...values, value];
              const placeholderQuery =
                `UPDATE ${table} SET ${setClause}, updated_at = NOW() WHERE ${column} = $${values.length + 1} RETURNING *`.replace(
                  /\$(\d+)/g,
                  (match, index) => {
                    const val = allValues[parseInt(index) - 1];
                    return typeof val === "string" ? `'${val}'` : val;
                  },
                );
              const result = (await sql.unsafe(
                placeholderQuery,
              )) as unknown as any[];
              resolve({ data: result[0] || null, error: null });
            }
          } catch (error) {
            console.error("Database error in update:", error);
            resolve({ data: null, error });
          }
        },
      }),
    }),

    delete: () => ({
      eq: (column: string, value: any) => ({
        then: async (resolve: any) => {
          try {
            if (column === "id") {
              await DatabaseUtils.delete(table, value);
            } else {
              // For non-id columns, use raw SQL
              const sql = getSql();
              const safeValue =
                typeof value === "string" ? `'${value}'` : value;
              const query = `DELETE FROM ${table} WHERE ${column} = ${safeValue}`;
              await sql.unsafe(query);
            }
            resolve({ data: null, error: null });
          } catch (error) {
            console.error("Database error in delete:", error);
            resolve({ data: null, error });
          }
        },
      }),
    }),
  }),
};

// Re-export the Database type from the existing database.ts
export type { Database };
