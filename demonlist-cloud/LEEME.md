# Sopón Zacamil List (versión en la nube)

Lista de demons de Geometry Dash compartida entre varias personas.
Cualquiera con el enlace **ve** la lista. Quien tenga la **contraseña de edición** puede añadir,
mover y borrar niveles desde la propia página, y se guarda en la nube (Netlify Blobs).
No hay que subir archivos cada vez.

## Qué trae

- Una lista por jugador (Jugador 1, Jugador 2, ... se renombran en **Ajustes**).
- Pestaña **Comparar**: todos los niveles juntos y quién se pasó cada uno
  (filtros: "Los dos", "Solo ...").
- Pestaña **Estadísticas** con intentos, puntos y línea de tiempo.
- Imágenes subidas desde la página (se guardan en la nube).
- Los cambios de uno aparecen al otro al recargar o al volver a la pestaña.
  Si los dos guardan a la vez, la página avisa y recarga, sin perder datos.

## Ponerlo en Netlify (una sola vez)

Este modo necesita un despliegue desde GitHub. **Arrastrar una carpeta no sirve**,
porque así no se despliega la función que guarda los datos.

1. Entra en https://app.netlify.com → **Add new site → Import an existing project → GitHub**.
   Autoriza a Netlify y elige el repo `Cosas-ramdoms-XD`.
2. En **Branch to deploy** elige `claude/kind-knuth-gbu6bz`
   (o pasa los cambios a `main` y deja `main`).
3. No hace falta tocar nada más: la configuración está en `netlify.toml`. Pulsa **Deploy**.
4. Cuando termine, ve a **Site configuration → Environment variables → Add a variable**:
   - Key: `EDIT_PASSWORD`
   - Value: la contraseña que quieras (larga, mejor una frase).
5. Ve a **Deploys → Trigger deploy → Deploy site** para que la función la lea.
6. Abre tu sitio, pulsa **Editar** y escribe la contraseña.
   Entra en **Ajustes** para poner el nombre de cada jugador y la imagen de la página.
7. Pásale el enlace a tu amigo. Si quieres que también edite, pásale la contraseña.

La primera vez, la página arranca con tus 12 niveles (archivo `public/seed.json`).
En cuanto guardes algo, esos datos pasan a vivir en la nube.

## Cosas a saber

- La contraseña es **una sola** para todos los que editan: quien la tenga puede cambiar las dos listas.
- Cambiarla: edita `EDIT_PASSWORD` en Netlify y vuelve a desplegar.
- En **Ajustes → Copia de seguridad** descargas un JSON con todos los datos.
- Si arriba sale "No se pudo conectar con la nube", la función no está desplegada
  (por ejemplo si subiste la carpeta arrastrándola). Usa el despliegue desde GitHub.
- Si al entrar dice "Falta configurar EDIT_PASSWORD", crea la variable y vuelve a desplegar.
- Geometry Dash es de RobTop Games. Sitio de fans sin afiliación oficial.
