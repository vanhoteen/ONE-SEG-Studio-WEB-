# ONE SEG Web Lab — Beta

Browser-based experimental One-Seg transmitter for HackRF One. It runs locally in Chrome or Edge: video conversion, MPEG-TS preparation, ISDB-T modulation and WebUSB transmission remain on the user's computer.

The Beta includes a working CH 20 profile, colour bars with audio generated locally in the browser, and local MP4 preparation at 320×240 / 15 fps. Connect a HackRF, prepare a video or load bars, then choose **Transmit**. Loading or preparing content never starts RF.

## Run locally

Serve this folder with a local static server and open it at `http://localhost:8000` in Chrome or Edge. The included `serve.py` binds only to localhost.

GitHub Pages can host the interface because it is a static site. WebUSB still requires a compatible browser and a physical HackRF connected to the computer that opens the page.

## Current limits

The Beta accepts source video up to 256 MiB and makes finite clips of 5, 10 or 15 seconds. This is deliberate: the final I/Q waveform needs roughly 16 MiB per second at 8 MS/s, and the browser currently holds the complete finite waveform before transmission. It is not a video-size limitation of One-Seg itself.

Long-form transmission will use a future streaming design: convert, modulate and transfer small buffers in sequence, instead of keeping the entire I/Q signal in memory.

## Safety and compliance

Use RF transmission only where it is authorised. This is an experimental laboratory project, not an ARIB-certified transmitter or receiver-compliance claim. The user must verify local spectrum rules, frequency and output settings.

## Credits and licences

The interface uses FFmpeg WebAssembly and incorporates GPL-3.0-or-later-derived ISDB-T and GNU Radio reference logic. The included `LICENSE` and `COPYING` retain the relevant notices. Preserve third-party notices and corresponding source when redistributing.
