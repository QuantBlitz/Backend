-- http://instagram-engineering.tumblr.com/post/10853187575/sharding-ids-at-instagram
-- Instagram ID Generator Credit BEGIN

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

-- Instagram ID Generator Credit END

CREATE TYPE user_role AS ENUM ('ADMIN', 'MOD', 'MEMBER', 'BANNED');
CREATE TYPE user_status AS ENUM ('NEW', 'ACTIVE', 'DEACTIVATED');
CREATE TYPE trade_action AS ENUM ('BUY', 'SELL');

CREATE TABLE users (
  id BIGINT PRIMARY KEY NOT NULL DEFAULT id_generator(),
  email VARCHAR(65) NOT NULL,
  username VARCHAR(35) NOT NULL,
  password_hash TEXT NOT NULL,
  status user_status DEFAULT 'NEW',
  role user_role DEFAULT 'MEMBER',
  verified BOOLEAN DEFAULT FALSE,
  date_created TIMESTAMPTZ DEFAULT now(),
  date_deleted TIMESTAMPTZ DEFAULT NULL,
  UNIQUE (email, username, date_deleted)
);

CREATE TABLE user_verifications (
  id SERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users NOT NULL,
  token VARCHAR(255) UNIQUE NOT NULL,
  expiration TIMESTAMPTZ NOT NULL,
  date_created TIMESTAMPTZ DEFAULT now(),
  date_deleted TIMESTAMPTZ DEFAULT NULL,
  UNIQUE(user_id, token, date_deleted)
);

CREATE TABLE user_settings (
  id SERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users NOT NULL,
  notification_alerts BOOLEAN DEFAULT TRUE,
  date_created TIMESTAMPTZ DEFAULT now(),
  date_deleted TIMESTAMPTZ DEFAULT NULL,
  UNIQUE(user_id, date_deleted)
);

CREATE TABLE user_details (
  user_id BIGINT REFERENCES users NOT NULL,
  avatar TEXT,
  bio TEXT,
  first_name VARCHAR(155),
  last_name VARCHAR(155),
  birthday TIMESTAMPTZ DEFAULT NULL,
  date_created TIMESTAMPTZ DEFAULT now(),
  date_deleted TIMESTAMPTZ DEFAULT NULL,
  UNIQUE(user_id, date_deleted)
);

CREATE TABLE watchlists (
  id SERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users,
  name VARCHAR(255) NOT NULL DEFAULT 'Watchlist',
  date_created TIMESTAMPTZ DEFAULT now(),
  date_deleted TIMESTAMPTZ DEFAULT NULL,
  UNIQUE(user_id, name, date_deleted)
);

CREATE TABLE portfolios (
  id SERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users NOT NULL,
  name VARCHAR(25) DEFAULT 'Portfolio',
  capital DECIMAL CHECK (capital >= 0) DEFAULT 100000,
  private BOOLEAN DEFAULT TRUE,
  date_created TIMESTAMPTZ DEFAULT now(),
  date_deleted TIMESTAMPTZ DEFAULT NULL,
  UNIQUE(user_id, name, date_deleted)
);

CREATE TABLE stocks (
  id SERIAL PRIMARY KEY,
  isin VARCHAR(55) UNIQUE,
  company VARCHAR(155) UNIQUE,
  symbol VARCHAR(15) UNIQUE NOT NULL,
  date_created TIMESTAMPTZ DEFAULT now(),
  date_deleted TIMESTAMPTZ DEFAULT NULL,
  UNIQUE(symbol, date_deleted)
);

CREATE TABLE watchlist_stocks (
  id SERIAL PRIMARY KEY,
  watchlist BIGINT REFERENCES watchlists NOT NULL,
  stock INTEGER REFERENCES stocks NOT NULL,
  date_created TIMESTAMPTZ DEFAULT now(),
  date_deleted TIMESTAMPTZ DEFAULT NULL,
  UNIQUE (watchlist, stock, date_deleted)
);

CREATE TABLE stock_transactions (
  id SERIAL PRIMARY KEY,
  portfolio INTEGER REFERENCES portfolios NOT NULL,
  stock INTEGER REFERENCES stocks NOT NULL,
  shares INTEGER NOT NULL,
  price DECIMAL NOT NULL,
  action trade_action NOT NULL,
  date_created TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE comments (
  id SERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users NOT NULL,
  content TEXT NOT NULL,
  date_created TIMESTAMPTZ DEFAULT now(),
  date_deleted TIMESTAMPTZ DEFAULT NULL
);

CREATE TABLE parents (
  id SERIAL PRIMARY KEY,
  stock INTEGER REFERENCES stocks,
  child INTEGER REFERENCES comments
);

CREATE TABLE children (
  id SERIAL PRIMARY KEY,
  root INTEGER REFERENCES stocks,
  parent INTEGER REFERENCES comments,
  child INTEGER REFERENCES comments
);

CREATE TABLE comment_votes (
  user_id BIGINT REFERENCES users NOT NULL,
  comment INTEGER REFERENCES comments NOT NULL,
  value INTEGER NOT NULL DEFAULT 0,
  date_created TIMESTAMPTZ DEFAULT now(),
  date_deleted TIMESTAMPTZ DEFAULT NULL,
  UNIQUE (user_id, comment, date_deleted)
);

CREATE UNIQUE INDEX unique_username ON users (lower(username));
CREATE UNIQUE INDEX unique_email ON users (lower(email));
CREATE UNIQUE INDEX unique_symbol ON stocks (lower(symbol));

CREATE VIEW latest_trades AS
  SELECT stock_transactions.id, username, symbol, shares, price, action
  FROM stock_transactions
  LEFT JOIN stocks ON stock_transactions.stock = stocks.id
  LEFT JOIN portfolios ON stock_transactions.portfolio = portfolios.id
  RIGHT JOIN users ON portfolios.user_id = users.id
  WHERE stock_transactions.id IS NOT NULL
  ORDER BY id DESC LIMIT 10;
