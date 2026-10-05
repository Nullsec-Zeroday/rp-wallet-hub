#!/bin/bash
set -e

echo "🔄 Running database migrations..."

# Run migrations using the db package
npm run migrate --workspace=@rp-wallet/db

echo "✅ Database migrations completed successfully"

