CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE roles_enum AS ENUM ('superadmin', 'admin');
CREATE TYPE types_enum AS ENUM ('manager', 'user');

CREATE TABLE IF NOT EXISTS companies (
    id SERIAL PRIMARY KEY,
    guid UUID NOT NULL DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    guid UUID NOT NULL DEFAULT uuid_generate_v4(),
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    company_id INTEGER CONSTRAINT fk_company REFERENCES companies(id),
    role roles_enum NOT NULL,
    type types_enum NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);