CREATE SEQUENCE id_sequence;
CREATE OR REPLACE FUNCTION id_generator(
  OUT new_id BIGINT
) AS $$
DECLARE
  our_epoch BIGINT := 1072915200000;
  seq_id BIGINT;
  now_ms BIGINT;
  shard_id INT := 1;
BEGIN
  SELECT NEXTVAL('id_sequence') % 1024 INTO seq_id;
  SELECT FLOOR(EXTRACT(EPOCH FROM now()) * 1000) INTO now_ms;
  new_id := (now_ms - our_epoch) << 23;
  new_id := new_id | (shard_id << 10);
  new_id := new_id | (seq_id);
END;
$$
LANGUAGE PLPGSQL;

CREATE TYPE user_role AS ENUM ('ADMIN', 'MOD', 'MEMBER', 'BANNED');
CREATE TYPE user_status AS ENUM ('NEW', 'ACTIVE', 'DEACTIVATED');
CREATE TYPE user_membership AS ENUM ('FREE', 'TIER_ONE', 'TIER_TWO');
CREATE TYPE trade_action AS ENUM ('BUY', 'SELL');

CREATE TABLE users (
  id BIGINT PRIMARY KEY NOT NULL DEFAULT id_generator(),
  email VARCHAR(65) NOT NULL,
  username VARCHAR(35) NOT NULL,
  password_hash TEXT NOT NULL,
  status user_status DEFAULT 'NEW',
  role user_role DEFAULT 'MEMBER',
  membership user_membership DEFAULT 'FREE',
  verified BOOLEAN DEFAULT FALSE,
  date_created TIMESTAMPTZ DEFAULT now(),
  date_updated TIMESTAMPTZ DEFAULT NULL,
  date_deleted TIMESTAMPTZ DEFAULT NULL
);

CREATE TABLE user_settings (
  user_id BIGINT REFERENCES users UNIQUE NOT NULL,
  notification_alerts BOOLEAN DEFAULT TRUE,
  date_updated TIMESTAMPTZ DEFAULT NULL
);

CREATE TABLE user_details (
  user_id BIGINT REFERENCES users UNIQUE NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  last_login TIMESTAMPTZ DEFAULT NULL,
  first_name VARCHAR(55),
  last_name VARCHAR(55),
  birthday TIMESTAMPTZ DEFAULT NULL,
  date_updated TIMESTAMPTZ DEFAULT NULL
);

CREATE TABLE watchlists (
  id SERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users,
  name VARCHAR(255) NOT NULL DEFAULT 'Watchlist',
  date_created TIMESTAMPTZ DEFAULT now(),
  date_deleted TIMESTAMPTZ DEFAULT NULL
);

CREATE TABLE portfolios (
  id SERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users NOT NULL,
  name VARCHAR(25) DEFAULT 'Portfolio',
  capital DECIMAL CHECK (capital >= 0) DEFAULT 100000,
  private BOOLEAN DEFAULT TRUE,
  date_created TIMESTAMPTZ DEFAULT now(),
  date_updated TIMESTAMPTZ DEFAULT NULL,
  date_deleted TIMESTAMPTZ DEFAULT NULL
);

CREATE TABLE stocks (
  id SERIAL PRIMARY KEY,
  isin VARCHAR(55) UNIQUE,
  company VARCHAR(155) UNIQUE NOT NULL,
  symbol VARCHAR(15) UNIQUE NOT NULL,
  date_created TIMESTAMPTZ DEFAULT now(),
  date_updated TIMESTAMPTZ DEFAULT NULL,
  date_deleted TIMESTAMPTZ DEFAULT NULL
);

CREATE TABLE stock_transactions (
  id SERIAL PRIMARY KEY,
  stock INTEGER REFERENCES stocks NOT NULL,
  price DECIMAL NOT NULL,
  date_created TIMESTAMPTZ DEFAULT now(),
  date_deleted TIMESTAMPTZ DEFAULT NULL
);

CREATE TABLE watchlist_stocks (
  id SERIAL PRIMARY KEY,
  watchlist BIGINT REFERENCES watchlists NOT NULL,
  stock INTEGER REFERENCES stocks NOT NULL,
  date_created TIMESTAMPTZ DEFAULT now(),
  date_deleted TIMESTAMPTZ DEFAULT NULL,
  UNIQUE (watchlist, stock)
);

CREATE TABLE portfolio_stocks (
  id SERIAL PRIMARY KEY,
  portfolio BIGINT REFERENCES portfolios NOT NULL,
  stock INTEGER REFERENCES stocks,
  shares INTEGER NOT NULL,
  action trade_action NOT NULL,
  price DECIMAL NOT NULL,
  date_created TIMESTAMPTZ DEFAULT now(),
  date_deleted TIMESTAMPTZ DEFAULT NULL
);

CREATE UNIQUE INDEX unique_username ON users (lower(username));
CREATE UNIQUE INDEX unique_email ON users (lower(email));
CREATE UNIQUE INDEX unique_symbol ON stocks (lower(symbol));
