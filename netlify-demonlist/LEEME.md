# Mi Demonlist para Netlify

Esta carpeta es una página estática completa. Solo tiene un archivo importante: `index.html`
(incluye el diseño, los datos y tus imágenes). No necesita servidor ni instalar nada.

## Subirla a Netlify (la primera vez)

1. Entra en https://app.netlify.com y crea una cuenta gratis si no tienes.
2. Busca la opción **Add new site → Deploy manually** (también existe https://app.netlify.com/drop).
3. Descomprime el zip y arrastra la **carpeta** `netlify-demonlist` a la zona de subida.
4. En unos segundos te da una dirección tipo `algo-random.netlify.app`.
   Puedes cambiarla en **Site configuration → Change site name**.

La interfaz de Netlify cambia con el tiempo. Si los nombres no coinciden, busca "Deploy manually" o "Drop".

## Añadir un nivel nuevo cuando te pases uno

1. Abre tu página y añade `#editar` al final de la dirección:
   `https://tu-sitio.netlify.app/#editar`
2. Aparece una barra verde de **Modo editor** y el botón **+ Añadir nivel**.
   Rellena nombre, posición, intentos y lo demás. La imagen puedes arrastrarla, pegarla (Ctrl+V) o elegirla.
   También puedes editar, subir y bajar puestos, borrar y cambiar tu nombre en **Perfil**.
3. Tus cambios quedan como **borrador en tu navegador** (los ves tú, no el resto).
4. Pulsa **Descargar index.html** en la barra verde.
5. Reemplaza el `index.html` de la carpeta por el que descargaste y súbela otra vez:
   en Netlify ve a **Deploys** y arrastra la carpeta encima del cuadro de subida.

Después de publicar, el borrador deja de hacer falta. Si abres `#editar` y la barra dice "sin cambios", todo está al día.

## Cosas a saber

- Cualquiera puede escribir `#editar` en la dirección, pero solo cambia **su copia en su navegador**.
  Nadie puede modificar tu página publicada: solo se actualiza cuando tú subes un nuevo `index.html`.
- El borrador vive en el navegador donde editas. Si cambias de equipo, descarga y sube antes.
- Si prefieres no arrastrar archivos cada vez, conecta el repositorio de GitHub a Netlify
  y deja `netlify-demonlist` como carpeta de publicación (ya hay un `netlify.toml` en el repo).
  Entonces basta con subir el nuevo `index.html` a GitHub y Netlify lo publica solo.
- Las fuentes (Lilita One y Rubik) se cargan desde Google Fonts. Sin conexión se ve con fuentes de reserva.
- Geometry Dash es de RobTop Games. Sitio de fans sin afiliación oficial.
