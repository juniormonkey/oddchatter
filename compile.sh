#!/bin/sh

npx google-closure-compiler \
  --externs=src/externs.js \
  --externs=node_modules/firebase/externs/firebase-app-externs.js \
  --externs=node_modules/firebase/externs/firebase-auth-externs.js \
  --externs=node_modules/firebase/externs/firebase-client-auth-externs.js \
  --externs=node_modules/firebase/externs/firebase-error-externs.js \
  --externs=node_modules/firebase/externs/firebase-externs.js \
  --externs=node_modules/firebase/externs/firebase-firestore-externs.js \
  --compilation_level=ADVANCED \
  --js_output_file=public/scripts/main.js \
  --js='node_modules/google-closure-library/closure/goog/**.js' \
  --js='node_modules/google-closure-library/closure/third_party/**.js' \
  --js='src/**.js' \
  --js='!src/*externs.js' \
  --dependency_mode=PRUNE \
  --entry_point=goog:oddsalon.oddchatter
