-- Trigger definitions (jalankan setelah function_event.sql / view).

DROP TRIGGER IF EXISTS auto_generate_slug_trigger ON events;
CREATE TRIGGER auto_generate_slug_trigger
BEFORE INSERT OR UPDATE OF name ON events
FOR EACH ROW
EXECUTE FUNCTION public.auto_generate_slug();

DROP TRIGGER IF EXISTS calculate_effective_ticket_count_trigger ON order_items;
CREATE TRIGGER calculate_effective_ticket_count_trigger
BEFORE INSERT OR UPDATE OF quantity, ticket_type_id ON order_items
FOR EACH ROW
EXECUTE FUNCTION public.calculate_effective_ticket_count();

DROP TRIGGER IF EXISTS create_tickets_on_paid_order_trigger ON orders;
CREATE TRIGGER create_tickets_on_paid_order_trigger
AFTER INSERT OR UPDATE OF status ON orders
FOR EACH ROW
EXECUTE FUNCTION public.create_tickets_on_paid_order();

DROP TRIGGER IF EXISTS update_events_updated_at ON events;
CREATE TRIGGER update_events_updated_at
BEFORE UPDATE ON events
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;
CREATE TRIGGER update_customers_updated_at
BEFORE UPDATE ON customers
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS update_payment_channels_updated_at ON payment_channels;
CREATE TRIGGER update_payment_channels_updated_at
BEFORE UPDATE ON payment_channels
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS update_payment_instructions_updated_at ON payment_instructions;
CREATE TRIGGER update_payment_instructions_updated_at
BEFORE UPDATE ON payment_instructions
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS update_notification_templates_updated_at ON notification_templates;
CREATE TRIGGER update_notification_templates_updated_at
BEFORE UPDATE ON notification_templates
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS update_discounts_updated_at ON discounts;
CREATE TRIGGER update_discounts_updated_at
BEFORE UPDATE ON discounts
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS update_ticket_types_updated_at ON ticket_types;
CREATE TRIGGER update_ticket_types_updated_at
BEFORE UPDATE ON ticket_types
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS update_tickets_updated_at ON tickets;
CREATE TRIGGER update_tickets_updated_at
BEFORE UPDATE ON tickets
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS update_event_custom_fields_updated_at ON event_custom_fields;
CREATE TRIGGER update_event_custom_fields_updated_at
BEFORE UPDATE ON event_custom_fields
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS update_payment_logs_updated_at ON payment_logs;
CREATE TRIGGER update_payment_logs_updated_at
BEFORE UPDATE ON payment_logs
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS update_notification_logs_updated_at ON notification_logs;
CREATE TRIGGER update_notification_logs_updated_at
BEFORE UPDATE ON notification_logs
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS update_orders_temp_updated_at ON orders_temp;
CREATE TRIGGER update_orders_temp_updated_at
BEFORE UPDATE ON orders_temp
FOR EACH ROW
EXECUTE FUNCTION public.handle_order_items_updated_at();
