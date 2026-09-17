// ISDB-T outer coding. Energy dispersal / byte interleaving ported from
// gr-isdbt (Universidad de la Republica, 2015–2021), GPL-3.0-or-later.
// See ../../release/ONE-SEG-Studio/third_party/gr-isdbt for original notices.
const exp=new Uint8Array(512),log=new Uint8Array(256);
let field=1;
for(let i=0;i<255;i++){exp[i]=field;log[field]=i;field<<=1;if(field&256)field^=0x11d;}
for(let i=255;i<512;i++)exp[i]=exp[i-255];
const mul=(a,b)=>a&&b?exp[log[a]+log[b]]:0;
let generator=new Uint8Array([1]);
for(let i=0;i<16;i++){
 const next=new Uint8Array(generator.length+1);
 for(let j=0;j<generator.length;j++){next[j]^=generator[j];next[j+1]^=mul(generator[j],exp[i]);}
 generator=next;
}
export function reedSolomon(ts){
 if(!ts.length||ts.length%188)throw Error('RS necesita paquetes de 188 bytes.');
 const out=new Uint8Array(ts.length/188*204);
 for(let i=0;i<ts.length/188;i++){
  const data=ts.subarray(i*188,(i+1)*188),parity=new Uint8Array(16);
  for(const byte of data){
   const feedback=byte^parity[0];
   for(let j=0;j<15;j++)parity[j]=parity[j+1]^mul(feedback,generator[j+1]);
   parity[15]=mul(feedback,generator[16]);
  }
  out.set(data,i*204);out.set(parity,i*204+188);
 }
 return out;
}
export class EnergyDispersal {
 constructor(layer='A'){
  if(!['A','B'].includes(layer))throw Error('Capa no admitida.');
  this.period=layer==='A'?64:2592;this.count=0;this.register=0xa9;
 }
 clock(){let value=0;for(let i=0;i<8;i++){
  const feedback=((this.register>>13)^(this.register>>14))&1;
  this.register=((this.register<<1)|feedback)&0x7fff;value=(value<<1)|feedback;
 }return value;}
 process(rs){
  if(rs.length%204)throw Error('Dispersión necesita paquetes de 204 bytes.');
  const out=new Uint8Array(rs.length);
  for(let i=0;i<rs.length;i+=204){
   if(this.count%this.period===0){this.register=0xa9;this.count=0;}
   for(let j=0;j<203;j++)out[i+j]=rs[i+j+1]^this.clock();
   out[i+203]=rs[i];this.clock();this.count++;
  }
  return out;
 }
}
class Delay {
 constructor(length){this.buffer=new Uint8Array(length);this.position=0;}
 push(value){
  if(!this.buffer.length)return value;
  const old=this.buffer[this.position];this.buffer[this.position]=value;
  this.position=(this.position+1)%this.buffer.length;return old;
 }
}
export class ByteInterleaver {
 constructor(layer='A'){
  if(!['A','B'].includes(layer))throw Error('Capa no admitida.');
  this.extra=new Delay((layer==='A'?53:2581)*204);
  this.branches=Array.from({length:12},(_,i)=>new Delay(17*i));this.position=0;
 }
 process(bytes){
  const out=new Uint8Array(bytes.length);
  for(let i=0;i<bytes.length;i++){
   out[i]=this.branches[this.position].push(this.extra.push(bytes[i]));this.position=(this.position+1)%12;
  }
  return out;
 }
}
// Convolutional/puncturing ordering follows GNU Radio 3.10.12 dvbt_inner_coder,
// Copyright FSF 2015,2016,2019, GPL-3.0-or-later.
// https://github.com/gnuradio/gnuradio/blob/v3.10.12.0/gr-dtv/lib/dvbt/dvbt_inner_coder_impl.cc
const parity=n=>{n^=n>>4;n^=n>>2;n^=n>>1;return n&1;};
export class InnerCoder {
 constructor(layer='A'){
  if(!['A','B'].includes(layer))throw Error('Capa no admitida.');
  this.bits=layer==='A'?2:6;this.period=layer==='A'?2:3;
  this.register=0;this.phase=0;this.word=0;this.used=0;
 }
 process(bytes){
  const out=[];
  const emit=bit=>{this.word=(this.word<<1)|bit;if(++this.used===this.bits){out.push(this.word);this.word=0;this.used=0;}};
  for(const byte of bytes)for(let shift=7;shift>=0;shift--){
   this.register=(this.register>>1)|(((byte>>shift)&1)<<6);
   const x=parity(this.register&0o171),y=parity(this.register&0o133);
   if(this.phase===0){emit(x);emit(y);}else if(this.phase===1)emit(y);else emit(x);
   this.phase=(this.phase+1)%this.period;
  }
  return new Uint8Array(out);
 }
}
