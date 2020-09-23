#!/bin/sh

cd public/scripts
npx google-closure-compiler \
  --platform=java \
  --externs=src/externs.js \
  --externs=../../node_modules/firebase/externs/firebase-app-externs.js \
  --externs=../../node_modules/firebase/externs/firebase-auth-externs.js \
  --externs=../../node_modules/firebase/externs/firebase-client-auth-externs.js \
  --externs=../../node_modules/firebase/externs/firebase-error-externs.js \
  --externs=../../node_modules/firebase/externs/firebase-externs.js \
  --externs=../../node_modules/firebase/externs/firebase-firestore-externs.js \
  --create_source_map=admin.js.map \
  --js_output_file=admin.js \
  --js='../../node_modules/google-closure-library/closure/goog/**.js' \
  --js='../../node_modules/google-closure-library/closure/third_party/**.js' \
  --js='src/**.js' \
  --js='!src/*externs.js' \
  --dependency_mode=PRUNE \
  --compilation_level=ADVANCED_OPTIMIZATIONS \
  --entry_point='src/admin'
mv admin.js admin.js.map ../../admin/scripts/
