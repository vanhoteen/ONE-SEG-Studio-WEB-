// Port of gr-isdbt carrier_modulation_impl (GPL-3.0-or-later).
// Original authors and license: ../../release/ONE-SEG-Studio/third_party/gr-isdbt.
export class CarrierModulation {
 constructor(layer='A'){
  if(!['A','B'].includes(layer))throw Error('Capa no admitida.');
  this.bits=layer==='A'?2:6;
  const extra=layer==='A'?(1536-240)/2:(4608*12-720)/6;
  this.delays=(layer==='A'?[120,0]:[120,96,72,48,24,0]).map(n=>n+extra);
  this.history=new Uint8Array(this.delays[0]+1);this.position=0;
  const norm=Math.fround(Math.sqrt(layer==='A'?2:42));
  this.symbols=new Float32Array((1<<this.bits)*2);
  for(let i=0;i<(1<<this.bits);i++){
   const levels=[7,5,1,3];
   const real=layer==='A'?1:levels[((i>>2)&2)|((i>>1)&1)];
   const imag=layer==='A'?1:levels[((i>>1)&2)|(i&1)];
   this.symbols[2*i]=Math.fround(real*norm)*(i&(layer==='A'?2:32)?-1:1)/Math.fround(norm*norm);
   this.symbols[2*i+1]=Math.fround(imag*norm)*(i&(layer==='A'?1:16)?-1:1)/Math.fround(norm*norm);
  }
 }
 process(words){
  const out=new Float32Array(words.length*2),length=this.history.length;
  for(let i=0;i<words.length;i++){
   this.history[this.position]=words[i];let symbol=0;
   for(let b=0;b<this.bits;b++)symbol|=this.history[(this.position-this.delays[b]+length)%length]&(1<<b);
   out[2*i]=this.symbols[2*symbol];out[2*i+1]=this.symbols[2*symbol+1];this.position=(this.position+1)%length;
  }
  return out;
 }
}
