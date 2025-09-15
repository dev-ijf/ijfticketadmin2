-- Create notification_templates table
CREATE TABLE IF NOT EXISTS notification_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('email', 'whatsapp', 'sms')),
    subject VARCHAR(500),
    content TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_notification_templates_type ON notification_templates(type);
CREATE INDEX IF NOT EXISTS idx_notification_templates_active ON notification_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_notification_templates_created_at ON notification_templates(created_at);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_notification_templates_updated_at 
    BEFORE UPDATE ON notification_templates 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample templates
INSERT INTO notification_templates (name, type, subject, content, is_active) VALUES
(
    'Email - Payment Confirmation',
    'email',
    'Payment Confirmation - {{event.name}}',
    '<p>Hi {{customer.name}},</p>
    <p>Thank you for your payment for <strong>{{event.name}}</strong>.</p>
    <p><strong>Order Details:</strong></p>
    <ul>
        <li>Order Reference: {{order.order_reference}}</li>
        <li>Amount: {{order.final_amount}}</li>
        <li>Payment Method: {{payment_channel.pg_name}}</li>
    </ul>
    <p>Your tickets will be sent to you shortly.</p>
    <p>Best regards,<br>Event Team</p>',
    true
),
(
    'WhatsApp - Payment Reminder',
    'whatsapp',
    'Payment Reminder',
    'Hi {{customer.name}}! 

Your order {{order.order_reference}} for {{event.name}} is waiting for payment.

Amount: {{order.final_amount}}
Payment Deadline: {{payment_deadline}}
Payment Method: {{payment_channel.pg_name}}

Complete your payment here: {{payment_response_url}}

Thank you!',
    true
),
(
    'Email - Order Checkout',
    'email',
    'Complete Your Order - {{event.name}}',
    '<p>Hi {{customer.name}},</p>
    <p>Thank you for your interest in <strong>{{event.name}}</strong>!</p>
    <p><strong>Order Summary:</strong></p>
    <ul>
        <li>Order Reference: {{order.order_reference}}</li>
        <li>Total Amount: {{order.final_amount}}</li>
        <li>Payment Deadline: {{payment_deadline}}</li>
    </ul>
    <p>Please complete your payment using the following details:</p>
    <p><strong>Payment Method:</strong> {{payment_channel.pg_name}}</p>
    <p><strong>Virtual Account:</strong> {{virtual_account_number}}</p>
    <p>Or pay directly at: <a href="{{payment_response_url}}">{{payment_response_url}}</a></p>
    <p>Best regards,<br>Event Team</p>',
    true
);
