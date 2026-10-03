# Sudoku Arcade 🕹️

Sitio web y juego de Sudoku estilo arcade retro desarrollado durante un workshop de AWS.

- **URL Original en AWS CloudFront:** [https://d2pjgvrh5olo6c.cloudfront.net/sudoku.html](https://d2pjgvrh5olo6c.cloudfront.net/sudoku.html)

---

## 🎮 Características

- **Estética retro / arcade:**
  - Efecto de líneas de escaneo CRT en tiempo real.
  - Paleta neón (verde fósforo, magenta, cian, amarillo).
  - Efecto de parpadeo (*flicker*) en tipografía y gráfico SVG de Torii.
- **🎵 Sonido y Música Retro Atari / 8-bit Chiptune:**
  - **Música de fondo en partida:** Tema estilo chiptune Atari a 132 BPM con melodía lead square wave, arpegios rápidos estilo C64/Atari, línea de bajo y percusión retro 8-bit.
  - **Sonido de inicio:** Jingle arcade ascendente (*Ready / Insert Coin*).
  - **Alerta de error:** Zumbador áspero disonante de onda cuadrada (*buzzer*) al cometer un fallo o detectar errores con *Check*.
  - **Sonido de victoria:** Fanfarria triunfal de 8-bit con arpegios brillantes al completar el Sudoku.
  - **Sonido de derrota:** Efecto descendente melancólico con caída de tono estilo Atari al pulsar *Solve*.
  - **Efectos táctiles:** Blips de sonido retro al ingresar o borrar números en las celdas.
  - **Control de audio:** Botón `♪ SOUND: ON / OFF` en la interfaz y atajo de teclado (`M`). Guarda la preferencia de mute en `localStorage`.
  - **Motor dual:** Reproduce los archivos `.wav` de la carpeta `sounds/` y cuenta con sintetizador Web Audio API en tiempo real de respaldo (100% compatible offline y con `file:///`).
- **Lógica de juego completa:**
  - Generador de Sudoku 9x9 con validación y algoritmo de backtracking.
  - Varios niveles de dificultad: *Easy*, *Normal*, *Hard*, *Insane*.
  - Detección y animación de colocación de números (*pop*).
  - Animación de celebración (*region flash*) al completar correctamente filas, columnas o cajas de 3x3.
  - Panel con tiempo transcurrido, contador de fallos y porcentaje de completado.
  - Botones de ayuda: *Check* (verificar errores actuales) y *Solve* (mostrar solución).
- **Controles:**
  - Ratón / Pantalla táctil (teclado numérico en pantalla).
  - Teclado físico:
    - Teclas de flecha (`↑`, `↓`, `←`, `→`) para navegar por la cuadrícula.
    - Números `1` - `9` para rellenar celdas.
    - `0`, `Backspace` o `Delete` para borrar la celda seleccionada.
    - `M` para silenciar / activar el sonido.

---

## 📁 Estructura del Repositorio

```
.
├── audio.js                 # Motor de audio y sintetizador Web Audio API
├── index.html               # Punto de entrada principal con interfaz y juego
├── sudoku.html              # Archivo original con soporte de audio integrado
├── README.md                # Documentación del proyecto
├── scripts/
│   └── generate-sounds.js   # Generador de audio PCM WAV sintetizado en Node.js
└── sounds/
    ├── error.wav            # Zumbador de alerta y error (0.38s)
    ├── gameover.wav         # Sonido de derrota / rendición (2.40s)
    ├── start.wav            # Jingle de inicio de partida (1.40s)
    ├── theme.wav            # Tema musical de fondo en loop (14.55s)
    └── win.wav              # Fanfarria de victoria (3.20s)
```

---

## 🔊 Generación de Sonidos

Si deseas regenerar o ajustar los efectos de sonido y la música, ejecuta:

```bash
node scripts/generate-sounds.js
```

---

## 🚀 Cómo ejecutar localmente

Puedes abrir directamente el archivo `index.html` o `sudoku.html` en cualquier navegador web, o iniciar un servidor local:

### Con Python:
```bash
python3 -m http.server 8080
```
Luego abre en tu navegador: [http://localhost:8080](http://localhost:8080)

### Con Node.js (npx):
```bash
npx serve .
```
