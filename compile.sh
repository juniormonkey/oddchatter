#!/bin/sh

rm -rf public/styles/*
rm -rf public/scripts/*

cp -Rf src public/scripts/

cp -f node_modules/autolinker/dist/Autolinker.min.js* public/scripts/
cp -f node_modules/dompurify/dist/purify.min.js* public/scripts/

npx google-closure-compiler \
  --platform=java \
  --externs=src/externs.js \
  --externs=node_modules/firebase/externs/firebase-app-externs.js \
  --externs=node_modules/firebase/externs/firebase-auth-externs.js \
  --externs=node_modules/firebase/externs/firebase-client-auth-externs.js \
  --externs=node_modules/firebase/externs/firebase-error-externs.js \
  --externs=node_modules/firebase/externs/firebase-externs.js \
  --externs=node_modules/firebase/externs/firebase-firestore-externs.js \
  --externs=node_modules/firebase/externs/firebase-messaging-externs.js \
  --create_source_map=public/scripts/main.js.map \
  --js_output_file=public/scripts/main.js \
  --js='node_modules/google-closure-library/closure/goog/**.js' \
  --js='node_modules/google-closure-library/closure/third_party/**.js' \
  --js='src/**.js' \
  --js='!src/*externs.js' \
  --dependency_mode=PRUNE \
  --compilation_level=ADVANCED_OPTIMIZATIONS \
  --entry_point='src/main' \
  $@

npx postcss styles/main.css -o public/styles/main.css > /dev/null
