import {modulate} from './modulator.js';

let cancelled=false;
let credits=2;
let resumeCredit=null;

function giveCredit(){
  credits++;
  const resume=resumeCredit;
  resumeCredit=null;
  resume?.();
}

async function waitForCredit(){
  while(!cancelled&&credits<=0){
    await new Promise(resolve=>{resumeCredit=resolve;});
  }
}

async function stream(layerA,layerB){
  try {
    for(const {iq,progress,frame,frames} of modulate(layerA,layerB)){
      if(cancelled) break;
      const bytes=new Uint8Array(iq.buffer,iq.byteOffset,iq.byteLength);
      self.postMessage({type:'chunk',buffer:bytes.buffer,length:bytes.byteLength,frame,frames},[bytes.buffer]);
      self.postMessage({type:'progress',value:progress,frame,frames});
      credits--;
      await waitForCredit();
    }
    self.postMessage({type:'done'});
  } catch(error) {
    self.postMessage({type:'error',message:error?.message||String(error)});
  }
}

self.onmessage=({data})=>{
  if(data.type==='start'){
    cancelled=false;
    credits=2;
    stream(new Uint8Array(data.a),new Uint8Array(data.b));
  } else if(data.type==='continue') {
    giveCredit();
  } else if(data.type==='cancel') {
    cancelled=true;
    giveCredit();
  }
};
