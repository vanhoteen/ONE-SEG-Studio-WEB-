// Port of gr-isdbt pilot_signals / tmcc_encoder, Universidad de la Republica
// 2015–2021, GPL-3.0-or-later. Full attribution in the reference source tree.
import {tmccPositions,acPositions} from './pilot-tables.js';
const left=1288,segments=[11,9,7,5,3,1,0,2,4,6,8,10,12];
export class Pilots {
 constructor(){
  this.symbol=0;this.values=new Float32Array(5617);let register=2047;
  for(let i=0;i<5617;i++){const bit=register&1;register=(register>>1)|((((register>>2)^register)&1)<<10);this.values[i]=(bit?-4:4)/3;}
  const reserved=new Set([...tmccPositions,...acPositions]);
  this.maps=Array.from({length:4},(_,phase)=>{
   const map=new Uint16Array(4992);let count=0;
   for(let c=0;c<5616;c++)if(c%12!==phase*3&&!reserved.has(c)){
    map[segments[Math.floor(count/384)]*384+count%384]=left+c;count++;
   }
   if(count!==4992)throw Error('Mapa de pilotos incorrecto.');return map;
  });
 }
 process(input){
  if(input.length%9984)throw Error('Símbolo incompleto.');
  const out=new Float32Array(input.length/9984*16384);
  for(let s=0;s<input.length/9984;s++){
   const base=s*16384,map=this.maps[this.symbol];
   for(let c=0;c<4992;c++){out[base+map[c]*2]=input[s*9984+c*2];out[base+map[c]*2+1]=input[s*9984+c*2+1];}
   for(let c=this.symbol*3;c<5616;c+=12)out[base+(left+c)*2]=this.values[c];
   for(const c of [...tmccPositions,...acPositions,5616])out[base+(left+c)*2]=this.values[c];
   this.symbol=(this.symbol+1)%4;
  }
  return out;
 }
}
export class TMCC {
 constructor(){
  this.word=new Uint8Array(204);this.symbol=0;this.last=1;
  // Native sync is 0b0111011110101100 (0x77ac), complemented before first frame.
  this.sync=0x77ac^0xffff;
  const set=(pos,value,bits)=>{for(let i=0;i<bits;i++)this.word[pos+i]=(value>>i)&1;};
  set(0,1,1);set(17,7,3);set(22,15,4);set(27,1,1);
  for(const offset of [0,40]){
   set(28+offset,4,3);set(31+offset,4,3);set(34+offset,6,3);set(37+offset,8,4);
   set(41+offset,6,3);set(44+offset,2,3);set(47+offset,2,3);set(50+offset,3,4);
   set(54+offset,0x1fff,13);
  }
  set(107,7,3);set(110,4095,12);
  let polynomial=0n,remainder=0n;
  for(const power of [82,77,76,71,67,66,56,52,48,40,36,34,24,22,18,10,4,0])polynomial|=1n<<BigInt(power);
  for(let i=20;i<122;i++)remainder=(remainder<<1n)|BigInt(this.word[i]);
  remainder<<=82n;
  for(let degree=183;degree>=82;degree--)if(remainder&(1n<<BigInt(degree)))remainder^=polynomial<<BigInt(degree-82);
  for(let i=0;i<82;i++)this.word[122+i]=Number((remainder>>BigInt(81-i))&1n);
 }
 process(input){
  if(input.length%16384)throw Error('Símbolo FFT incompleto.');
  const out=input.slice();
  for(let base=0;base<input.length;base+=16384){
   if(this.symbol===0){this.sync^=0xffff;for(let b=0;b<16;b++)this.word[b+1]=(this.sync>>b)&1;this.last=this.word[0];}
   else this.last^=this.word[this.symbol];
   const sign=this.last?1:-1;
   for(const c of tmccPositions){const i=base+(left+c)*2;out[i]=input[i]*sign-input[i+1]*0;out[i+1]=input[i]*0+input[i+1]*sign;}
   this.symbol=(this.symbol+1)%204;
  }
  return out;
 }
}
