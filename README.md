# HOLO//LAB

Editor visual de escritorio construido con React y Vite. Esta etapa incluye la interfaz de edición, la carga de imágenes y la pila de efectos como base para continuar el proyecto.

Halftone, Blanco y negro, RGB Shift, Glitch, Grain, CMYK Shift, Duotone, Engraved, Bitmap y Dithering se procesan en Canvas en la vista previa y pueden combinarse. Halftone conserva los controles Tamaño, Contraste e Intensidad y los botones Puntos, Líneas y Diamante; al elegir Líneas se puede ajustar la orientación. Halftone también conserva los colores originales o aplica una paleta editable de tinta y fondo. RGB Shift controla desplazamientos horizontal y vertical; Glitch añade franjas; Grain ajusta tamaño e intensidad; CMYK Shift ajusta el desplazamiento y la inclusión independiente de cada placa; Duotone ofrece colores para sombras y luces e intensidad. Engraved crea líneas grabadas ajustables; Bitmap usa bloques pequeños, umbral y colores editables de tinta y fondo; Dithering genera una trama Floyd–Steinberg seleccionable entre puntos, líneas verticales u horizontales, diagonales, trama cruzada y cuadrícula. Permite conservar los colores originales o elegir una paleta editable de dos colores con tamaño, niveles e intensidad ajustables. Los efectos desactivados se retiran de la pila y del resultado; se pueden añadir otra vez desde el catálogo. La previsualización usa Canvas de alta calidad y la exportación PNG conserva la resolución original.

En CMYK Shift se puede incluir o excluir cada placa de color. El catálogo permite seleccionar y activar o desactivar cada efecto. Los efectos aplicados se pueden quitar de la pila y volver a añadir desde el catálogo.

Holographic Foil añade una reflexión iridiscente no destructiva con intensidad (0–200%), brillo y selección entre arcoíris espectral, prisma angular, ondas, destellos radiales y microtrama de foil. Se procesa en Canvas para la vista 2D y la exportación PNG. La vista 3D usa una tarjeta CSS con perspectiva, inclinación por arrastre y una reflexión que responde al ángulo y a la luz; al exportar desde esa vista, el efecto incorpora la inclinación y la luz actuales.

## Desarrollo

```bash
pnpm install
pnpm dev
```

También se puede usar `npm install` y `npm run dev`.

## Incluido

- Abrir o arrastrar imágenes PNG, JPG/JPEG y WebP al lienzo.
- Estados vacío y cargado, con controles activados según corresponda.
- Catálogo con interruptores, pila editable, selección y controles de parámetros para los efectos implementados.
- Deshacer cambios de la pila, restablecerla y exportar a PNG con los efectos activos.
- Zoom con rueda, botones y ajuste automático; selector de vista 2D o tarjeta 3D.

La tarjeta 3D es una vista de presentación CSS; la exportación conserva el formato de imagen plano a resolución original y aplica los efectos activos, incluido Holographic Foil con la inclinación y luz actuales.
