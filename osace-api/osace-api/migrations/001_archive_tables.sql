-- =======================================================
-- Migration: 001_archive_tables.sql
-- Descriere: Tabele pentru modulul Google Drive Archive
-- Executie pe VPS: 
--   sudo -u postgres psql osace_dev_db < migrations/001_archive_tables.sql
-- =======================================================

BEGIN;

-- 1. Folder-uri (mapping Drive <-> App)
CREATE TABLE IF NOT EXISTS archive_folders (
    id                    SERIAL PRIMARY KEY,
    drive_folder_id       VARCHAR(255) UNIQUE NOT NULL,
    parent_id             INTEGER REFERENCES archive_folders(id) ON DELETE SET NULL,
    name                  VARCHAR(500) NOT NULL,
    logical_path          TEXT NOT NULL,
    category              VARCHAR(100),
    department_id         VARCHAR(100),
    required_permission   VARCHAR(100),
    is_system_folder      BOOLEAN DEFAULT FALSE,
    created_by            INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at            TIMESTAMPTZ DEFAULT NOW(),
    updated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_archive_folders_parent ON archive_folders(parent_id);
CREATE INDEX IF NOT EXISTS idx_archive_folders_category ON archive_folders(category);
CREATE INDEX IF NOT EXISTS idx_archive_folders_path ON archive_folders(logical_path);

-- 2. Documente (Metadata indexat local, continut stocat in Google Drive)
CREATE TABLE IF NOT EXISTS archive_documents (
    id                    SERIAL PRIMARY KEY,
    drive_file_id         VARCHAR(255) UNIQUE NOT NULL,
    folder_id             INTEGER REFERENCES archive_folders(id) ON DELETE SET NULL,
    name                  VARCHAR(500) NOT NULL,
    original_name         VARCHAR(500),
    mime_type             VARCHAR(255),
    file_extension        VARCHAR(20),
    size_bytes            BIGINT,
    checksum_sha256       VARCHAR(64),
    category              VARCHAR(100),
    department_id         VARCHAR(100),
    event_id              INTEGER REFERENCES events(id) ON DELETE SET NULL,
    academic_year         VARCHAR(9),
    status                VARCHAR(50) DEFAULT 'active'
                          CHECK (status IN ('active', 'archived', 'deleted')),
    uploaded_by           INTEGER REFERENCES users(id) ON DELETE SET NULL,
    drive_web_view_link   TEXT,
    description           TEXT,
    tags                  TEXT[],
    metadata              JSONB DEFAULT '{}',
    created_at            TIMESTAMPTZ DEFAULT NOW(),
    updated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_archive_docs_folder ON archive_documents(folder_id);
CREATE INDEX IF NOT EXISTS idx_archive_docs_category ON archive_documents(category);
CREATE INDEX IF NOT EXISTS idx_archive_docs_event ON archive_documents(event_id);
CREATE INDEX IF NOT EXISTS idx_archive_docs_year ON archive_documents(academic_year);
CREATE INDEX IF NOT EXISTS idx_archive_docs_status ON archive_documents(status);
CREATE INDEX IF NOT EXISTS idx_archive_docs_uploaded_by ON archive_documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_archive_docs_created ON archive_documents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_archive_docs_name_search 
    ON archive_documents USING gin(to_tsvector('simple', name));

-- 3. Permisiuni explicite pe foldere (extinde user_permissions existent)
CREATE TABLE IF NOT EXISTS archive_folder_permissions (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER REFERENCES users(id) ON DELETE CASCADE,
    folder_id       INTEGER REFERENCES archive_folders(id) ON DELETE CASCADE,
    permission      VARCHAR(50) NOT NULL
                    CHECK (permission IN ('view', 'upload', 'edit', 'delete', 'manage')),
    granted_by      INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, folder_id, permission)
);

CREATE INDEX IF NOT EXISTS idx_archive_folder_perms_user ON archive_folder_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_archive_folder_perms_folder ON archive_folder_permissions(folder_id);

-- 4. Istoric versiuni documente
CREATE TABLE IF NOT EXISTS archive_document_versions (
    id                  SERIAL PRIMARY KEY,
    document_id         INTEGER NOT NULL REFERENCES archive_documents(id) ON DELETE CASCADE,
    version_number      INTEGER NOT NULL DEFAULT 1,
    drive_revision_id   VARCHAR(255),
    uploaded_by         INTEGER REFERENCES users(id) ON DELETE SET NULL,
    size_bytes          BIGINT,
    change_summary      TEXT,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(document_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_archive_versions_doc ON archive_document_versions(document_id);

-- 5. Jurnal dedicat de acces si operatiuni pe arhiva
CREATE TABLE IF NOT EXISTS archive_access_log (
    id              SERIAL PRIMARY KEY,
    document_id     INTEGER REFERENCES archive_documents(id) ON DELETE SET NULL,
    folder_id       INTEGER REFERENCES archive_folders(id) ON DELETE SET NULL,
    user_id         INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action          VARCHAR(100) NOT NULL,
    result          VARCHAR(50) DEFAULT 'success'
                    CHECK (result IN ('success', 'denied', 'error')),
    ip_address      INET,
    details         JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_archive_access_doc ON archive_access_log(document_id);
CREATE INDEX IF NOT EXISTS idx_archive_access_user ON archive_access_log(user_id);
CREATE INDEX IF NOT EXISTS idx_archive_access_action ON archive_access_log(action);
CREATE INDEX IF NOT EXISTS idx_archive_access_created ON archive_access_log(created_at DESC);

-- 6. Configurare centralizata Google Drive
CREATE TABLE IF NOT EXISTS archive_config (
    id              SERIAL PRIMARY KEY,
    root_folder_id  VARCHAR(255) NOT NULL,
    is_active       BOOLEAN DEFAULT TRUE,
    last_sync_at    TIMESTAMPTZ,
    folder_structure JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

COMMIT;
