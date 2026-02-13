-- =============================================
-- SUSCRIPCIONES LA REAL - Schema Multi-tenant
-- =============================================

-- 1. MERCHANTS (Clientes de la plataforma, ej: GRATU)
-- =============================================
CREATE TABLE merchants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,                           -- "GRATU Colombia SAS"
  slug TEXT UNIQUE NOT NULL,                    -- "gratu" (para URLs)
  email TEXT NOT NULL,
  phone TEXT,

  -- Gateway de pagos del merchant
  gateway TEXT NOT NULL CHECK (gateway IN ('payu', 'wompi', 'mercadopago')),
  gateway_config JSONB NOT NULL DEFAULT '{}',   -- API keys encriptadas, merchant_id, etc.

  -- Configuración de la plataforma
  platform_fee_percent DECIMAL(5,2) DEFAULT 2.00,  -- Fee que cobra LA REAL (2%)

  -- Suscripción del merchant a LA REAL (cobrado via Wompi)
  subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'past_due', 'cancelled', 'trial')),
  subscription_plan TEXT DEFAULT 'starter',     -- starter, growth, enterprise
  subscription_price INTEGER DEFAULT 99000,     -- Precio mensual en COP
  next_platform_billing DATE,                   -- Próximo cobro de LA REAL al merchant
  wompi_token TEXT,                             -- Token de tarjeta para cobrar al merchant

  -- Metadata
  logo_url TEXT,
  website TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. PLANS (Planes que cada merchant ofrece a sus clientes)
-- =============================================
CREATE TABLE plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,

  name TEXT NOT NULL,                           -- "Plan Pro"
  description TEXT,
  price INTEGER NOT NULL,                       -- En centavos o unidad mínima
  currency TEXT DEFAULT 'COP',

  interval TEXT NOT NULL CHECK (interval IN ('daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly')),
  interval_count INTEGER DEFAULT 1,             -- cada cuántos intervalos (ej: cada 2 meses)

  features JSONB DEFAULT '[]',                  -- ["Feature 1", "Feature 2"]

  trial_days INTEGER DEFAULT 0,                 -- Días de prueba gratis

  is_active BOOLEAN DEFAULT true,
  is_public BOOLEAN DEFAULT true,               -- Visible en checkout público

  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CUSTOMERS (Clientes finales de cada merchant)
-- =============================================
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,

  email TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  document_type TEXT,                           -- CC, CE, NIT, Pasaporte
  document_number TEXT,

  -- Pueden tener múltiples métodos de pago (en payment_methods)
  default_payment_method_id UUID,

  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(merchant_id, email)
);

-- 4. PAYMENT_METHODS (Tokens de tarjetas)
-- =============================================
CREATE TABLE payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,

  gateway TEXT NOT NULL,                        -- payu, wompi, mercadopago
  token TEXT NOT NULL,                          -- Token de la pasarela

  -- Info para mostrar al usuario (no sensible)
  card_last_four TEXT,
  card_brand TEXT,                              -- visa, mastercard, amex
  card_exp_month TEXT,
  card_exp_year TEXT,
  cardholder_name TEXT,

  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. SUBSCRIPTIONS (Suscripciones de clientes finales)
-- =============================================
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES plans(id),
  payment_method_id UUID REFERENCES payment_methods(id),

  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN (
    'active',       -- Activa y al día
    'past_due',     -- Pago fallido, en período de gracia
    'paused',       -- Pausada por el usuario/merchant
    'cancelled',    -- Cancelada
    'trialing'      -- En período de prueba
  )),

  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  next_billing_date TIMESTAMPTZ NOT NULL,

  trial_end TIMESTAMPTZ,                        -- Fin del trial (si aplica)

  cancel_at_period_end BOOLEAN DEFAULT false,   -- Cancelar al final del período
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,

  -- Contadores
  billing_cycle_count INTEGER DEFAULT 0,        -- Cuántos ciclos ha pagado

  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. INVOICES (Facturas/Cobros)
