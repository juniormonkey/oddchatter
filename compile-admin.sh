#!/bin/bash -e

rm -rf admin/styles/*
rm -rf admin/scripts/*

cp -Rf src admin/scripts/

cp -f node_modules/autolinker/dist/Autolinker.min.js* admin/scripts/
cp -f node_modules/dompurify/dist/purify.min.js* admin/scripts/

npx google-closure-compiler \
  --platform=java \
  --externs=src/externs.mjs \
  --externs=node_modules/firebase/externs/firebase-app-externs.js \
  --externs=node_modules/firebase/externs/firebase-auth-externs.js \
  --externs=node_modules/firebase/externs/firebase-database-externs.js \
  --externs=node_modules/firebase/externs/firebase-client-auth-externs.js \
  --externs=node_modules/firebase/externs/firebase-error-externs.js \
  --externs=node_modules/firebase/externs/firebase-externs.js \
  --externs=node_modules/firebase/externs/firebase-firestore-externs.js \
  --create_source_map=admin/scripts/admin.js.map \
  --js_output_file=admin/scripts/admin.js \
  --js='node_modules/google-closure-library/closure/goog/**.js' \
  --js='node_modules/google-closure-library/closure/third_party/**.js' \
  --js='src/**.js' \
  --js='src/**.mjs' \
  --js='!src/*externs.mjs' \
  --dependency_mode=PRUNE \
  --compilation_level=ADVANCED_OPTIMIZATIONS \
  --define=config.ADMIN_MODE \
  --entry_point='src/admin' \
  $@

npx postcss styles/admin.css -o admin/styles/main.css > /dev/null
