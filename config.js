// ⚠️ IMPORTANTE: Las claves ANON de Supabase son PÚBLICAS por diseño
// La seguridad se maneja con Row Level Security (RLS) en Supabase
// NO intentes "ocultar" esta clave - está diseñada para ser visible en el cliente

const SUPABASE_CONFIG = {
  url: "https://eurobrvauarexooknbpi.supabase.co",
  anonKey: "sb_publishable_AuBKM60iM53tjH4ptBGENQ_7MVuBcum"
};

// Para proteger tu base de datos, configura RLS en Supabase:
// 1. Ve a Authentication > Policies en tu proyecto Supabase
// 2. Crea políticas para la tabla 'rsvp'
// Ejemplo de política segura:
// - INSERT: true (permitir a todos insertar)
// - SELECT: false o auth.uid() = user_id (solo el dueño puede ver)
// - UPDATE/DELETE: false o con auth (evitar modificaciones no autorizadas)
