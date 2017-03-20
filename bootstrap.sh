#!/usr/bin/env bash

ln -s /vagrant/* ~/.

export DEBIAN_FRONTEND=noninteractive

sudo apt-get update

PG_VERSION=9.4
sudo apt-get install -y postgresql-$PG_VERSION postgresql-contrib-$PG_VERSION

# Install NVM
wget -qO- https://raw.githubusercontent.com/creationix/nvm/v0.32.0/install.sh | bash

# Postgresql Configuration files
PG_CONF="/etc/postgresql/$PG_VERSION/main/postgresql.conf"
PG_HBA="/etc/postgresql/$PG_VERSION/main/pg_hba.conf"
PG_DIR="/var/lib/postgresql/$PG_VERSION/main"

# Edit postgresql.conf to change listen address to '*'
sudo sed -i "s/#listen_addresses = 'localhost'/listen_addresses = '*'/" "$PG_CONF"

# Sets up that the DB interaction to be in utf-8
sudo bash -c "
cat << EOF >> $PG_CONF
client_encoding = utf8
EOF
cat << EOF >> $PG_HBA
host    all             all             all                     md5
EOF
"

# Load in the new config
sudo systemctl restart postgresql

# Defaults for development
APP_DB_NAME=quantblitz_dev
APP_DB_USER=quantblitz

# Reproducible but not immediately readable password
APP_DB_PASS=$(date | shasum -p | awk '{print $1}')

# Create the DB_USER
sudo -u postgres psql -c "CREATE USER $APP_DB_USER WITH PASSWORD '$APP_DB_PASS';"

# Create the DB
sudo -u postgres psql -c "CREATE DATABASE $APP_DB_NAME WITH OWNER=$APP_DB_USER LC_COLLATE='en_US.utf8' LC_CTYPE='en_US.utf8' ENCODING='UTF8' TEMPLATE=template0;"

# Give the user permissions to create new DBs
sudo -u postgres psql -c "ALTER USER $APP_DB_USER CREATEDB;"

# Prepping the DB with the schema
DB_SCHEMA=first_md_schema
sudo -u postgres psql $APP_DB_NAME -f /vagrant/schema/schema.sql
sudo -u postgres psql $APP_DB_NAME -c "GRANT USAGE ON SCHEMA public TO $APP_DB_USER";
sudo -u postgres psql $APP_DB_NAME -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO $APP_DB_USER";
sudo -u postgres psql $APP_DB_NAME -c "GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO $APP_DB_USER";

echo "Your PostgreSQL database has been setup and can be accessed on your local machine on the forwarded port (default: 15432)"
echo "Host: localhost"
echo "Port: 15432"
printf "Database: $APP_DB_NAME\n  Username: $APP_DB_USER\n  Password: $APP_DB_PASS\n"
printf "Admin access to postgres user via VM:\n  vagrant ssh\n  sudo -i -u postgres\n"
printf "psql access to app database user via VM:\n"
printf "  sudo -u postgres bash -c \"export PGUSER=$APP_DB_USER; export PGPASSWORD=$APP_DB_PASS; psql -h localhost $APP_DB_NAME\"\n"
echo "Env variable for application development:"
printf "  DATABASE_URL=postgresql://$APP_DB_USER:$APP_DB_PASS@localhost:15432/$APP_DB_NAME\n"
echo "Local command to access the database via psql:"
echo "  export PGUSER=$APP_DB_USER; export PGPASSWORD=$APP_DB_PASS; psql -h localhost -p 15432 $APP_DB_NAME"

# Create Knex connection config file for Node.js to connect with
cat << EOF >> config.json
{
  "knex" : {
    "client": "pg",
    "connection": {
      "host": "127.0.0.1",
      "port": "15432",
      "user": "$APP_DB_USER",
      "password": "$APP_DB_PASS",
      "database": "$APP_DB_NAME",
      "charset": "UTF8"
    }
  }
}
EOF

echo "Files generated:"
echo "  config.json with Knex connection details"