-- =============================================
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id),

  invoice_number TEXT UNIQUE,                   -- INV-2024-0001

  amount INTEGER NOT NULL,                      -- Monto total
  currency TEXT DEFAULT 'COP',

  platform_fee INTEGER NOT NULL,                -- Fee de LA REAL
  net_amount INTEGER NOT NULL,                  -- amount - platform_fee

  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',      -- Pendiente de cobro
    'processing',   -- Procesando
    'paid',         -- Pagado exitosamente
    'failed',       -- Falló el cobro
    'refunded',     -- Reembolsado
    'void'          -- Anulado
  )),

  -- Info de la transacción
  gateway TEXT,
  gateway_transaction_id TEXT,
  gateway_response JSONB,

  paid_at TIMESTAMPTZ,
  due_date TIMESTAMPTZ,

  -- Reintentos
  attempt_count INTEGER DEFAULT 0,
  next_retry_at TIMESTAMPTZ,
  last_error TEXT,

  billing_period_start TIMESTAMPTZ,
  billing_period_end TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. PLATFORM_INVOICES (Cobros de LA REAL a los merchants)
-- =============================================
CREATE TABLE platform_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,

  invoice_number TEXT UNIQUE,                   -- PLAT-2024-0001

  -- Desglose
  subscription_amount INTEGER NOT NULL,         -- Costo del plan del merchant
  transaction_fees INTEGER DEFAULT 0,           -- Fees acumulados del período
  total_amount INTEGER NOT NULL,
  currency TEXT DEFAULT 'COP',

  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'processing', 'paid', 'failed', 'void'
  )),

  gateway_transaction_id TEXT,                  -- ID de transacción Wompi
  gateway_response JSONB,

  paid_at TIMESTAMPTZ,
  billing_period_start DATE,
  billing_period_end DATE,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. WEBHOOK_EVENTS (Log de webhooks recibidos)
-- =============================================
CREATE TABLE webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gateway TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMPTZ,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ÍNDICES
-- =============================================
CREATE INDEX idx_plans_merchant ON plans(merchant_id);
CREATE INDEX idx_customers_merchant ON customers(merchant_id);
CREATE INDEX idx_customers_email ON customers(merchant_id, email);
CREATE INDEX idx_payment_methods_customer ON payment_methods(customer_id);
CREATE INDEX idx_subscriptions_merchant ON subscriptions(merchant_id);
CREATE INDEX idx_subscriptions_customer ON subscriptions(customer_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_next_billing ON subscriptions(next_billing_date) WHERE status = 'active';
CREATE INDEX idx_invoices_merchant ON invoices(merchant_id);
CREATE INDEX idx_invoices_subscription ON invoices(subscription_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_pending ON invoices(status, next_retry_at) WHERE status IN ('pending', 'failed');

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================
ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_invoices ENABLE ROW LEVEL SECURITY;

-- Para APIs usamos service_role (bypass RLS)
-- Para dashboard de merchants, se crean políticas específicas

-- =============================================
-- FUNCIONES ÚTILES
-- =============================================

-- Generar número de factura
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.invoice_number := 'INV-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(NEW.id::text, 6, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_invoice_number
  BEFORE INSERT ON invoices
  FOR EACH ROW
  WHEN (NEW.invoice_number IS NULL)
  EXECUTE FUNCTION generate_invoice_number();

-- Actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_merchants_updated_at
  BEFORE UPDATE ON merchants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_plans_updated_at
  BEFORE UPDATE ON plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================
-- DATOS INICIALES
-- =============================================

-- Insertar GRATU como primer merchant
INSERT INTO merchants (
  name,
  slug,
  email,
  phone,
  gateway,
  gateway_config,
  subscription_plan,
  subscription_price,
  subscription_status
) VALUES (
  'GRATU Colombia SAS',
  'gratu',
  'hola@gratu.co',
  '+57 300 123 4567',
  'payu',
  '{
    "apiKey": "TU_API_KEY_PAYU",
    "apiLogin": "TU_API_LOGIN_PAYU",
    "merchantId": "TU_MERCHANT_ID_PAYU",
    "accountId": "TU_ACCOUNT_ID_PAYU",
    "isProduction": false
  }'::jsonb,
  'growth',
  149000,
  'active'
);

-- Insertar plan Pro de Tranki
INSERT INTO plans (
  merchant_id,
  name,
  description,
  price,
  currency,
  interval,
  features,
  trial_days
)
SELECT
  id,
  'Tranki Pro',
  'Acceso completo a todas las funciones de Tranki',
  29900,
  'COP',
  'monthly',
  '["Transacciones ilimitadas", "Categorías personalizadas", "Reportes avanzados", "Exportar datos", "Soporte prioritario"]'::jsonb,
  7
FROM merchants WHERE slug = 'gratu';
