import {reedSolomon,EnergyDispersal,ByteInterleaver,InnerCoder} from './fec.js';
import {CarrierModulation} from './constellation.js';
import {combineLayers,TimeInterleaver,frequencyInterleave} from './interleaving.js';
import {Pilots,TMCC} from './pilots.js';
import {ofdm} from './ofdm.js';
import {Resampler,toCS8} from './resampler.js';
class Layer {
 constructor(name){this.energy=new EnergyDispersal(name);this.bytes=new ByteInterleaver(name);this.inner=new InnerCoder(name);this.carrier=new CarrierModulation(name);}
 process(input){return this.carrier.process(this.inner.process(this.bytes.process(this.energy.process(reedSolomon(input)))));}
}
export class Modulator {
 constructor(){this.a=new Layer('A');this.b=new Layer('B');this.time=new TimeInterleaver();this.pilots=new Pilots();this.tmcc=new TMCC();this.resampler=new Resampler();this.skip=2;}
 frame(a,b){
  if(a.length!==64*188||b.length!==2592*188)throw Error('Tamaño de trama ISDB-T incorrecto.');
  const combined=combineLayers(this.a.process(a),this.b.process(b));
  let frequency=frequencyInterleave(this.time.process(combined));
  if(this.skip){frequency=frequency.subarray(this.skip*9984);this.skip=0;}
  return this.resampler.process(ofdm(this.tmcc.process(this.pilots.process(frequency))));
 }
}
export function* modulate(layerA,layerB,{flushFrames=4}={}){
 if(!layerA.length||layerA.length%188||!layerB.length||layerB.length%188)throw Error('Capas TS incompletas.');
 const frames=Math.ceil(layerA.length/(64*188))+flushFrames,modulator=new Modulator();let bPosition=0;
 for(let frame=0;frame<frames;frame++){
  const a=new Uint8Array(64*188).fill(255),b=new Uint8Array(2592*188);
  for(let packet=0;packet<64;packet++)a.set([0x47,0x1f,0xff,0x10],packet*188);
  a.set(layerA.subarray(frame*64*188,(frame+1)*64*188));
  for(let i=0;i<b.length;){const n=Math.min(b.length-i,layerB.length-bPosition);b.set(layerB.subarray(bPosition,bPosition+n),i);i+=n;bPosition=(bPosition+n)%layerB.length;}
  const iq=toCS8(modulator.frame(a,b));
  yield {iq,progress:(frame+1)/frames,frame,frames};
 }
}
