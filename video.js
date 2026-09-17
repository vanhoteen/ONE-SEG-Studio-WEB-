import {FFmpeg} from './vendor/ffmpeg/index.js';
import {encodingArgs} from './video-profile.js';
import {correctTransport} from './transport.js';
import {addServiceInfo} from './service-info.js';
export class VideoConverter {
  constructor(){this.engine=null;this.busy=false;this.epoch=0;}
  cancel(){this.epoch++;this.engine?.terminate();this.engine=null;}
  async convert(file,settings,onLog,onProgress){
    if(this.busy)throw Error('Ya hay una conversión en curso.');
    if(!file||file.size===0||file.size>256*1024*1024)throw Error('Selecciona un vídeo de hasta 256 MB para esta prueba.');
    this.busy=true;const epoch=this.epoch;
    const check=()=>{if(this.epoch!==epoch)throw Error('Conversión cancelada.');};
    let engine;
    try {
      engine=this.engine=new FFmpeg();
      engine.on('log',({message})=>onLog(message));
      engine.on('progress',({time})=>onProgress(Math.min(.99,Math.max(0,time/1e6/settings.duration))));
      const base=new URL('./vendor/core/',import.meta.url);
      onLog('Cargando FFmpeg WebAssembly local (~31 MB)…');
      await engine.load({coreURL:new URL('ffmpeg-core.js',base).href,wasmURL:new URL('ffmpeg-core.wasm',base).href});check();
      onLog('Leyendo el archivo local. No se sube a ningún servidor.');
      const input=new Uint8Array(await file.arrayBuffer());check();
      await engine.writeFile('input',input);check();
      // Probe one audio frame with FFmpeg itself. The distributed core's ffprobe entry
      // point aborts in this build, so do not depend on the wrapper exposing it.
      const audio=await engine.exec(['-i','input','-t','0.05','-map','0:a:0','-f','null','-'],30000)===0;check();
      if(!audio)onLog('Sin pista de audio: se añadirá silencio.');
      if(await engine.exec(encodingArgs({...settings,audio}),180000)!==0)throw Error('La codificación falló o superó tres minutos. Consulta el registro.');check();
      const ts=await engine.readFile('base.ts');check();
      onLog('Creando vista previa…');
      if(await engine.exec(['-i','base.ts','-c','copy','-movflags','+faststart','preview.mp4'],30000)!==0)throw Error('No se pudo crear la vista previa.');check();
      const preview=await engine.readFile('preview.mp4');check();
      if(!ts.length||!preview.length)throw Error('La conversión produjo un archivo vacío.');
      onLog('Preparando capa A con el transporte y las tablas de la aplicación (CH 20)…');
      const corrected=correctTransport(ts),layer=addServiceInfo(corrected.ts);check();
      onLog(JSON.stringify({transport:corrected.report,serviceInfo:layer.report},null,2));
      onLog('TS base, vista previa y capa A preparados. Continuando con la modulación I/Q.');
      onProgress(1);
      return {ts,preview,layerA:layer.ts};
    }finally{engine?.terminate();if(this.engine===engine)this.engine=null;this.busy=false;}
  }
}
