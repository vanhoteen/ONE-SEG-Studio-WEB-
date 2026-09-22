# ONE SEG Web Lab — Beta

[🇬🇧 English](README.md) · [🇪🇸 Castellano](README.es.md)

Transmisor One-Seg experimental para navegador y HackRF One. Funciona localmente en Chrome o Edge: la conversión del vídeo, la preparación MPEG-TS, la modulación ISDB-T y la transmisión mediante WebUSB permanecen en el ordenador del usuario.

La beta incluye un perfil funcional para CH 20, barras de color con audio generadas en el navegador y preparación local de MP4 a 320 × 240 / 15 fps. Conecta un HackRF, prepara un vídeo o carga las barras y pulsa **Emitir**. Cargar o preparar contenido nunca activa la radio.

## Abrir la beta web

Abre la beta publicada directamente con Chrome o Edge:

**[ONE SEG Web Lab](https://vanhoteen.github.io/ONE-SEG-Studio-WEB-/)**

La página es estática y puede ejecutarse desde GitHub Pages. La conversión de vídeo, la generación de señal y la comunicación WebUSB siguen en el ordenador que abre la página.

## Ejecutar en local

Sirve esta carpeta con un servidor estático local y ábrela en `http://localhost:8000` con Chrome o Edge. El archivo `serve.py` incluido solo escucha en localhost.

GitHub Pages aloja la interfaz porque es un sitio estático. WebUSB sigue necesitando un navegador compatible y un HackRF físico conectado al ordenador que abre la página.

## Aplicaciones nativas para vídeos más largos

Para pruebas de vídeo preparado más largas que el límite de **15 segundos** de esta beta, utiliza las ediciones nativas:

- **[ONE SEG Studio para macOS](https://github.com/vanhoteen/ONE-SEG-Studio-)** — aplicación para Apple Silicon con su entorno incluido.
- **[ONE SEG Studio para Linux — Vista previa Ubuntu 26.04 amd64](https://github.com/vanhoteen/ONE-SEG-Studio-for-Linux---Ubuntu-26.04-amd64-Preview)** — beta experimental para Linux probada por el autor.

## Límites actuales

La beta acepta vídeos de origen de hasta 256 MiB y crea clips finitos de 5, 10 o 15 segundos. Es intencionado: la forma de onda I/Q final necesita unos 16 MiB por segundo a 8 MS/s y el navegador mantiene la forma de onda completa antes de transmitir. No es un límite del tamaño de vídeo de One-Seg.

La transmisión de larga duración necesitará un futuro diseño de flujo continuo: convertir, modular y transferir pequeños búferes en secuencia, en vez de mantener toda la señal I/Q en memoria.

## Seguridad y cumplimiento

Emite solo donde esté autorizado. Es un proyecto experimental de laboratorio, no una certificación ARIB de transmisor ni una afirmación de compatibilidad de receptor. El usuario debe comprobar las normas locales de espectro, frecuencia y potencia de salida.

## Créditos y licencias

La interfaz utiliza FFmpeg WebAssembly e incorpora lógica de referencia ISDB-T y GNU Radio derivada de GPL-3.0-or-later. Los archivos `LICENSE` y `COPYING` incluidos conservan los avisos correspondientes. Conserva los avisos de terceros y el código fuente correspondiente al redistribuir.
