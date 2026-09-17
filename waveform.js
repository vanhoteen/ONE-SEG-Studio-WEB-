export class WaveformBuilder {
 constructor(){this.worker=null;this.reject=null;this.controller=null;}
 cancel(){this.controller?.abort();this.worker?.terminate();this.worker=null;this.reject?.(Error('Preparación cancelada.'));this.reject=null;}
 async build(a,onProgress){
  this.controller=new AbortController();
  const response=await fetch(new URL('./demo/layer-b.ts',import.meta.url),{signal:this.controller.signal});
  if(!response.ok)throw Error('No se pudo cargar la capa B de referencia.');
  const b=new Uint8Array(await response.arrayBuffer());
  this.controller=null;
  return new Promise((resolve,reject)=>{
   const worker=this.worker=new Worker(new URL('./modulator-worker.js',import.meta.url),{type:'module'});
   this.reject=reject;
   const finish=()=>{worker.terminate();if(this.worker===worker){this.worker=null;this.reject=null;}};
   worker.onmessage=({data})=>{
    if(data.type==='progress')onProgress(data.value);
    else if(data.type==='done'){finish();resolve(new Uint8Array(data.buffer,0,data.length));}
    else if(data.type==='error'){finish();reject(Error(data.message));}
   };
   worker.onerror=e=>{finish();reject(Error(e.message||'El modulador no pudo terminar.'));};
   worker.postMessage({a,b},[b.buffer]);
  });
 }
}
