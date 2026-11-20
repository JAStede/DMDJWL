CREATE TABLE IF NOT EXISTS requests (id INTEGER PRIMARY KEY AUTOINCREMENT,created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),email TEXT NOT NULL,naam TEXT NOT NULL,product TEXT NOT NULL,bericht TEXT NOT NULL,locatie TEXT,plaats TEXT,status TEXT NOT NULL DEFAULT 'pending');
CREATE INDEX IF NOT EXISTS requests_email_created ON requests(email,created_at);
