#!/usr/bin/env bash
set -e

npm run migration:run
npm run seed:run
npm run start:prod > /dev/null 2>&1 &
npm run lint
npm run test:e2e -- --runInBand
