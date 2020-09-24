Robocopy /E /NFL src public\scripts\src
npx google-closure-compiler ^
  --externs=src\externs.js ^
  --externs=node_modules\firebase\externs\firebase-app-externs.js ^
  --externs=node_modules\firebase\externs\firebase-auth-externs.js ^
  --externs=node_modules\firebase\externs\firebase-client-auth-externs.js ^
  --externs=node_modules\firebase\externs\firebase-error-externs.js ^
  --externs=node_modules\firebase\externs\firebase-externs.js ^
  --externs=node_modules\firebase\externs\firebase-firestore-externs.js ^
  --create_source_map=public\scripts\main.js.map ^
  --js_output_file=public\scripts\main.js ^
  --js='node_modules\google-closure-library\closure\goog\**.js' ^
  --js='node_modules\google-closure-library\closure\third_party\**.js' ^
  --js='src\**.js' ^
  --js='!src\*externs.js' ^
  --dependency_mode=PRUNE ^
  --compilation_level=ADVANCED_OPTIMIZATIONS ^
  --entry_point='src\main' ^
  %*
