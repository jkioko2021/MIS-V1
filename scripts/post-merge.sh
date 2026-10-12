#!/bin/bash
set -e
pnpm install --frozen-lockfile
pnpm --filter db push
node scripts/src/development-document-metadata.mjs
