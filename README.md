# Pixel Paint Studio 🎨✨

**Pixel Paint Studio** es una aplicación web interactiva diseñada para la creación, edición y recreación animada de imágenes **píxel a píxel**. Combina herramientas de dibujo de estilo retro con un motor de reconstrucción en tiempo real que traza cualquier imagen celda por celda utilizando algoritmos espaciales y cuantitativos de color.

---

## 🚀 Características Principales

### 1. 🔄 Motor de Reconstrucción Animada Píxel a Píxel
- **Visualización en Tiempo Real**: Observa cómo se ensambla una imagen punto por punto en el lienzo.
- **5 Patrones de Trazado**:
  - *Línea por línea (Scanline)*: Barrido horizontal progresivo.
  - *Espiral*: Trazado concéntrico desde el centro hacia los extremos.
  - *Por Luminosidad*: Ordena los píxeles desde las sombras y contornos oscuros hasta las altas luces.
  - *Dispersión aleatoria (Matrix)*: Montaje holográfico estocástico.
  - *Columna por columna*: Barrido vertical.
- **Control Total**: Velocidad regulable (1x hasta 150x), pausa/reanudación, avance por pasos (+10 px) y opción de finalizado instantáneo.
- **Síntesis de Sonido Retro**: Audio sintetizado proceduralmente mediante la Web Audio API con frecuencias moduladas por la luminosidad del píxel.

### 2. 📤 Carga y Procesamiento Dinámico de Imágenes
- Sube cualquier imagen (`.png`, `.jpg`, `.webp`) desde tu equipo.
- Muestreo automático a resolución de píxeles (32×32, 64×64 o 128×128).
- Extracción automática de la paleta de colores dominantes de la imagen cargada.
- **Capa Fantasma**: Superposición semitransparente de la fotografía original para comparar y pintar con precisión.

### 3. 🖌️ Herramientas de Dibujo Pixel-Perfect
- **Lápiz de Precisión**: Con algoritmo de interpolación Bresenham para evitar discontinuidades en trazos rápidos. Tamaños configurables (1px, 2px, 4px).
- **Borrador**.
- **Cuentagotas (Gotero)**: Muestreo inmediato de cualquier color del lienzo.
- **Bote de Pintura (Flood Fill)**: Relleno de áreas contiguas con algoritmo BFS.
- **Formas**: Herramientas de línea recta y rectángulos.
- **Historial Completo**: Deshacer (`Ctrl + Z`) y Rehacer (`Ctrl + Y`).

### 4. 🎨 Gestión de Paletas y Color
- Selector de color nativo y campo de entrada hexadecimal (`#RRGGBB`).
- Paleta extraída de la imagen activa.
- Presets clásicos integrados: **PICO-8** (16 colores), **GameBoy** (4 tonos verdosos), **Cyberpunk Neon** y **NES Classic**.
- Paleta personalizada del usuario con función de agregar color.

### 5. 💾 Exportación Nítida
- **Exportar PNG Nativo**: Descarga el archivo exacto a la resolución del lienzo (ej. 64×64 px).
- **Exportar HD**: Genera un archivo a 1024×1024 px con escalado *nearest-neighbor* sin desenfoques ni interpolación borrosa.

---

## ⌨️ Atajos de Teclado

| Tecla | Acción |
| :--- | :--- |
| `B` | Seleccionar Lápiz (Brush) |
| `E` | Seleccionar Borrador (Eraser) |
| `I` | Seleccionar Cuentagotas (Eyedropper) |
| `G` | Alternar visualización de la cuadrícula (Grid) |
| `Ctrl + Z` | Deshacer |
| `Ctrl + Y` / `Ctrl + Shift + Z` | Rehacer |
| `Rueda del Ratón` | Zoom dinámico sobre el lienzo |

---

## 🛠️ Tecnologías Empleadas

- **Frontend**: HTML5 Canvas, Vanilla CSS (Diseño oscuro, Glassmorphism, CSS Custom Properties), Vanilla JavaScript (ES6+).
- **Procesamiento Opcional**: Python 3 con Pillow (`PIL`) para cuantización y dithering matricial previo (`generate_pixels.py`).

---

## 📦 Estructura del Proyecto

```text
Paint/
├── .gitignore              # Exclusión de imágenes binarias y temporales
├── README.md               # Documentación general del proyecto
├── index.html              # Estructura semántica de la aplicación
├── style.css               # Sistema de diseño, temas y responsividad
├── app.js                  # Motor de dibujo, animaciones y audio
├── generate_pixels.py      # Script de cuantización y preprocesamiento
└── avatar_data.json        # Datos matriciales y paletas generadas
```

---

## 🚀 Puesta en Marcha Local

No requiere dependencias complejas ni gestores de paquetes externos. Puedes ejecutarlo con cualquier servidor HTTP local:

### Con Python:
```bash
python3 -m http.server 8085
```

Abre en tu navegador favorito:
```text
http://localhost:8085
```

---

## 📄 Licencia

Este proyecto está disponible bajo la licencia MIT.
