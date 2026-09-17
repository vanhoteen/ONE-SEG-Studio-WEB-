// Adapted from gr-isdbt hierarchical_combinator, time_interleaver and
// frequency_interleaver. Universidad de la Republica, 2015–2021.
// GPL-3.0-or-later. Original notices: ../../release/ONE-SEG-Studio/third_party/gr-isdbt.
import {permutation} from './frequency-permutation.js';
export function combineLayers(a,b){
 if(a.length%768 || b.length%9216 || a.length/768!==b.length/9216)throw Error('Las capas deben contener el mismo número de símbolos OFDM.');
 const out=new Float32Array(a.length+b.length);
 for(let i=0;i<a.length/768;i++){out.set(a.subarray(i*768,(i+1)*768),i*9984);out.set(b.subarray(i*9216,(i+1)*9216),i*9984+768);}
 return out;
}
export class TimeInterleaver {
 constructor(){
  this.positions=new Uint16Array(4992);
  this.buffers=Array.from({length:4992},(_,carrier)=>{
   const depth=carrier<384?4:2,delay=depth*((5*(carrier%384))%96)+204-(95*depth)%204;
   return new Float32Array(delay*2);
  });
 }
 process(input){
  if(input.length%9984)throw Error('Símbolo OFDM incompleto.');
  const out=new Float32Array(input.length);
  for(let base=0;base<input.length;base+=9984)for(let c=0;c<4992;c++){
   const buffer=this.buffers[c],p=this.positions[c],i=base+c*2;
   out[i]=buffer[p];out[i+1]=buffer[p+1];buffer[p]=input[i];buffer[p+1]=input[i+1];
   this.positions[c]=(p+2)%buffer.length;
  }
  return out;
 }
}
const mapping=new Uint16Array(4992);
for(let segment=0;segment<13;segment++)for(let carrier=0;carrier<384;carrier++){
 const source=segment===0?carrier:384+carrier*12+segment-1;
 const rotated=(carrier+384-segment)%384;
 mapping[segment*384+permutation[rotated]]=source;
}
export function frequencyInterleave(input){
 if(input.length%9984)throw Error('Símbolo OFDM incompleto.');
 const out=new Float32Array(input.length);
 for(let base=0;base<input.length;base+=9984)for(let c=0;c<4992;c++){
  const source=base+mapping[c]*2;out[base+c*2]=input[source];out[base+c*2+1]=input[source+1];
 }
 return out;
}
