import { pgTable, bigint, text, timestamp, boolean, integer, numeric, varchar, jsonb, uuid, pgEnum, index, uniqueIndex, serial } from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

// Enums
export const orderStatusEnum = pgEnum("order_status", ["pending", "paid", "cancelled", "expired"]);
export const channelEnum = pgEnum("channel", ["email", "whatsapp"]);
export const triggerOnEnum = pgEnum("trigger_on", ["checkout", "paid", "reminder"]);
export const discountTypeEnum = pgEnum("discount_type", ["percentage", "fixed_amount"]);
export const logTypeEnum = pgEnum("log_type", ["checkout", "callback", "status_check", "error", "invalid_signature", "order_not_found_or_va_mismatch"]);
export const importStatusEnum = pgEnum("import_status", ["pending", "success", "error"]);

// Tables
export const events = pgTable("events", {
  id: bigint("id", { mode: "number" }).primaryKey().default(sql`nextval('events_id_seq'::regclass)`),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  description: text("description"),
  startDate: timestamp("start_date", { withTimezone: true }),
  endDate: timestamp("end_date", { withTimezone: true }),
  location: text("location"),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  slugIdx: uniqueIndex("events_slug_key").on(table.slug),
  slugIndex: index("idx_events_slug").on(table.slug),
}));

export const customers = pgTable("customers", {
  id: bigint("id", { mode: "number" }).primaryKey().default(sql`nextval('customers_id_seq'::regclass)`),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phoneNumber: text("phone_number"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  emailIdx: uniqueIndex("customers_email_key").on(table.email),
}));

export const paymentChannels = pgTable("payment_channels", {
  id: bigint("id", { mode: "number" }).primaryKey().default(sql`nextval('payment_channels_id_seq'::regclass)`),
  pgCode: text("pg_code").notNull(),
  pgName: text("pg_name").notNull(),
  vendor: varchar("vendor"),
  category: varchar("category"),
  imageUrl: text("image_url"),
  imageQris: text("image_qris"),
  isActive: boolean("is_active").default(true).notNull(),
  isRedirect: boolean("is_redirect").default(false).notNull(),
  sortOrder: integer("sort_order").default(99).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  pgCodeIdx: uniqueIndex("payment_channels_pg_code_key").on(table.pgCode),
}));

