# ONE SEG Web Lab — Beta

Browser-based experimental One-Seg transmitter for HackRF One. It runs locally in Chrome or Edge: video conversion, MPEG-TS preparation, ISDB-T modulation and WebUSB transmission remain on the user's computer.

The Beta includes a working CH 20 profile, colour bars with audio generated locally in the browser, and local MP4 preparation at 320×240 / 15 fps. Connect a HackRF, prepare a video or load bars, then choose **Transmit**. Loading or preparing content never starts RF.

## Run the Web Beta

Open the published beta directly in Chrome or Edge:

**[ONE SEG Web Lab](https://vanhoteen.github.io/ONE-SEG-Studio-WEB-/)**

The page is static, so it can run from GitHub Pages. Video conversion, signal generation and WebUSB communication remain on the computer that opens it.

## Run locally

Serve this folder with a local static server and open it at `http://localhost:8000` in Chrome or Edge. The included `serve.py` binds only to localhost.

GitHub Pages can host the interface because it is a static site. WebUSB still requires a compatible browser and a physical HackRF connected to the computer that opens the page.

## Continuous I/Q pipeline

Video transmission uses a bounded pipeline. The worker preserves ISDB-T modulator state and generates one I/Q frame at a time; a small FIFO keeps two or three frames ready while WebUSB transfers the previous data to HackRF. The complete 8 MS/s I/Q waveform is never stored in RAM. The current UI offers finite clips up to five minutes, rather than the previous 15-second waveform limit.

The input conversion stage is still FFmpeg WebAssembly's in-memory virtual filesystem. Source files are therefore limited to 256 MiB in this Beta. Removing that separate input-file limit requires a custom streaming FFmpeg/WebCodecs demux-and-encode implementation; it cannot be safely simulated by splitting arbitrary MP4 bytes.

## Safety and compliance

Use RF transmission only where it is authorised. This is an experimental laboratory project, not an ARIB-certified transmitter or receiver-compliance claim. The user must verify local spectrum rules, frequency and output settings.

## Credits and licences

The interface uses FFmpeg WebAssembly and incorporates GPL-3.0-or-later-derived ISDB-T and GNU Radio reference logic. The included `LICENSE` and `COPYING` retain the relevant notices. Preserve third-party notices and corresponding source when redistributing.
