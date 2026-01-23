import type { Metadata } from "next";
import {
  neon,
  neonConfig,
  type NeonQueryFunction,
} from "@neondatabase/serverless";

// Prevent pooling in serverless environments
neonConfig.fetchConnectionCache = false;

let sqlInstance: NeonQueryFunction<false, false>;

function getDatabase() {
  if (!sqlInstance) {
    const databaseUrl =
      process.env.DATABASE_URL ||
      process.env.POSTGRES_URL ||
      process.env.NEON_DATABASE_URL;
    if (!databaseUrl) {
      throw new Error("DATABASE_URL is not set");
    }
    sqlInstance = neon(databaseUrl);
  }
  return sqlInstance;
}

export const getSql = () => getDatabase();

export const sql = getDatabase();

// Database types based on the existing schema
export interface Database {
  public: {
    Tables: {
      events: {
        Row: {
          id: number;
          name: string;
          slug: string;
          description: string | null;
          start_date: string;
          end_date: string;
          location: string | null;
          image_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          name: string;
          slug: string;
          description?: string | null;
          start_date: string;
          end_date: string;
          location?: string | null;
          image_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          name?: string;
          slug?: string;
          description?: string | null;
          start_date?: string;
          end_date?: string;
          location?: string | null;
          image_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      tickets: {
        Row: {
          id: number;
          order_id: number;
          ticket_type_id: number;
          ticket_code: string;
          attendee_name: string;
          attendee_email: string | null;
          is_checked_in: boolean | null;
          checked_in_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          order_id: number;
          ticket_type_id: number;
          ticket_code?: string;
          attendee_name: string;
          attendee_email?: string | null;
          is_checked_in?: boolean | null;
          checked_in_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          order_id?: number;
          ticket_type_id?: number;
          ticket_code?: string;
          attendee_name?: string;
          attendee_email?: string | null;
          is_checked_in?: boolean | null;
          checked_in_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      orders: {
        Row: {
          id: number;
          order_reference: string;
          customer_id: number;
          event_id: number;
          gross_amount: number;
          discount_amount: number;
          final_amount: number;
          payment_channel_id: number | null;
          status: string;
          order_date: string;
          paid_at: string | null;
          virtual_account_number: string | null;
          payment_response_url: string | null;
          proof_transfer: string | null;
          discount_id: number | null;
          unique_code: number | null;
          is_wa_checkout: boolean | null;
          is_email_checkout: boolean | null;
          is_wa_paid: boolean | null;
          is_email_paid: boolean | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          order_reference: string;
          customer_id: number;
          event_id: number;
          gross_amount: number;
          discount_amount?: number;
          final_amount: number;
          payment_channel_id?: number | null;
          status?: string;
          order_date?: string;
          paid_at?: string | null;
          virtual_account_number?: string | null;
          payment_response_url?: string | null;
          proof_transfer?: string | null;
          discount_id?: number | null;
          unique_code?: number | null;
          is_wa_checkout?: boolean | null;
          is_email_checkout?: boolean | null;
          is_wa_paid?: boolean | null;
          is_email_paid?: boolean | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          order_reference?: string;
          customer_id?: number;
          event_id?: number;
          gross_amount?: number;
          discount_amount?: number;
          final_amount?: number;
          payment_channel_id?: number | null;
          status?: string;
          order_date?: string;
          paid_at?: string | null;
          virtual_account_number?: string | null;
          payment_response_url?: string | null;
          proof_transfer?: string | null;
          discount_id?: number | null;
          unique_code?: number | null;
          is_wa_checkout?: boolean | null;
          is_email_checkout?: boolean | null;
          is_wa_paid?: boolean | null;
          is_email_paid?: boolean | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      customers: {
        Row: {
          id: number;
          name: string;
          email: string;
          phone_number: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          name: string;
          email: string;
          phone_number?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          name?: string;
          email?: string;
          phone_number?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      discounts: {
        Row: {
          id: number;
          code: string;
          description: string | null;
          discount_type: string;
          value: number;
          minimum_amount: number | null;
          max_discount_amount: number | null;
          usage_limit: number | null;
          usage_count: number;
          valid_until: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          code: string;
          description?: string | null;
          discount_type: string;
          value: number;
          minimum_amount?: number | null;
          max_discount_amount?: number | null;
          usage_limit?: number | null;
          usage_count?: number;
          valid_until?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          code?: string;
          description?: string | null;
          discount_type?: string;
          value?: number;
          minimum_amount?: number | null;
          max_discount_amount?: number | null;
          usage_limit?: number | null;
          usage_count?: number;
          valid_until?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      payment_channels: {
        Row: {
          id: number;
          pg_name: string;
          pg_code: string;
          vendor: string | null;
          category: string | null;
          is_active: boolean;
          is_redirect: boolean | null;
          image_url: string | null;
          image_qris: string | null;
          sort_order: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          pg_name: string;
          pg_code: string;
          vendor?: string | null;
          category?: string | null;
          is_active?: boolean;
          is_redirect?: boolean | null;
          image_url?: string | null;
          image_qris?: string | null;
          sort_order?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          pg_name?: string;
          pg_code?: string;
          vendor?: string | null;
          category?: string | null;
          is_active?: boolean;
          is_redirect?: boolean | null;
          image_url?: string | null;
          image_qris?: string | null;
          sort_order?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      payment_instructions: {
        Row: {
          id: number;
          payment_channel_id: number;
          title: string;
          description: string;
          step_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          payment_channel_id: number;
          title: string;
          description: string;
          step_order: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          payment_channel_id?: number;
          title?: string;
          description?: string;
          step_order?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      notification_templates: {
        Row: {
          id: number;
          name: string;
          channel: "email" | "whatsapp";
          trigger_on: string;
          subject: string | null;
          body: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          name: string;
          channel: "email" | "whatsapp";
          trigger_on: string;
          subject?: string | null;
          body: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          name?: string;
          channel?: "email" | "whatsapp";
          trigger_on?: string;
          subject?: string | null;
          body?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      notification_logs: {
        Row: {
          id: number;
          order_reference: string | null;
          channel: string;
          trigger_on: string;
          recipient_email: string | null;
          recipient_phone: string | null;
          body: string | null;
          request_payload: any | null;
          response_payload: any | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          order_reference?: string | null;
          channel: string;
          trigger_on: string;
          recipient_email?: string | null;
          recipient_phone?: string | null;
          body?: string | null;
          request_payload?: any | null;
          response_payload?: any | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          order_reference?: string | null;
          channel?: string;
          trigger_on?: string;
          recipient_email?: string | null;
          recipient_phone?: string | null;
          body?: string | null;
          request_payload?: any | null;
          response_payload?: any | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      ticket_types: {
        Row: {
          id: number;
          event_id: number;
          name: string;
          price: number;
          quantity_total: number;
          quantity_sold: number;
          tickets_per_purchase: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          event_id: number;
          name: string;
          price: number;
          quantity_total: number;
          quantity_sold?: number;
          tickets_per_purchase: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          event_id?: number;
          name?: string;
          price?: number;
          quantity_total?: number;
          quantity_sold?: number;
          tickets_per_purchase?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      order_items: {
        Row: {
          id: number;
          order_id: number;
          ticket_type_id: number;
          quantity: number;
          price_per_ticket: number;
          effective_ticket_count: number;
          created_at: string;
        };
        Insert: {
          id?: number;
          order_id: number;
          ticket_type_id: number;
          quantity: number;
          price_per_ticket: number;
          effective_ticket_count: number;
          created_at?: string;
        };
        Update: {
          id?: number;
          order_id?: number;
          ticket_type_id?: number;
          quantity?: number;
          price_per_ticket?: number;
          effective_ticket_count?: number;
          created_at?: string;
        };
      };
      payment_logs: {
        Row: {
          id: number;
          order_reference: string | null;
          log_type: string;
          virtual_account_number: string | null;
          payment_response_url: string | null;
          request_payload: any | null;
          response_payload: any | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          order_reference?: string | null;
          log_type: string;
          virtual_account_number?: string | null;
          payment_response_url?: string | null;
          request_payload?: any | null;
          response_payload?: any | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          order_reference?: string | null;
          log_type?: string;
          virtual_account_number?: string | null;
          payment_response_url?: string | null;
          request_payload?: any | null;
          response_payload?: any | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      settings: {
        Row: {
          id: number;
          key: string;
          value: string | null;
          type: string;
          category: string;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          key: string;
          value?: string | null;
          type?: string;
          category?: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          key?: string;
          value?: string | null;
          type?: string;
          category?: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type Inserts<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type Updates<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

// Database utility functions for common operations
export class DatabaseUtils {
  static async findById<T>(
    table: string,
    id: number | string,
  ): Promise<T | null> {
    const sql = getDatabase();
    try {
      const result =
        await sql`SELECT * FROM ${sql.unsafe(table)} WHERE id = ${id} LIMIT 1`;
      return (result[0] as T) || null;
    } catch (error) {
      console.error(`Error finding ${table} by id ${id}:`, error);
      return null;
    }
  }

  static async findMany<T>(
    table: string,
    conditions: Record<string, any> = {},
    orderBy?: { column: string; direction: "ASC" | "DESC" },
  ): Promise<T[]> {
    const sql = getDatabase();
    try {
      console.log(`DatabaseUtils.findMany called for table: ${table}`);
      console.log("Conditions:", conditions);
      console.log("OrderBy:", orderBy);

      const conditionEntries = Object.entries(conditions);

      if (conditionEntries.length === 0 && orderBy) {
        // No conditions but with ordering - use template literals for specific cases
        if (
          table === "discounts" &&
          orderBy.column === "created_at" &&
          orderBy.direction === "DESC"
        ) {
          console.log(
            "Using direct SQL query for discounts with ORDER BY created_at DESC",
          );
          const result =
            await sql`SELECT * FROM discounts ORDER BY created_at DESC`;
          console.log(`Query result count: ${result.length}`);
          return result as T[];
        }

        if (
          table === "customers" &&
          orderBy.column === "created_at" &&
          orderBy.direction === "DESC"
        ) {
          console.log(
            "Using direct SQL query for customers with ORDER BY created_at DESC",
          );
          const result =
            await sql`SELECT * FROM customers ORDER BY created_at DESC`;
          console.log(`Query result count: ${result.length}`);
          return result as T[];
        }

        // Generic case with ordering - use template literals with unsafe for table/column names
        console.log(`Using generic ORDER BY query for ${table}`);
        const result =
          await sql`SELECT * FROM ${sql.unsafe(table)} ORDER BY ${sql.unsafe(orderBy.column)} ${sql.unsafe(orderBy.direction)}`;
        console.log(`Query result count: ${result.length}`);
        return result as T[];
      }

      if (conditionEntries.length === 0) {
        // No conditions, no ordering - use template literals
        console.log("Using simple SELECT * query");
        const result = await sql`SELECT * FROM ${sql.unsafe(table)}`;
        console.log(`Query result count: ${result.length}`);
        return result as T[];
      }

      // Build query with conditions using template literals
      console.log("Building parameterized query with conditions");
      const values = conditionEntries.map(([, value]) => value);

      if (orderBy) {
        // With conditions and ordering
        const whereClause = conditionEntries
          .map(([key], i) => `${key} = $${i + 1}`)
          .join(" AND ");
        console.log(`Executing parameterized query with ORDER BY`);
        const safeValues = values.map((v) =>
          typeof v === "string" ? `'${v}'` : v,
        );
        const safeWhereClause = conditionEntries
          .map(([key], i) => `${key} = ${safeValues[i]}`)
          .join(" AND ");
        const query = `SELECT * FROM ${table} WHERE ${safeWhereClause} ORDER BY ${orderBy.column} ${orderBy.direction}`;
        const result = (await sql.unsafe(query)) as unknown as T[];
        console.log(
          `Query result count: ${Array.isArray(result) ? result.length : 0}`,
        );
        return result;
      } else {
        // With conditions but no ordering
        const whereClause = conditionEntries
          .map(([key], i) => `${key} = $${i + 1}`)
          .join(" AND ");
        console.log(`Executing parameterized query without ORDER BY`);
        const safeValues = values.map((v) =>
          typeof v === "string" ? `'${v}'` : v,
        );
        const safeWhereClause = conditionEntries
          .map(([key], i) => `${key} = ${safeValues[i]}`)
          .join(" AND ");
        const query = `SELECT * FROM ${table} WHERE ${safeWhereClause}`;
        const result = (await sql.unsafe(query)) as unknown as T[];
        console.log(
          `Query result count: ${Array.isArray(result) ? result.length : 0}`,
        );
        return result;
      }
    } catch (error) {
      console.error(`Error finding ${table}:`, error);
      if (error instanceof Error) {
        console.error("Error details:", {
          message: error.message,
          stack: error.stack,
          name: error.name,
        });
      }
      return [];
    }
  }

  static async create<T>(
    table: string,
    data: Record<string, any>,
  ): Promise<T | null> {
    const sql = getDatabase();
    try {
      const columns = Object.keys(data);
      const values = Object.values(data);
      const placeholders = columns.map((_, i) => `$${i + 1}`).join(", ");

      const query = `
        INSERT INTO ${sql.unsafe(table)} (${sql.unsafe(columns.join(", "))})
        VALUES (${placeholders})
        RETURNING *
      `;
      const safeValues = values.map((v) =>
        typeof v === "string" ? `'${v}'` : v,
      );
      const finalQuery = query.replace(/\$(\d+)/g, (match, index) => {
        return safeValues[Number.parseInt(index) - 1];
      });
      const result = (await sql.unsafe(finalQuery)) as unknown as T[];
      return ((Array.isArray(result) ? result[0] : null) as T) || null;
    } catch (error) {
      console.error(`Error creating ${table}:`, error);
      return null;
    }
  }

  static async update<T>(
    table: string,
    id: number | string,
    data: Record<string, any>,
  ): Promise<T | null> {
    const sql = getDatabase();
    try {
      const columns = Object.keys(data);
      const setClauses = columns.map(
        (col, i) => `${sql.unsafe(col)} = $${i + 1}`,
      );
      const values = Object.values(data);

      const query = `
        UPDATE ${sql.unsafe(table)}
        SET ${setClauses.join(", ")}, updated_at = NOW()
        WHERE id = $${columns.length + 1}
        RETURNING *
      `;
      const allValues = [...values, id].map((v) =>
        typeof v === "string" ? `'${v}'` : v,
      );
      const finalQuery = query.replace(/\$(\d+)/g, (match, index) => {
        return allValues[Number.parseInt(index) - 1];
      });
      const result = (await sql.unsafe(finalQuery)) as unknown as T[];
      return ((Array.isArray(result) ? result[0] : null) as T) || null;
    } catch (error) {
      console.error(`Error updating ${table}:`, error);
      return null;
    }
  }

  static async delete(table: string, id: number | string): Promise<boolean> {
    const sql = getDatabase();
    try {
      await sql`DELETE FROM ${sql.unsafe(table)} WHERE id = ${id}`;
      return true;
    } catch (error) {
      console.error(`Error deleting from ${table}:`, error);
      return false;
    }
  }

  static async count(
    table: string,
    conditions: Record<string, any> = {},
  ): Promise<number> {
    const sql = getDatabase();
    try {
      const conditionEntries = Object.entries(conditions);
      let query = `SELECT COUNT(*) as count FROM ${sql.unsafe(table)}`;

      if (conditionEntries.length > 0) {
        const safeValues = conditionEntries.map(([, value]) =>
          typeof value === "string" ? `'${value}'` : value,
        );
        const whereClauses = conditionEntries.map(
          ([key], i) => `${sql.unsafe(key)} = ${safeValues[i]}`,
        );
        query += ` WHERE ${whereClauses.join(" AND ")}`;
      }

      const result = (await sql.unsafe(query)) as unknown as Array<{
        count: string | number;
      }>;
      return Number(result[0]?.count) || 0;
    } catch (error) {
      console.error(`Error counting ${table}:`, error);
      return 0;
    }
  }
}

// Specific database service classes
export class EventService {
  static async getAll() {
    return DatabaseUtils.findMany<Tables<"events">>(
      "events",
      {},
      { column: "created_at", direction: "DESC" },
    );
  }

  static async getById(id: number) {
    return DatabaseUtils.findById<Tables<"events">>("events", id);
  }

  static async create(data: Inserts<"events">) {
    return DatabaseUtils.create<Tables<"events">>("events", data);
  }

  static async update(id: number, data: Updates<"events">) {
    return DatabaseUtils.update<Tables<"events">>("events", id, data);
  }

  static async delete(id: number) {
    return DatabaseUtils.delete("events", id);
  }
}

export class CustomerService {
  static async getAll() {
    return DatabaseUtils.findMany<Tables<"customers">>(
      "customers",
      {},
      { column: "created_at", direction: "DESC" },
    );
  }

  static async getById(id: number) {
    return DatabaseUtils.findById<Tables<"customers">>("customers", id);
  }

  static async create(data: Inserts<"customers">) {
    return DatabaseUtils.create<Tables<"customers">>("customers", data);
  }

  static async update(id: number, data: Updates<"customers">) {
    return DatabaseUtils.update<Tables<"customers">>("customers", id, data);
  }

  static async delete(id: number) {
    return DatabaseUtils.delete("customers", id);
  }
}

export class OrderService {
  static async getAll() {
    const sql = getSql();
    return sql`
      SELECT
        o.*,
        c.name as customer_name,
        c.email as customer_email,
        e.name as event_name
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      LEFT JOIN events e ON o.event_id = e.id
      ORDER BY o.created_at DESC
    `;
  }

  static async getById(id: number) {
    const sql = getSql();
    const result = await sql`
      SELECT
        o.*,
        c.name as customer_name,
        c.email as customer_email,
        e.name as event_name
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      LEFT JOIN events e ON o.event_id = e.id
      WHERE o.id = ${id}
    `;
    return (result as any)[0] || null;
  }

  static async create(data: Inserts<"orders">) {
    return DatabaseUtils.create<Tables<"orders">>("orders", data);
  }

  static async update(id: number, data: Updates<"orders">) {
    return DatabaseUtils.update<Tables<"orders">>("orders", id, data);
  }

  static async delete(id: number) {
    return DatabaseUtils.delete("orders", id);
  }
}

export class PaymentChannelService {
  static async getAll() {
    return DatabaseUtils.findMany<Tables<"payment_channels">>(
      "payment_channels",
      { is_active: true },
      { column: "sort_order", direction: "ASC" },
    );
  }

  static async getById(id: number) {
    return DatabaseUtils.findById<Tables<"payment_channels">>(
      "payment_channels",
      id,
    );
  }

  static async create(data: Inserts<"payment_channels">) {
    return DatabaseUtils.create<Tables<"payment_channels">>(
      "payment_channels",
      data,
    );
  }

  static async update(id: number, data: Updates<"payment_channels">) {
    return DatabaseUtils.update<Tables<"payment_channels">>(
      "payment_channels",
      id,
      data,
    );
  }

  static async delete(id: number) {
    return DatabaseUtils.delete("payment_channels", id);
  }

  static async getInstructions(paymentChannelId: number) {
    const sql = getSql();
    return sql`
      SELECT * FROM payment_instructions
      WHERE payment_channel_id = ${paymentChannelId}
      ORDER BY step_order ASC
    `;
  }
}

export class SettingsService {
  static async getAll() {
    return DatabaseUtils.findMany<Tables<"settings">>(
      "settings",
      {},
      { column: "category", direction: "ASC" },
    );
  }

  static async getByKey(key: string) {
    const results = await DatabaseUtils.findMany<Tables<"settings">>(
      "settings",
      { key },
    );
    return results[0] || null;
  }

  static async getByCategory(category: string) {
    return DatabaseUtils.findMany<Tables<"settings">>(
      "settings",
      { category },
      { column: "key", direction: "ASC" },
    );
  }

  static async updateByKey(key: string, value: string) {
    const sql = getSql();
    const result = await sql`
      UPDATE settings
      SET value = ${value}, updated_at = CURRENT_TIMESTAMP
      WHERE key = ${key}
      RETURNING *
    `;
    return (result as any)[0] || null;
  }

  static async create(data: Inserts<"settings">) {
    return DatabaseUtils.create<Tables<"settings">>("settings", data);
  }

  static async delete(id: number) {
    return DatabaseUtils.delete("settings", id);
  }

  static async getBrandingSettings() {
    return this.getByCategory("branding");
  }

  static async getAppearanceSettings() {
    return this.getByCategory("appearance");
  }

  static async getGeneralSettings() {
    return this.getByCategory("general");
  }
}

// --- Metadata Generation ---

// Define a type for the settings we expect to find
import { DEFAULT_SETTINGS, SETTING_KEYS } from "@/types/settings";

interface BrandingSettings {
  appName: string;
  appDescription: string;
  favicon: string;
}

// Default metadata hanya digunakan jika tabel settings kosong / error
const defaultMetadata: BrandingSettings = {
  appName: DEFAULT_SETTINGS[SETTING_KEYS.APP_NAME] || "Admin Panel",
  appDescription: DEFAULT_SETTINGS[SETTING_KEYS.APP_DESCRIPTION] || "",
  favicon: DEFAULT_SETTINGS[SETTING_KEYS.APP_FAVICON] || "/favicon.png",
};

/**
 * Fetches all settings from the database and extracts branding-related metadata.
 * Provides default values if specific settings are not found.
 * @returns {Promise<BrandingSettings>} A promise that resolves to the branding settings.
 */
export async function getBrandingSettings(): Promise<BrandingSettings> {
  try {
    // This function runs on the server, so we can directly call the database service.
    const allSettings = await SettingsService.getAll();

    if (!allSettings || allSettings.length === 0) {
      console.error(
        "No settings found in the database, using default metadata.",
      );
      return defaultMetadata;
    }

    const appNameSetting = allSettings.find((s) => s.key === "app_name");
    const appDescriptionSetting = allSettings.find(
      (s) => s.key === "app_description",
    );
    const faviconSetting = allSettings.find((s) => s.key === "app_favicon");

    return {
      appName: appNameSetting?.value || defaultMetadata.appName,
      appDescription:
        appDescriptionSetting?.value || defaultMetadata.appDescription,
      favicon: faviconSetting?.value || defaultMetadata.favicon,
    };
  } catch (error) {
    console.error("Failed to fetch branding settings:", error);
    // Return default metadata in case of any error
    return defaultMetadata;
  }
}

/**
 * Generates the Next.js Metadata object using dynamic data from the database.
 * This is the new generateMetadata function to be used in the root layout.
 * @returns {Promise<Metadata>} A promise that resolves to the Next.js Metadata object.
 */
export async function generateDynamicMetadata(): Promise<Metadata> {
  const settings = await getBrandingSettings();

  return {
    title: settings.appName,
    description: settings.appDescription,
    generator: "v0.app",
    icons: {
      icon: settings.favicon,
      shortcut: settings.favicon,
    },
  };
}
