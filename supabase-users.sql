-- =============================================
-- USUARIOS DE MERCHANTS (para login al dashboard)
-- =============================================

CREATE TABLE merchant_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,

  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,

  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('owner', 'admin', 'viewer')),

  is_active BOOLEAN DEFAULT true,
  email_verified BOOLEAN DEFAULT false,

  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_merchant_users_email ON merchant_users(email);
CREATE INDEX idx_merchant_users_merchant ON merchant_users(merchant_id);

-- RLS
ALTER TABLE merchant_users ENABLE ROW LEVEL SECURITY;

-- Trigger para updated_at
CREATE TRIGGER update_merchant_users_updated_at
  BEFORE UPDATE ON merchant_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================
-- CREAR USUARIO PARA GRATU
-- Email: hola@gratu.co
-- Password: Gratu2026!
-- =============================================
INSERT INTO merchant_users (
  merchant_id,
  email,
  password_hash,
  name,
  role
)
SELECT
  id,
  'hola@gratu.co',
  '$2b$10$3PFOgEx1iedh2Ab3EeKro.VgQBo89wyAVY9SLTGNl98YSZ2mJUUvy',
  'Admin GRATU',
  'owner'
FROM merchants
WHERE slug = 'gratu';
