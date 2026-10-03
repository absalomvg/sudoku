# Sudoku Arcade 🕹️

Sitio web y juego de Sudoku estilo arcade retro desarrollado durante un workshop de AWS.

- **URL Original en AWS CloudFront:** [https://d2pjgvrh5olo6c.cloudfront.net/sudoku.html](https://d2pjgvrh5olo6c.cloudfront.net/sudoku.html)

---

## 🎮 Características

- **Estética retro / arcade:**
  - Efecto de líneas de escaneo CRT en tiempo real.
  - Paleta neón (verde fósforo, magenta, cian, amarillo).
  - Efecto de parpadeo (flicker) en tipografía y gráfico SVG de Torii.
- **Lógica de juego completa:**
  - Generador de Sudoku 9x9 con validación y algoritmo de backtracking.
  - Varios niveles de dificultad: *Very Easy*, *Easy*, *Medium*, *Hard*, *Expert*.
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
- **Autocontenido:**
  - Todo el HTML, CSS y JavaScript están integrados sin dependencias externas obligatorias.

---

## 🚀 Cómo ejecutar localmente

Puedes abrir directamente el archivo `index.html` o `sudoku.html` en cualquier navegador web, o iniciar un servidor web local:

### Con Python:
```bash
python3 -m http.server 8080
```
Luego abre en tu navegador: [http://localhost:8080](http://localhost:8080)

### Con Node.js (npx):
```bash
npx serve .
```
