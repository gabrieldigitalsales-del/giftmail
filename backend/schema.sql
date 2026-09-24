PRAGMA foreign_keys=ON;
CREATE TABLE giftmail_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  password_salt TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE giftmail_sessions (
  token_hash TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL,
  FOREIGN KEY(user_id) REFERENCES giftmail_users(id) ON DELETE CASCADE
);
CREATE INDEX idx_giftmail_sessions_user ON giftmail_sessions(user_id);
CREATE TABLE giftmail_settings (
  user_id INTEGER PRIMARY KEY,
  display_name TEXT,
  signature TEXT DEFAULT '',
  signature_name TEXT DEFAULT '',
  signature_company TEXT DEFAULT 'GIFT Excellence',
  signature_phone TEXT DEFAULT '(31) 3773-1234',
  signature_city TEXT DEFAULT 'Sete Lagoas - MG',
  signature_site TEXT DEFAULT 'www.giftexcellence.com.br',
  signature_logo_key TEXT DEFAULT '',
  signature_new INTEGER DEFAULT 1,
  signature_replies INTEGER DEFAULT 0,
  theme TEXT DEFAULT 'light',
  density TEXT DEFAULT 'comfortable',
  vacation INTEGER DEFAULT 0,
  vacation_text TEXT DEFAULT '',
  notifications INTEGER DEFAULT 1,
  sound INTEGER DEFAULT 0,
  storage_limit_bytes INTEGER NOT NULL DEFAULT 10737418240,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY(user_id) REFERENCES giftmail_users(id) ON DELETE CASCADE
);
CREATE TABLE giftmail_messages (
  id TEXT PRIMARY KEY,
  owner_user_id INTEGER NOT NULL,
  folder TEXT NOT NULL DEFAULT 'inbox',
  from_address TEXT NOT NULL DEFAULT '',
  to_json TEXT NOT NULL DEFAULT '[]',
  cc_json TEXT NOT NULL DEFAULT '[]',
  bcc_json TEXT NOT NULL DEFAULT '[]',
  subject TEXT NOT NULL DEFAULT '(sem assunto)',
  body_html TEXT NOT NULL DEFAULT '',
  body_text TEXT NOT NULL DEFAULT '',
  message_id TEXT DEFAULT '',
  in_reply_to TEXT DEFAULT '',
  read_flag INTEGER NOT NULL DEFAULT 0,
  starred INTEGER NOT NULL DEFAULT 0,
  labels_json TEXT NOT NULL DEFAULT '[]',
  scheduled_at TEXT,
  sent_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  raw_size INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY(owner_user_id) REFERENCES giftmail_users(id) ON DELETE CASCADE
);
CREATE INDEX idx_giftmail_messages_owner_folder_date ON giftmail_messages(owner_user_id,folder,created_at DESC);
CREATE INDEX idx_giftmail_messages_schedule ON giftmail_messages(folder,scheduled_at);
CREATE TABLE giftmail_attachments (
  id TEXT PRIMARY KEY,
  message_id TEXT NOT NULL,
  filename TEXT NOT NULL,
  content_type TEXT DEFAULT 'application/octet-stream',
  size_bytes INTEGER NOT NULL DEFAULT 0,
  r2_key TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY(message_id) REFERENCES giftmail_messages(id) ON DELETE CASCADE
);
CREATE INDEX idx_giftmail_attachments_message ON giftmail_attachments(message_id);
