Del /Q public\styles\*
Del /Q public\scripts\*
Rmdir /Q public\scripts\*

Robocopy /E /NFL src public\scripts\src

copy /Y node_modules\autolinker\dist\Autolinker.min.js* public\scripts\
copy /Y node_modules\dompurify\dist\purify.min.js* public\scripts\

call npx google-closure-compiler ^
  --externs=src\externs.mjs ^
  --externs=node_modules\firebase\externs\firebase-app-externs.js ^
  --externs=node_modules\firebase\externs\firebase-auth-externs.js ^
  --externs=node_modules\firebase\externs\firebase-client-auth-externs.js ^
  --externs=node_modules\firebase\externs\firebase-database-externs.js ^
  --externs=node_modules\firebase\externs\firebase-error-externs.js ^
  --externs=node_modules\firebase\externs\firebase-externs.js ^
  --externs=node_modules\firebase\externs\firebase-firestore-externs.js ^
  --externs=node_modules\firebase\externs\firebase-messaging-externs.js ^
  --create_source_map=public\scripts\main.js.map ^
  --js_output_file=public\scripts\main.js ^
  --js='node_modules\google-closure-library\closure\goog\**.js' ^
  --js='node_modules\google-closure-library\closure\third_party\**.js' ^
  --js='src\**.js' ^
  --js='src\**.mjs' ^
  --js='!src\*externs.mjs' ^
  --dependency_mode=PRUNE ^
  --compilation_level=ADVANCED_OPTIMIZATIONS ^
  --entry_point='src\main' ^
  %*

call npx postcss styles/main.css -o public\styles\main.css > NUL