export const paymentInstructions = pgTable("payment_instructions", {
  id: bigint("id", { mode: "number" }).primaryKey().default(sql`nextval('payment_instructions_id_seq'::regclass)`),
  paymentChannelId: bigint("payment_channel_id", { mode: "number" }).references(() => paymentChannels.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  stepOrder: bigint("step_order", { mode: "number" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const notificationTemplates = pgTable("notification_templates", {
  id: bigint("id", { mode: "number" }).primaryKey().default(sql`nextval('notification_templates_id_seq'::regclass)`),
  name: text("name").notNull(),
  channel: text("channel").notNull().$type<"email" | "whatsapp">(),
  triggerOn: text("trigger_on").notNull().$type<"checkout" | "paid" | "reminder">(),
  subject: text("subject"),
  body: text("body").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  nameIdx: uniqueIndex("notification_templates_name_key").on(table.name),
}));

export const discounts = pgTable("discounts", {
  id: bigint("id", { mode: "number" }).primaryKey().default(sql`nextval('discounts_id_seq'::regclass)`),
  code: text("code").notNull(),
  description: text("description"),
  discountType: text("discount_type").notNull().$type<"percentage" | "fixed_amount">(),
  value: numeric("value", { precision: 12, scale: 2 }).notNull(),
  minimumAmount: numeric("minimum_amount", { precision: 10, scale: 2 }),
  maxDiscountAmount: numeric("max_discount_amount", { precision: 10, scale: 2 }),
  usageLimit: integer("usage_limit"),
  usageCount: integer("usage_count").default(0),
  validUntil: timestamp("valid_until", { withTimezone: true }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  codeIdx: uniqueIndex("discounts_code_key").on(table.code),
  codeIndex: index("idx_discounts_code").on(table.code),
  activeIndex: index("idx_discounts_active").on(table.isActive),
  validUntilIndex: index("idx_discounts_valid_until").on(table.validUntil),
}));

export const discountTicketTypes = pgTable("discount_ticket_types", {
  discountId: bigint("discount_id", { mode: "number" }).references(() => discounts.id, { onDelete: "cascade" }),
  ticketTypeId: bigint("ticket_type_id", { mode: "number" }).references(() => ticketTypes.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  pk: uniqueIndex("discount_ticket_types_pkey").on(table.discountId, table.ticketTypeId),
}));

export const ticketTypes = pgTable("ticket_types", {
  id: bigint("id", { mode: "number" }).primaryKey().default(sql`nextval('ticket_types_id_seq'::regclass)`),
  eventId: bigint("event_id", { mode: "number" }).references(() => events.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  price: numeric("price", { precision: 12, scale: 2 }).notNull(),
  quantityTotal: integer("quantity_total").default(0).notNull(),
  quantitySold: integer("quantity_sold").default(0).notNull(),
  ticketsPerPurchase: integer("tickets_per_purchase").default(1).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const orders = pgTable("orders", {
  id: bigint("id", { mode: "number" }).primaryKey().default(sql`nextval('orders_id_seq'::regclass)`),
  orderReference: text("order_reference").notNull(),
  customerId: bigint("customer_id", { mode: "number" }).references(() => customers.id).notNull(),
  eventId: bigint("event_id", { mode: "number" }).references(() => events.id).notNull(),
  paymentChannelId: bigint("payment_channel_id", { mode: "number" }).references(() => paymentChannels.id),
  discountId: bigint("discount_id", { mode: "number" }).references(() => discounts.id),
  orderDate: timestamp("order_date", { withTimezone: true }).defaultNow(),
  grossAmount: numeric("gross_amount", { precision: 12, scale: 2 }).notNull(),
  discountAmount: numeric("discount_amount", { precision: 12, scale: 2 }).default("0"),
  finalAmount: numeric("final_amount", { precision: 12, scale: 2 }).notNull(),
  status: text("status").notNull().$type<"pending" | "paid" | "cancelled" | "expired">(),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  virtualAccountNumber: text("virtual_account_number"),
  paymentResponseUrl: text("payment_response_url"),
  uniqueCode: integer("unique_code"),
  proofTransfer: text("proof_transfer"),
  isEmailCheckout: boolean("is_email_checkout").default(false).notNull(),
  isWaCheckout: boolean("is_wa_checkout").default(false).notNull(),
  isEmailPaid: boolean("is_email_paid").default(false).notNull(),
  isWaPaid: boolean("is_wa_paid").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  orderReferenceIdx: uniqueIndex("orders_order_reference_key").on(table.orderReference),
}));

export const orderItems = pgTable("order_items", {
  id: bigint("id", { mode: "number" }).primaryKey().default(sql`nextval('order_items_id_seq'::regclass)`),
  orderId: bigint("order_id", { mode: "number" }).references(() => orders.id, { onDelete: "cascade" }).notNull(),
  ticketTypeId: bigint("ticket_type_id", { mode: "number" }).references(() => ticketTypes.id, { onDelete: "restrict" }).notNull(),
  quantity: integer("quantity").notNull(),
  pricePerTicket: numeric("price_per_ticket", { precision: 12, scale: 2 }).notNull(),
  effectiveTicketCount: integer("effective_ticket_count"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const orderItemAttendees = pgTable("order_item_attendees", {
  id: bigint("id", { mode: "number" }).primaryKey().default(sql`nextval('order_item_attendees_id_seq'::regclass)`),
  orderItemId: bigint("order_item_id", { mode: "number" }).references(() => orderItems.id, { onDelete: "cascade" }).notNull(),
  attendeeName: text("attendee_name").notNull(),
  attendeeEmail: text("attendee_email").notNull(),
  attendeePhoneNumber: text("attendee_phone_number").notNull(),
  customAnswers: jsonb("custom_answers"),
  ticketId: bigint("ticket_id", { mode: "number" }).references(() => tickets.id, { onDelete: "set null" }),
  barcodeId: text("barcode_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const tickets = pgTable("tickets", {
  id: bigint("id", { mode: "number" }).primaryKey().default(sql`nextval('tickets_id_seq'::regclass)`),
  orderId: bigint("order_id", { mode: "number" }).references(() => orders.id, { onDelete: "cascade" }).notNull(),
  ticketTypeId: bigint("ticket_type_id", { mode: "number" }).references(() => ticketTypes.id).notNull(),
  ticketCode: text("ticket_code").notNull().default(sql`generate_random_string(8)`),
  attendeeName: text("attendee_name").notNull(),
  attendeeEmail: text("attendee_email"),
  attendeePhoneNumber: text("attendee_phone_number"),
  isCheckedIn: boolean("is_checked_in").default(false),
  checkedInAt: timestamp("checked_in_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  ticketCodeIdx: uniqueIndex("tickets_ticket_code_key").on(table.ticketCode),
}));

export const eventCustomFields = pgTable("event_custom_fields", {
  id: bigint("id", { mode: "number" }).primaryKey().default(sql`nextval('event_custom_fields_id_seq'::regclass)`),
  eventId: bigint("event_id", { mode: "number" }).references(() => events.id, { onDelete: "cascade" }).notNull(),
  fieldName: text("field_name").notNull(),
  fieldLabel: text("field_label").notNull(),
  fieldType: varchar("field_type").notNull(),
  isRequired: boolean("is_required").default(false).notNull(),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const eventCustomFieldOptions = pgTable("event_custom_field_options", {
  id: bigint("id", { mode: "number" }).primaryKey().default(sql`nextval('event_custom_field_options_id_seq'::regclass)`),
  customFieldId: bigint("custom_field_id", { mode: "number" }).references(() => eventCustomFields.id, { onDelete: "cascade" }).notNull(),
  optionValue: text("option_value").notNull(),
  optionLabel: text("option_label").notNull(),
  sortOrder: integer("sort_order").default(0),
});

export const ticketCustomFieldAnswers = pgTable("ticket_custom_field_answers", {
  id: bigint("id", { mode: "number" }).primaryKey().default(sql`nextval('ticket_custom_field_answers_id_seq'::regclass)`),
  ticketId: bigint("ticket_id", { mode: "number" }).references(() => tickets.id, { onDelete: "cascade" }).notNull(),
  customFieldId: bigint("custom_field_id", { mode: "number" }).references(() => eventCustomFields.id, { onDelete: "cascade" }).notNull(),
  answerValue: text("answer_value").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const ordersTemp = pgTable("orders_temp", {
  id: bigint("id", { mode: "number" }).primaryKey().default(sql`nextval('orders_temp_id_seq'::regclass)`),
  uploadSessionId: uuid("upload_session_id").notNull(),
  rowNumber: integer("row_number"),
  customerName: text("customer_name"),
  customerEmail: text("customer_email"),
  customerPhoneNumber: text("customer_phone_number"),
  eventId: bigint("event_id", { mode: "number" }),
  ticketTypeId: bigint("ticket_type_id", { mode: "number" }),
  quantity: integer("quantity").default(1),
  finalAmount: numeric("final_amount", { precision: 12, scale: 2 }),
  orderDate: timestamp("order_date", { withTimezone: true }),
  paymentChannelId: bigint("payment_channel_id", { mode: "number" }),
  importStatus: text("import_status").default("pending").$type<"pending" | "success" | "error">(),
  errorMessage: text("error_message"),
  barcodeId: text("barcode_id"),
  customAnswers: jsonb("custom_answers"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  sessionIdIdx: index("idx_orders_temp_session_id").on(table.uploadSessionId),
}));

export const paymentLogs = pgTable("payment_logs", {
  id: bigint("id", { mode: "number" }).primaryKey().default(sql`nextval('payment_logs_id_seq'::regclass)`),
  orderReference: text("order_reference"),
  virtualAccountNumber: text("virtual_account_number"),
  logType: text("log_type").notNull().$type<"checkout" | "callback" | "status_check" | "error" | "invalid_signature" | "order_not_found_or_va_mismatch">(),
  requestPayload: jsonb("request_payload"),
  responsePayload: jsonb("response_payload"),
  paymentResponseUrl: text("payment_response_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  orderReferenceIdx: index("idx_payment_logs_order_reference").on(table.orderReference),
  vaNumberIdx: index("idx_payment_logs_va_number").on(table.virtualAccountNumber),
}));

export const notificationLogs = pgTable("notification_logs", {
  id: bigint("id", { mode: "number" }).primaryKey().default(sql`nextval('notification_logs_id_seq'::regclass)`),
  orderReference: text("order_reference"),
  channel: text("channel").notNull().$type<"email" | "whatsapp">(),
  triggerOn: text("trigger_on").notNull().$type<"checkout" | "paid" | "reminder">(),
  recipientEmail: text("recipient_email"),
  recipientPhone: text("recipient_phone"),
  body: text("body"),
  requestPayload: jsonb("request_payload"),
  responsePayload: jsonb("response_payload"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  orderReferenceIdx: index("idx_notification_logs_order_reference").on(table.orderReference),
  recipientEmailIdx: index("idx_notification_logs_recipient_email").on(table.recipientEmail),
  recipientPhoneIdx: index("idx_notification_logs_recipient_phone").on(table.recipientPhone),
}));

export const settings = pgTable("settings", {
  id: integer("id").primaryKey().default(sql`nextval('settings_id_seq'::regclass)`),
  key: varchar("key", { length: 255 }).notNull(),
  value: text("value"),
  type: varchar("type", { length: 50 }).default("string").notNull(),
  category: varchar("category", { length: 100 }).default("general").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  keyIdx: uniqueIndex("settings_key_key").on(table.key),
  keyIndex: index("idx_settings_key").on(table.key),
  categoryIndex: index("idx_settings_category").on(table.category),
}));

export const users = pgTable("users", {
  id: integer("id").primaryKey().default(sql`nextval('users_id_seq'::regclass)`),
  name: text("name"),
  email: text("email"),
  emailVerified: timestamp("email_verified", { precision: 3 }),
  image: text("image"),
  role: text("role").default("USER").notNull(),
  createdAt: timestamp("created_at", { precision: 3 }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { precision: 3 }).notNull(),
});

export const accounts = pgTable("accounts", {
  userId: text("user_id").notNull(),
  type: text("type").notNull(),
  provider: text("provider").notNull(),
  providerAccountId: text("provider_account_id").notNull(),
  refreshToken: text("refresh_token"),
  accessToken: text("access_token"),
  expiresAt: integer("expires_at"),
  tokenType: text("token_type"),
  scope: text("scope"),
  idToken: text("id_token"),
  sessionState: text("session_state"),
  createdAt: timestamp("created_at", { precision: 3 }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { precision: 3 }).notNull(),
}, (table) => ({
  pk: uniqueIndex("accounts_pkey").on(table.provider, table.providerAccountId),
}));

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: text("user_id").notNull(),
  expires: timestamp("expires", { precision: 3 }).notNull(),
});

export const verificationTokens = pgTable("verification_tokens", {
  identifier: text("identifier").notNull(),
  token: text("token").notNull(),
  expires: timestamp("expires", { precision: 3 }).notNull(),
}, (table) => ({
  pk: uniqueIndex("verification_tokens_pkey").on(table.identifier, table.token),
}));

// Relations
export const eventsRelations = relations(events, ({ many }) => ({
  ticketTypes: many(ticketTypes),
  orders: many(orders),
  customFields: many(eventCustomFields),
}));

export const customersRelations = relations(customers, ({ many }) => ({
  orders: many(orders),
}));

export const paymentChannelsRelations = relations(paymentChannels, ({ many }) => ({
  orders: many(orders),
  instructions: many(paymentInstructions),
}));

export const paymentInstructionsRelations = relations(paymentInstructions, ({ one }) => ({
  paymentChannel: one(paymentChannels, {
    fields: [paymentInstructions.paymentChannelId],
    references: [paymentChannels.id],
  }),
}));

export const discountsRelations = relations(discounts, ({ many }) => ({
  orders: many(orders),
  ticketTypes: many(discountTicketTypes),
}));

export const ticketTypesRelations = relations(ticketTypes, ({ one, many }) => ({
  event: one(events, {
    fields: [ticketTypes.eventId],
    references: [events.id],
  }),
  orderItems: many(orderItems),
  tickets: many(tickets),
  discounts: many(discountTicketTypes),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  customer: one(customers, {
    fields: [orders.customerId],
    references: [customers.id],
  }),
  event: one(events, {
    fields: [orders.eventId],
    references: [events.id],
  }),
  paymentChannel: one(paymentChannels, {
    fields: [orders.paymentChannelId],
    references: [paymentChannels.id],
  }),
  discount: one(discounts, {
    fields: [orders.discountId],
    references: [discounts.id],
  }),
  orderItems: many(orderItems),
  tickets: many(tickets),
}));

export const orderItemsRelations = relations(orderItems, ({ one, many }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  ticketType: one(ticketTypes, {
    fields: [orderItems.ticketTypeId],
    references: [ticketTypes.id],
  }),
  attendees: many(orderItemAttendees),
}));

export const orderItemAttendeesRelations = relations(orderItemAttendees, ({ one }) => ({
  orderItem: one(orderItems, {
    fields: [orderItemAttendees.orderItemId],
    references: [orderItems.id],
  }),
  ticket: one(tickets, {
    fields: [orderItemAttendees.ticketId],
    references: [tickets.id],
  }),
}));

export const ticketsRelations = relations(tickets, ({ one, many }) => ({
  order: one(orders, {
    fields: [tickets.orderId],
    references: [orders.id],
  }),
  ticketType: one(ticketTypes, {
    fields: [tickets.ticketTypeId],
    references: [ticketTypes.id],
  }),
  customFieldAnswers: many(ticketCustomFieldAnswers),
}));

export const eventCustomFieldsRelations = relations(eventCustomFields, ({ one, many }) => ({
  event: one(events, {
    fields: [eventCustomFields.eventId],
    references: [events.id],
  }),
  options: many(eventCustomFieldOptions),
  answers: many(ticketCustomFieldAnswers),
}));

export const eventCustomFieldOptionsRelations = relations(eventCustomFieldOptions, ({ one }) => ({
  customField: one(eventCustomFields, {
    fields: [eventCustomFieldOptions.customFieldId],
    references: [eventCustomFields.id],
  }),
}));

export const ticketCustomFieldAnswersRelations = relations(ticketCustomFieldAnswers, ({ one }) => ({
  ticket: one(tickets, {
    fields: [ticketCustomFieldAnswers.ticketId],
    references: [tickets.id],
  }),
  customField: one(eventCustomFields, {
    fields: [ticketCustomFieldAnswers.customFieldId],
    references: [eventCustomFields.id],
  }),
}));

export const discountTicketTypesRelations = relations(discountTicketTypes, ({ one }) => ({
  discount: one(discounts, {
    fields: [discountTicketTypes.discountId],
    references: [discounts.id],
  }),
  ticketType: one(ticketTypes, {
    fields: [discountTicketTypes.ticketTypeId],
    references: [ticketTypes.id],
  }),
}));
