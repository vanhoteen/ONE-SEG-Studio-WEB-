// A bounded producer of ISDB-T I/Q frames.  Unlike WaveformBuilder it never
// accumulates the complete CS8 waveform in memory.
import {LAYER_RATE} from './transport.js';

export class StreamingWaveform {
  constructor(layerA){
    if(!(layerA instanceof Uint8Array)||!layerA.length||layerA.length%188) throw Error('La capa A no es un TS válido.');
    // Keep the small transport stream so the user can start a second finite
    // test without re-encoding. I/Q frames live only in the bounded queue.
    this.layerA=layerA.slice();
    this.cancelled=false;
  }

  get seconds(){ return this.layerA.length*8/LAYER_RATE; }
  cancel(){ this.cancelled=true; }

  async *chunks(onProgress=()=>{}){
    this.cancelled=false;
    const response=await fetch(new URL('./demo/layer-b.ts',import.meta.url));
    if(!response.ok) throw Error('No se pudo cargar la capa B de referencia.');
    const layerB=new Uint8Array(await response.arrayBuffer());
    const worker=new Worker(new URL('./stream-modulator-worker.js',import.meta.url),{type:'module'});
    const queue=[];
    let done=false,error=null,wake=null;
    const notify=()=>{const callback=wake;wake=null;callback?.();};
    worker.onmessage=({data})=>{
      if(data.type==='chunk'){
        queue.push(new Uint8Array(data.buffer,0,data.length));
        notify();
      } else if(data.type==='progress') onProgress(data.value,data.frame,data.frames);
      else if(data.type==='done'){done=true;notify();}
      else if(data.type==='error'){error=Error(data.message);done=true;notify();}
    };
    worker.onerror=event=>{error=Error(event.message||'El modulador continuo no pudo terminar.');done=true;notify();};
    // Transfer copies into the worker. The original layerA stays available for
    // a later retry, while only two to three CS8 frames are ever queued.
    worker.postMessage({type:'start',a:this.layerA.slice().buffer,b:layerB.buffer},[layerB.buffer]);
    try {
      while(true){
        if(this.cancelled) throw Error('Transmisión detenida.');
        if(queue.length){
          const frame=queue.shift();
          worker.postMessage({type:'continue'});
          yield frame;
          continue;
        }
        if(error) throw error;
        if(done) break;
        await new Promise(resolve=>{wake=resolve;});
      }
    } finally {
      worker.postMessage({type:'cancel'});
      worker.terminate();
    }
  }
}
