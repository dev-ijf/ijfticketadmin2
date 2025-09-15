import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export { sql }

// Database types for TypeScript support
export interface Customer {
  id: number
  name: string
  email: string
  phone_number?: string
  created_at: string
  updated_at?: string
}

export interface Event {
  id: number
  name: string
  slug: string
  start_date?: string
  end_date?: string
  location?: string
  description?: string
  image_url?: string
  created_at: string
  updated_at?: string
}

export interface TicketType {
  id: number
  event_id: number
  name: string
  price: number
  quantity_total: number
  quantity_sold: number
  created_at: string
  updated_at?: string
}

export interface Order {
  id: number
  customer_id: number
  event_id: number
  order_reference: string
  status: string
  final_amount: number
  payment_channel_id?: number
  virtual_account_number?: string
  payment_response_url?: string
  payment_deadline?: string
  created_at: string
  updated_at?: string
}

export interface PaymentChannel {
  id: number
  pg_name: string
  pg_code: string
  is_active: boolean
  created_at: string
  updated_at?: string
}

export interface Discount {
  id: number
  code: string
  name: string
  type: string
  value: number
  is_active: boolean
  created_at: string
  updated_at?: string
}

export interface NotificationTemplate {
  id: string
  name: string
  channel: string
  trigger_on: string
  subject: string
  body: string
  is_active: boolean
  created_at: string
  updated_at?: string
}

export interface PaymentLog {
  id: number
  order_reference?: string
  virtual_account_number?: string
  log_type: string
  request_payload?: any
  response_payload?: any
  created_at: string
}

export interface NotificationLog {
  id: number
  order_id: number
  customer_id: number
  template_id: string
  channel: string
  status: string
  sent_at?: string
  created_at: string
}

export interface Ticket {
  id: number
  order_id: number
  ticket_type_id: number
  ticket_number: string
  status: string
  created_at: string
  updated_at?: string
}
