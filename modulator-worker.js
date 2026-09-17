import {modulate} from './modulator.js';
self.onmessage=({data})=>{
 try {
  const frames=Math.ceil(data.a.length/(64*188))+4;
  const storage=new Uint8Array(frames*204*8568*2);let length=0;
  for(const {iq,progress} of modulate(data.a,data.b)){
   storage.set(new Uint8Array(iq.buffer,iq.byteOffset,iq.byteLength),length);length+=iq.byteLength;
   self.postMessage({type:'progress',value:progress});
  }
  self.postMessage({type:'done',buffer:storage.buffer,length},[storage.buffer]);
 }catch(error){self.postMessage({type:'error',message:error.message});}
};
