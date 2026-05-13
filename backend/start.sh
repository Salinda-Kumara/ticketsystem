#!/bin/sh

# Exit immediately if a command exits with a non-zero status
set -e

echo "Running Prisma migrations..."
# This pushes the schema to the database if migration files aren't heavily used
# Alternatively, if you use migration files, use `npx prisma migrate deploy`
npx prisma db push

echo "Starting Node.js server..."
npm run start
