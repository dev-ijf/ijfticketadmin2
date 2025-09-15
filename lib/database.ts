import { neon } from "@neondatabase/serverless"

let sqlInstance: ReturnType<typeof neon> | null = null

function getDatabase() {
  if (!sqlInstance) {
    console.log("[v0] Debug - Environment variables check:", {
      DATABASE_URL: process.env.DATABASE_URL ? "SET" : "NOT_SET",
      POSTGRES_URL: process.env.POSTGRES_URL ? "SET" : "NOT_SET",
      NEON_DATABASE_URL: process.env.NEON_DATABASE_URL ? "SET" : "NOT_SET",
      PGHOST: process.env.PGHOST ? "SET" : "NOT_SET",
      PGDATABASE: process.env.PGDATABASE ? "SET" : "NOT_SET",
      PGUSER: process.env.PGUSER ? "SET" : "NOT_SET",
      PGPASSWORD: process.env.PGPASSWORD ? "SET" : "NOT_SET",
    })

    let databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.NEON_DATABASE_URL

    // If no direct DATABASE_URL, construct from Neon individual components
    if (!databaseUrl && process.env.PGHOST) {
      const host = process.env.PGHOST
      const database = process.env.PGDATABASE || "neondb"
      const user = process.env.PGUSER || "neondb_owner"
      const password = process.env.PGPASSWORD
      const sslmode = process.env.PGSSLMODE || "require"

      if (password) {
        databaseUrl = `postgresql://${user}:${password}@${host}/${database}?sslmode=${sslmode}`
        console.log("[v0] Constructed database URL from Neon environment variables")
      }
    }

    if (!databaseUrl) {
      console.error("[v0] No database connection string found in environment variables:", {
        DATABASE_URL: process.env.DATABASE_URL ? "✓ Set" : "✗ Missing",
        POSTGRES_URL: process.env.POSTGRES_URL ? "✓ Set" : "✗ Missing",
        NEON_DATABASE_URL: process.env.NEON_DATABASE_URL ? "✓ Set" : "✗ Missing",
        PGHOST: process.env.PGHOST ? "✓ Set" : "✗ Missing",
        PGDATABASE: process.env.PGDATABASE ? "✓ Set" : "✗ Missing",
        PGUSER: process.env.PGUSER ? "✓ Set" : "✗ Missing",
        PGPASSWORD: process.env.PGPASSWORD ? "✓ Set" : "✗ Missing",
      })
      console.error(
        "[v0] Please set DATABASE_URL or Neon environment variables (PGHOST, PGDATABASE, PGUSER, PGPASSWORD)",
      )

      // Return a mock function for development if no connection is available
      return () => Promise.resolve([])
    }

    console.log("[v0] Database connection initialized successfully")
    console.log("[v0] Using host:", process.env.PGHOST || "from DATABASE_URL")
    sqlInstance = neon(databaseUrl)
  }
  return sqlInstance
}

// Export a function that returns the sql instance
export const getSql = () => getDatabase()

// For backward compatibility, export sql function
export const sql = ((strings: TemplateStringsArray, ...values: any[]) =>
  getDatabase()(strings, ...values)) as ReturnType<typeof neon>

