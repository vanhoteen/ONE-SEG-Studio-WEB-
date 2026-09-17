import {taps} from './resampler-taps.js';
// Stateful causal polyphase FIR. Same phase/taps as GNU Radio's 63/64 resampler.
export class Resampler {
 constructor(){this.history=new Float32Array(68);this.position=0;this.inputCount=0;this.next=33;this.phase=0;}
 process(input){
  if(input.length%2)throw Error('Muestra compleja incompleta.');
  const out=new Float32Array(Math.ceil(input.length/2*63/64+1)*2);let count=0;
  for(let i=0;i<input.length;i+=2){
   this.history[this.position*2]=input[i];this.history[this.position*2+1]=input[i+1];
   if(this.inputCount===this.next){
    let re=0,im=0;
    for(let k=0;k<34;k++){
     const at=((this.position-k+34)%34)*2,t=taps[this.phase+k*63];
     re+=this.history[at]*t;im+=this.history[at+1]*t;
    }
    out[count++]=re;out[count++]=im;
    this.phase+=64;this.next+=Math.floor(this.phase/63);this.phase%=63;
   }
   this.inputCount++;this.position=(this.position+1)%34;
  }
  return out.slice(0,count);
 }
}
export function toCS8(input){
 const out=new Int8Array(input.length);
 for(let i=0;i<input.length;i++){
  const v=Math.fround(input[i]*127),floor=Math.floor(v),fraction=v-floor;
  const rounded=fraction===0.5?(floor%2===0?floor:floor+1):Math.round(v);
  out[i]=Math.max(-128,Math.min(127,rounded));
 }
 return out;
}
