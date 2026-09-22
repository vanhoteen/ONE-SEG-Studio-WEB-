// Independent WebUSB adapter based on the public libhackrf vendor protocol.
export const RATE = 8_000_000;
export function words(a,b) { const v=new DataView(new ArrayBuffer(8)); v.setUint32(0,a,true);v.setUint32(4,b,true);return v.buffer; }
export function validate(bytes,frequency,gain) {
  if (!(bytes instanceof Uint8Array) || bytes.length===0 || bytes.length%2) throw Error('Archivo I/Q vacío o con un número impar de bytes.');
  if (!Number.isFinite(frequency)||frequency<1e6||frequency>6e9) throw Error('Frecuencia fuera de rango.');
  if (!Number.isInteger(gain)||gain<0||gain>47) throw Error('Ganancia fuera de rango.');
}
export class HackRF {
  constructor(device) { this.device=device;this.active=false;this.busy=false;this.sent=0; }
  async out(request,value=0,index=0,data=new Uint8Array()) {
    const r=await this.device.controlTransferOut({requestType:'vendor',recipient:'device',request,value,index},data);
    if(r.status!=='ok'||r.bytesWritten!==data.byteLength) throw Error(`Control USB ${request}: ${r.status}`);
  }
  async input(request,index=0,length=1) {
    const r=await this.device.controlTransferIn({requestType:'vendor',recipient:'device',request,value:0,index},length);
    if(r.status!=='ok'||!r.data||r.data.byteLength<1) throw Error(`Lectura USB ${request}: ${r.status}`);
    return r.data;
  }
  async open() {
    try {
      await this.device.open();
      if(!this.device.configuration) await this.device.selectConfiguration(1);
      const iface=this.device.configuration.interfaces.find(i=>i.alternates.some(a=>a.endpoints.some(e=>e.direction==='out'&&e.type==='bulk'&&e.endpointNumber===2)));
      if(!iface) throw Error('No hay endpoint de transmisión HackRF compatible.');
      this.iface=iface.interfaceNumber;
      await this.device.claimInterface(this.iface);
      const alt=iface.alternates.find(a=>a.endpoints.some(e=>e.direction==='out'&&e.endpointNumber===2));
      if(iface.alternate.alternateSetting!==alt.alternateSetting) await this.device.selectAlternateInterface(this.iface,alt.alternateSetting);
      await this.out(1,0); // Opening a device never enables TX.
      const version=await this.input(15,0,255);
      return new TextDecoder().decode(version).replaceAll('\0','');
    } catch(error) { if(this.device.opened) await this.device.close().catch(()=>{});throw error; }
  }
  async stop() { this.active=false; if(this.device.opened) await this.out(1,0); }
  async close() { await this.stop(); if(this.device.opened) await this.device.close(); }
  async transmit(bytes,frequency,gain,amp,onProgress=()=>{}) {
    validate(bytes,frequency,gain);
    return this.transmitStream((async function*(){yield bytes;})(),frequency,gain,amp,onProgress,bytes.length);
  }
  async transmitStream(source,frequency,gain,amp,onProgress=()=>{},totalBytes=null) {
    if(!source||typeof source[Symbol.asyncIterator]!=='function') throw Error('Fuente continua I/Q no válida.');
    if(!Number.isFinite(frequency)||frequency<1e6||frequency>6e9) throw Error('Frecuencia fuera de rango.');
    if(!Number.isInteger(gain)||gain<0||gain>47) throw Error('Ganancia fuera de rango.');
    if(this.busy) throw Error('Ya hay una operación de transmisión.');
    this.busy=true;this.active=true;this.sent=0;
    const iterator=source[Symbol.asyncIterator]();
    let current=null,offset=0,sourceDone=false;
    const pending=new Set();
    try {
      await this.out(1,0);
      await this.out(6,0,0,words(RATE,1));
      await this.out(7,RATE&65535,RATE>>>16);
      const hz=Math.round(frequency);
      await this.out(16,0,0,words(Math.floor(hz/1e6),hz%1e6));
      await this.out(17,Number(amp));
      await this.out(23,0); // Antenna bias power off.
      const status=await this.input(21,gain,1);
      if(status.getUint8(0)!==1) throw Error('HackRF ha rechazado la ganancia TX.');
      if(!this.active) return;
      await this.out(1,2);
      if(!this.active) return;
      const nextChunk=async()=>{
        while(!current||offset>=current.length){
          const item=await iterator.next();
          if(item.done){sourceDone=true;return null;}
          if(!(item.value instanceof Uint8Array)||!item.value.length||item.value.length%2) throw Error('Bloque I/Q continuo inválido.');
          current=item.value;offset=0;
        }
        const end=Math.min(offset+262144,current.length);
        const chunk=current.subarray(offset,end);offset=end;
        return chunk;
      };
      const send=async()=>{
        const original=await nextChunk();
        if(!original) return false;
        let chunk=original;const useful=chunk.length;
        if(chunk.length%512) { const padded=new Uint8Array(Math.ceil(chunk.length/512)*512);padded.set(chunk);chunk=padded; }
        const p=this.device.transferOut(2,chunk).then(r=>{
          if(r.status!=='ok'||r.bytesWritten!==chunk.length) throw Error('Transferencia USB incompleta.');
          this.sent+=useful;onProgress(this.sent,totalBytes);
        });
        pending.add(p);p.then(()=>pending.delete(p),()=>{});return true;
      };
      while(this.active&&(!sourceDone||pending.size)) {
        while(this.active&&!sourceDone&&pending.size<4) await send();
        if(pending.size) {
          let timer;
          try { await Promise.race([Promise.race(pending),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('USB sin respuesta durante 3 segundos.')),3000);})]); }
          finally {clearTimeout(timer);}
        }
      }
    } finally {
      this.active=false;
      try { if(iterator.return) await iterator.return(); } catch {}
      try { await this.out(1,0); }
      finally {
        // Closing on stop/error cancels outstanding bulk transfers before reconnecting.
        if(pending.size) await this.device.close().catch(()=>{});
        await Promise.allSettled(pending);
        this.busy=false;
      }
    }
  }
}
