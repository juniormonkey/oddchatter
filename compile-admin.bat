Del /Q admin\styles\*
Del /Q admin\scripts\*
Rmdir /Q admin\scripts\*

Robocopy /E /NFL src admin\scripts\src

copy /Y node_modules\autolinker\dist\Autolinker.min.js* admin\scripts\
copy /Y node_modules\dompurify\dist\purify.min.js* admin\scripts\

call npx google-closure-compiler ^
  --externs=src\externs.js ^
  --externs=node_modules\firebase\externs\firebase-app-externs.js ^
  --externs=node_modules\firebase\externs\firebase-auth-externs.js ^
  --externs=node_modules\firebase\externs\firebase-client-auth-externs.js ^
  --externs=node_modules\firebase\externs\firebase-error-externs.js ^
  --externs=node_modules\firebase\externs\firebase-externs.js ^
  --externs=node_modules\firebase\externs\firebase-firestore-externs.js ^
  --create_source_map=admin\scripts\admin.js.map ^
  --js_output_file=admin\scripts\admin.js ^
  --js='node_modules\google-closure-library\closure\goog\**.js' ^
  --js='node_modules\google-closure-library\closure\third_party\**.js' ^
  --js='src\**.js' ^
  --js='!src\*externs.js' ^
  --dependency_mode=PRUNE ^
  --compilation_level=ADVANCED_OPTIMIZATIONS ^
  --define=config.ADMIN_MODE ^
  --entry_point='src\admin' ^
  %*

call npx postcss styles/admin.css -o admin\styles\main.css > NUL