// Database types based on the existing schema
export interface Database {
  public: {
    Tables: {
      events: {
        Row: {
          id: number
          name: string
          slug: string
          description: string | null
          start_date: string
          end_date: string
          location: string | null
          image_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          name: string
          slug: string
          description?: string | null
          start_date: string
          end_date: string
          location?: string | null
          image_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          name?: string
          slug?: string
          description?: string | null
          start_date?: string
          end_date?: string
          location?: string | null
          image_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      tickets: {
        Row: {
          id: number
          order_id: number
          ticket_type_id: number
          ticket_code: string
          attendee_name: string
          attendee_email: string | null
          is_checked_in: boolean | null
          checked_in_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          order_id: number
          ticket_type_id: number
          ticket_code?: string
          attendee_name: string
          attendee_email?: string | null
          is_checked_in?: boolean | null
          checked_in_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          order_id?: number
          ticket_type_id?: number
          ticket_code?: string
          attendee_name?: string
          attendee_email?: string | null
          is_checked_in?: boolean | null
          checked_in_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      orders: {
        Row: {
          id: number
          order_reference: string
          customer_id: number
          event_id: number
          gross_amount: number
          discount_amount: number
          final_amount: number
          payment_channel_id: number | null
          status: string
          order_date: string
          paid_at: string | null
          virtual_account_number: string | null
          payment_response_url: string | null
          proof_transfer: string | null
          discount_id: number | null
          unique_code: number | null
          is_wa_checkout: boolean | null
          is_email_checkout: boolean | null
          is_wa_paid: boolean | null
          is_email_paid: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          order_reference: string
          customer_id: number
          event_id: number
          gross_amount: number
          discount_amount?: number
          final_amount: number
          payment_channel_id?: number | null
          status?: string
          order_date?: string
          paid_at?: string | null
          virtual_account_number?: string | null
          payment_response_url?: string | null
          proof_transfer?: string | null
          discount_id?: number | null
          unique_code?: number | null
          is_wa_checkout?: boolean | null
          is_email_checkout?: boolean | null
          is_wa_paid?: boolean | null
          is_email_paid?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          order_reference?: string
          customer_id?: number
          event_id?: number
          gross_amount?: number
          discount_amount?: number
          final_amount?: number
          payment_channel_id?: number | null
          status?: string
          order_date?: string
          paid_at?: string | null
          virtual_account_number?: string | null
          payment_response_url?: string | null
          proof_transfer?: string | null
          discount_id?: number | null
          unique_code?: number | null
          is_wa_checkout?: boolean | null
          is_email_checkout?: boolean | null
          is_wa_paid?: boolean | null
          is_email_paid?: boolean | null
          created_at?: string
          updated_at?: string
        }
      }
      customers: {
        Row: {
          id: number
          name: string
          email: string
          phone_number: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          name: string
          email: string
          phone_number?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          name?: string
          email?: string
          phone_number?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      discounts: {
        Row: {
          id: number
          code: string
          description: string | null
          discount_type: string
          value: number
          minimum_amount: number | null
          max_discount_amount: number | null
          usage_limit: number | null
          usage_count: number
          valid_until: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          code: string
          description?: string | null
          discount_type: string
          value: number
          minimum_amount?: number | null
          max_discount_amount?: number | null
          usage_limit?: number | null
          usage_count?: number
          valid_until?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          code?: string
          description?: string | null
          discount_type?: string
          value?: number
          minimum_amount?: number | null
          max_discount_amount?: number | null
          usage_limit?: number | null
          usage_count?: number
          valid_until?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      payment_channels: {
        Row: {
          id: number
          pg_name: string
          pg_code: string
          vendor: string | null
          category: string | null
          is_active: boolean
          is_redirect: boolean | null
          image_url: string | null
          image_qris: string | null
          sort_order: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          pg_name: string
          pg_code: string
          vendor?: string | null
          category?: string | null
          is_active?: boolean
          is_redirect?: boolean | null
          image_url?: string | null
          image_qris?: string | null
          sort_order?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          pg_name?: string
          pg_code?: string
          vendor?: string | null
          category?: string | null
          is_active?: boolean
          is_redirect?: boolean | null
          image_url?: string | null
          image_qris?: string | null
          sort_order?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      payment_instructions: {
        Row: {
          id: number
          payment_channel_id: number
          title: string
          description: string
          step_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          payment_channel_id: number
          title: string
          description: string
          step_order: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          payment_channel_id?: number
          title?: string
          description?: string
          step_order?: number
          created_at?: string
          updated_at?: string
        }
      }
      notification_templates: {
        Row: {
          id: number
          name: string
          channel: "email" | "whatsapp"
          trigger_on: string
          subject: string | null
          body: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          name: string
          channel: "email" | "whatsapp"
          trigger_on: string
          subject?: string | null
          body: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          name?: string
          channel?: "email" | "whatsapp"
          trigger_on?: string
          subject?: string | null
          body?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      notification_logs: {
        Row: {
          id: number
          order_reference: string | null
          channel: string
          trigger_on: string
          recipient_email: string | null
          recipient_phone: string | null
          body: string | null
          request_payload: any | null
          response_payload: any | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          order_reference?: string | null
          channel: string
          trigger_on: string
          recipient_email?: string | null
          recipient_phone?: string | null
          body?: string | null
          request_payload?: any | null
          response_payload?: any | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          order_reference?: string | null
          channel?: string
          trigger_on?: string
          recipient_email?: string | null
          recipient_phone?: string | null
          body?: string | null
          request_payload?: any | null
          response_payload?: any | null
          created_at?: string
          updated_at?: string
        }
      }
      ticket_types: {
        Row: {
          id: number
          event_id: number
          name: string
          price: number
          quantity_total: number
          quantity_sold: number
          tickets_per_purchase: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          event_id: number
          name: string
          price: number
          quantity_total: number
          quantity_sold?: number
          tickets_per_purchase: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          event_id?: number
          name?: string
          price?: number
          quantity_total?: number
          quantity_sold?: number
          tickets_per_purchase?: number
          created_at?: string
          updated_at?: string
        }
      }
      order_items: {
        Row: {
          id: number
          order_id: number
          ticket_type_id: number
          quantity: number
          price_per_ticket: number
          effective_ticket_count: number
          created_at: string
        }
        Insert: {
          id?: number
          order_id: number
          ticket_type_id: number
          quantity: number
          price_per_ticket: number
          effective_ticket_count: number
          created_at?: string
        }
        Update: {
          id?: number
          order_id?: number
          ticket_type_id?: number
          quantity?: number
          price_per_ticket?: number
          effective_ticket_count?: number
          created_at?: string
        }
      }
      payment_logs: {
        Row: {
          id: number
          order_reference: string | null
          log_type: string
          virtual_account_number: string | null
          payment_response_url: string | null
          request_payload: any | null
          response_payload: any | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          order_reference?: string | null
          log_type: string
          virtual_account_number?: string | null
          payment_response_url?: string | null
          request_payload?: any | null
          response_payload?: any | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          order_reference?: string | null
          log_type?: string
          virtual_account_number?: string | null
          payment_response_url?: string | null
          request_payload?: any | null
          response_payload?: any | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

export type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"]
export type Inserts<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Insert"]
export type Updates<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Update"]

// Database utility functions for common operations
export class DatabaseUtils {
  static async findById<T>(table: string, id: number | string): Promise<T | null> {
    try {
      const result = await getSql()`SELECT * FROM ${table} WHERE id = ${id} LIMIT 1`
      return ((result as any)[0] as T) || null
    } catch (error) {
      console.error(`Error finding ${table} by id ${id}:`, error)
      return null
    }
  }

  static async findMany<T>(
    table: string,
    conditions: Record<string, any> = {},
    orderBy?: { column: string; direction: "ASC" | "DESC" },
  ): Promise<T[]> {
    try {
      const conditionEntries = Object.entries(conditions)

      if (conditionEntries.length === 0) {
        if (orderBy) {
          const result = await getSql()`
            SELECT * FROM ${table} 
            ORDER BY ${orderBy.column} ${orderBy.direction}
          `
          return result as T[]
        } else {
          const result = await getSql()`SELECT * FROM ${table}`
          return result as T[]
        }
      } else {
        let whereClause = ""
        const conditionParts = []

        for (const [key, value] of conditionEntries) {
          conditionParts.push(`${key} = '${value}'`)
        }

        whereClause = conditionParts.join(" AND ")

        if (orderBy) {
          const result = await getSql()`
            SELECT * FROM ${table} 
            WHERE ${whereClause}
            ORDER BY ${orderBy.column} ${orderBy.direction}
          `
          return result as T[]
        } else {
          const result = await getSql()`
            SELECT * FROM ${table} 
            WHERE ${whereClause}
          `
          return result as T[]
        }
      }
    } catch (error) {
      console.error(`Error finding ${table}:`, error)
      return []
    }
  }

  static async create<T>(table: string, data: Record<string, any>): Promise<T | null> {
    try {
      const columns = Object.keys(data)
      const values = Object.values(data)

      const columnsList = columns.join(", ")
      const valuesList = values.map((v) => (typeof v === "string" ? `'${v}'` : v)).join(", ")

      const result = await getSql()`
        INSERT INTO ${table} (${columnsList})
        VALUES (${valuesList})
        RETURNING *
      `
      return ((result as any)[0] as T) || null
    } catch (error) {
      console.error(`Error creating ${table}:`, error)
      return null
    }
  }

  static async update<T>(table: string, id: number | string, data: Record<string, any>): Promise<T | null> {
    try {
      const columns = Object.keys(data)
      const setClause = columns
        .map((col) => {
          const value = data[col]
          return `${col} = ${typeof value === "string" ? `'${value}'` : value}`
        })
        .join(", ")

      const result = await getSql()`
        UPDATE ${table}
        SET ${setClause}, updated_at = NOW()
        WHERE id = ${id}
        RETURNING *
      `
      return ((result as any)[0] as T) || null
    } catch (error) {
      console.error(`Error updating ${table}:`, error)
      return null
    }
  }

  static async delete(table: string, id: number | string): Promise<boolean> {
    try {
      await getSql()`DELETE FROM ${table} WHERE id = ${id}`
      return true
    } catch (error) {
      console.error(`Error deleting from ${table}:`, error)
      return false
    }
  }

  static async count(table: string, conditions: Record<string, any> = {}): Promise<number> {
    try {
      const conditionEntries = Object.entries(conditions)

      if (conditionEntries.length === 0) {
        const result = await getSql()`SELECT COUNT(*) as count FROM ${table}`
        return Number((result as any)[0]?.count) || 0
      } else {
        const conditionParts = []

        for (const [key, value] of conditionEntries) {
          conditionParts.push(`${key} = '${value}'`)
        }

        const whereClause = conditionParts.join(" AND ")
        const result = await getSql()`SELECT COUNT(*) as count FROM ${table} WHERE ${whereClause}`
        return Number((result as any)[0]?.count) || 0
      }
    } catch (error) {
      console.error(`Error counting ${table}:`, error)
      return 0
    }
  }
}

// Specific database service classes
export class EventService {
  static async getAll() {
    return DatabaseUtils.findMany<Tables<"events">>("events", {}, { column: "created_at", direction: "DESC" })
  }

  static async getById(id: number) {
    return DatabaseUtils.findById<Tables<"events">>("events", id)
  }

  static async create(data: Inserts<"events">) {
    return DatabaseUtils.create<Tables<"events">>("events", data)
  }

  static async update(id: number, data: Updates<"events">) {
    return DatabaseUtils.update<Tables<"events">>("events", id, data)
  }

  static async delete(id: number) {
    return DatabaseUtils.delete("events", id)
  }
}

export class CustomerService {
  static async getAll() {
    return DatabaseUtils.findMany<Tables<"customers">>("customers", {}, { column: "created_at", direction: "DESC" })
  }

  static async getById(id: number) {
    return DatabaseUtils.findById<Tables<"customers">>("customers", id)
  }

  static async create(data: Inserts<"customers">) {
    return DatabaseUtils.create<Tables<"customers">>("customers", data)
  }

  static async update(id: number, data: Updates<"customers">) {
    return DatabaseUtils.update<Tables<"customers">>("customers", id, data)
  }

  static async delete(id: number) {
    return DatabaseUtils.delete("customers", id)
  }
}

export class OrderService {
  static async getAll() {
    return getSql()`
      SELECT
        o.*,
        c.name as customer_name,
        c.email as customer_email,
        e.name as event_name
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      LEFT JOIN events e ON o.event_id = e.id
      ORDER BY o.created_at DESC
    `
  }

  static async getById(id: number) {
    const result = await getSql()`
      SELECT
        o.*,
        c.name as customer_name,
        c.email as customer_email,
        e.name as event_name
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      LEFT JOIN events e ON o.event_id = e.id
      WHERE o.id = ${id}
    `
    return (result as any)[0] || null
  }

  static async create(data: Inserts<"orders">) {
    return DatabaseUtils.create<Tables<"orders">>("orders", data)
  }

  static async update(id: number, data: Updates<"orders">) {
    return DatabaseUtils.update<Tables<"orders">>("orders", id, data)
  }

  static async delete(id: number) {
    return DatabaseUtils.delete("orders", id)
  }
}

export class PaymentChannelService {
  static async getAll() {
    return DatabaseUtils.findMany<Tables<"payment_channels">>(
      "payment_channels",
      { is_active: true },
      { column: "sort_order", direction: "ASC" },
    )
  }

  static async getById(id: number) {
    return DatabaseUtils.findById<Tables<"payment_channels">>("payment_channels", id)
  }

  static async create(data: Inserts<"payment_channels">) {
    return DatabaseUtils.create<Tables<"payment_channels">>("payment_channels", data)
  }

  static async update(id: number, data: Updates<"payment_channels">) {
    return DatabaseUtils.update<Tables<"payment_channels">>("payment_channels", id, data)
  }

  static async delete(id: number) {
    return DatabaseUtils.delete("payment_channels", id)
  }

  static async getInstructions(paymentChannelId: number) {
    return getSql()`
      SELECT * FROM payment_instructions
      WHERE payment_channel_id = ${paymentChannelId}
      ORDER BY step_order ASC
    `
  }
}
