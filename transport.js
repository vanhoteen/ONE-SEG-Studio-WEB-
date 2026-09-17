// Browser port of the desktop correct_transport.py. No USB or RF operations.
import {referenceTables} from './transport-tables.js';
export const LAYER_RATE = 440563.1533659215;
const pid = b => ((b[1]&31)<<8)|b[2];
const requireThat = (condition,message) => {if(!condition)throw Error(message);};
export function correctTransport(raw) {
  requireThat(raw.length>0 && raw.length%188===0,'TS incompleto: longitud de paquete incorrecta.');
  const packets=[];
  for(let i=0;i<raw.length;i+=188){
    const b=raw.slice(i,i+188);
    requireThat(b[0]===0x47 && !(b[1]&0x80),'TS dañado o sin sincronización.');
    packets.push(b);
  }
  const audio=[],locations=[];
  for(let i=0;i<packets.length;i++){
    const b=packets[i];
    if(pid(b)!==257 || !(b[3]&16))continue;
    let off=4+(b[3]&32?1+b[4]:0);
    if(b[1]&64){
      requireThat(b[off]===0 && b[off+1]===0 && b[off+2]===1,'Cabecera PES de audio inválida.');
      off+=9+b[off+8];
    }
    requireThat(off<=188,'Cabecera de audio fuera del paquete.');
    for(let j=off;j<188;j++){audio.push(b[j]);locations.push([i,j]);}
  }
  let frames=0;
  for(let j=0;j<audio.length;){
    requireThat(audio[j]===255 && (audio[j+1]&0xf6)===0xf0,'Audio AAC ADTS inválido.');
    const length=((audio[j+3]&3)<<11)|(audio[j+4]<<3)|(audio[j+5]>>5);
    requireThat(length>=7 && j+length<=audio.length,'Trama AAC incompleta.');
    const [i,k]=locations[j+1];packets[i][k]|=8;
    j+=length;frames++;
  }
  let origin=null;
  for(let i=0;i<packets.length;i++){
    const b=packets[i];
    if((b[3]&32) && b[4]>=7 && (b[5]&16)){
      const q=b.subarray(6,12);
      const base=q[0]*33554432+q[1]*131072+q[2]*512+q[3]*2+(q[4]>>7);
      const value=base*300+((q[4]&1)<<8)+q[5];
      if(origin===null)origin=value-(i*188+11)*8*27000000/440563;
      b[5]&=0xef;b.fill(255,6,12);
    }
  }
  requireThat(origin!==null,'El TS no contiene reloj PCR.');
  function table(p,section){
    requireThat(section.length<=183,'Tabla demasiado larga.');
    const b=new Uint8Array(188).fill(255);
    b.set([0x47,0x40|(p>>8),p&255,0x10,0]);b.set(section,5);return b;
  }
  function pcrPacket(i){
    const value=Math.round(origin+(i*188+11)*8*27000000/LAYER_RATE);
    const base=Math.floor(value/300),ext=value%300;
    const b=new Uint8Array(188).fill(255);
    b.set([0x47,1,0,0x20,183,0x10,
      Math.floor(base/33554432)&255,Math.floor(base/131072)&255,
      Math.floor(base/512)&255,Math.floor(base/2)&255,
      ((base%2)<<7)|0x7e|(ext>>8),ext&255]);return b;
  }
  const nullPacket=new Uint8Array(188).fill(255);nullPacket.set([0x47,31,255,16]);
  const queue=[],result=[],cc=new Map();let head=0,maxQueue=0,lastNit=-1000;
  for(let i=0;i<packets.length+4096;i++){
    if(i<packets.length){
      let b=packets[i],p=pid(b);
      if(p===4096)b=table(8136,referenceTables.pmt);
      else if(p===17)b=table(17,referenceTables.sdt);
      else if(p===0 || p===8191)b=null;
      if(b)queue.push(b);
    }
    let b;
    if(i%16===0)b=pcrPacket(i);
    else if(i-lastNit>=100 && (head===queue.length || (i<packets.length && [0,8191].includes(pid(packets[i]))))){
      b=table(16,referenceTables.nit);lastNit=i;
    }else if(head<queue.length)b=queue[head++];
    else b=nullPacket.slice();
    const p=pid(b);
    if(p!==8191){
      const counter=((cc.get(p)||0)+(b[3]&16?1:0))%16;cc.set(p,counter);b[3]=(b[3]&0xf0)|counter;
    }
    result.push(b);maxQueue=Math.max(maxQueue,queue.length-head);
    if(i>=packets.length-1 && head===queue.length && (i+1)%64===0)break;
  }
  requireThat(head===queue.length,'El vídeo supera la capacidad de transporte de la capa A.');
  const ts=new Uint8Array(result.length*188);result.forEach((b,i)=>ts.set(b,i*188));
  return {ts,report:{aacFrames:frames,packets:result.length,maxQueue,rate:LAYER_RATE,pcrEvery:16}};
}
