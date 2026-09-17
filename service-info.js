// Port of desktop build_si_trial.py, retaining its experimental SI profile.
import {siTemplates} from './transport-tables.js';
import {LAYER_RATE} from './transport.js';
export function crc32mpeg(bytes){
 let c=0xffffffff;
 for(const b of bytes){c^=b<<24;for(let i=0;i<8;i++)c=((c<<1)^((c&0x80000000)?0x04c11db7:0))>>>0;}
 return c;
}
function seal(section){
 const c=crc32mpeg(section.subarray(0,-4));new DataView(section.buffer,section.byteOffset,section.byteLength).setUint32(section.length-4,c);return section;
}
function japanTime(milliseconds){
 const d=new Date(milliseconds+9*3600000),bcd=n=>Math.floor(n/10)*16+n%10;
 const mjd=Math.floor(d.getTime()/86400000)+40587;
 return [mjd>>8,mjd&255,bcd(d.getUTCHours()),bcd(d.getUTCMinutes()),bcd(d.getUTCSeconds())];
}
export function addServiceInfo(raw,start=new Date()){
 if(raw.length%188)throw Error('TS incompleto.');
 const origin=Math.floor(start.getTime()/1000)*1000;
 if(!Number.isFinite(origin))throw Error('Fecha de señalización inválida.');
 const result=raw.slice(),cc=new Map(),inserted={},positions={};
 function packet(pid,section){
  if(section[0]!==0x70 && crc32mpeg(section)!==0)throw Error('CRC de señalización inválido.');
  const b=new Uint8Array(188).fill(255),counter=cc.get(pid)||0;
  b.set([0x47,0x40|(pid>>8),pid&255,0x10|counter,0]);b.set(section,5);cc.set(pid,(counter+1)%16);return b;
 }
 const eit=new Uint8Array(siTemplates.eit);eit.set(japanTime(origin-9*3600000),16);seal(eit);
 let nextClock=0,nextEit=0;const pending=[];
 for(let i=0;i<raw.length/188;i++){
  const offset=i*188,b=raw.subarray(offset,offset+188),pid=((b[1]&31)<<8)|b[2],t=i*1504/LAYER_RATE;
  if(pid===17){const s=packet(17,new Uint8Array(siTemplates.sdt));s[3]=b[3];result.set(s,offset);}
  if(pid!==8191)continue;
  if(!pending.length){
   if(t>=nextClock){
    const time=japanTime(origin+Math.floor(t)*1000);
    pending.push([20,new Uint8Array([0x70,0x70,5,...time])],[20,seal(new Uint8Array([0x73,0x70,11,...time,0xf0,0,0,0,0,0]))]);nextClock=t+5;
   }else if(t>=nextEit){pending.push([18,eit]);nextEit=t+1;}
  }
  if(pending.length){
   const [p,s]=pending.shift();result.set(packet(p,s),offset);
   const key='0x'+s[0].toString(16);inserted[key]=(inserted[key]||0)+1;(positions[key]??=[]).push(t);
  }
 }
 if(pending.length)throw Error('No hay espacio al final para completar la señalización.');
 return {ts:result,report:{createdUTC:new Date(origin).toISOString(),inserted,
  maxIntervals:Object.fromEntries(Object.entries(positions).map(([k,v])=>[k,Math.max(0,...v.slice(1).map((t,i)=>t-v[i]))])),
  profile:'Perfil experimental idéntico a la aplicación; PAT en capa B, CH 20.'}};
}
