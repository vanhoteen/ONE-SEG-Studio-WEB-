import {HackRF,RATE} from './hackrf.js';
import {WaveformBuilder} from './waveform.js';
const $=id=>document.getElementById(id);
let radio=null,bytes=null,loading=false,running=false,videoBusy=false;
const barsWaveform=new WaveformBuilder();
const english=()=>document.documentElement.lang==='en';
function text(value){
 if(!english())return value;
 return ({'RF detenida':'RF stopped','Conectado · RF detenida':'Connected · RF stopped','HackRF desconectado':'HackRF disconnected','Señal cargada · RF detenida':'Signal loaded · RF stopped','Vídeo cargado · CH 20 · RF detenida':'Video loaded · CH 20 · RF stopped','RF detenida · prueba finalizada':'RF stopped · test complete','Iniciando transmisión…':'Starting transmission…','Transmitiendo':'Transmitting','Deteniendo…':'Stopping…','HackRF desconectado':'HackRF disconnected','Contenido cambiado · vuelve a preparar el vídeo o cargar las barras':'Content changed · prepare the video again or load bars','RF detenida · preparando señal del vídeo':'RF stopped · preparing video signal'}[value]||value);
}
function log(text){$('log').textContent+=`${new Date().toLocaleTimeString()} · ${text}\n`;}
function state(message){const value=text(message);$('state').textContent=value;log(value);}
function refresh(){
  $('start').dataset.running=String(running);
  window.dispatchEvent(new Event('radio-state')); 
  const connected=radio?.device.opened;
  $('connect').disabled=!navigator.usb||running||loading||connected;
  $('disconnect').disabled=!connected||running;
  $('start').disabled=!connected||!bytes||running||loading||videoBusy;
  $('stop').disabled=!running;
  $('transmitHint').textContent=running?(english()?'Transmission in progress':'Emisión en curso'):videoBusy?(english()?'Wait for preparation to finish':'Espera a que termine la preparación'):loading?(english()?'Loading…':'Cargando…'):!connected?(bytes?(english()?'Signal prepared. Connect HackRF above to enable Transmit.':'Señal preparada. Pulsa «Conectar HackRF» arriba para habilitar Emitir.'):(english()?'Connect HackRF, then prepare a video or load bars.':'Pulsa «Conectar HackRF» y prepara un vídeo o carga las barras.')):!bytes?(english()?'Prepare a video or load bars to enable Transmit.':'Prepara un vídeo o carga las barras para habilitar Emitir.'):(english()?'Everything is ready. Press Transmit when you want to begin.':'Todo preparado. Pulsa Emitir cuando quieras comenzar.');
  for(const id of ['demo','channel','frequency','gain','amp']) $(id).disabled=running||loading||videoBusy;
}
const compatible=Boolean(navigator.usb&&isSecureContext);
function supportText(){$('support').textContent=compatible?(english()?'WebUSB available. Connecting or loading a file does not start transmission.':'WebUSB disponible. Conectar y cargar un archivo no inicia la emisión.'):(english()?'Open this address in Chrome or Edge to connect HackRF. This browser does not support WebUSB.':'Para conectar el HackRF, abre esta dirección en Chrome o Edge. Este navegador no dispone de WebUSB.');}
supportText();
if(!compatible)$('support').classList.add('bad');
const channels=Array.from({length:40},(_,i)=>({channel:i+13,mhz:(473142857.142857+i*6000000)/1e6}));
for(const {channel,mhz} of channels){
  const option=document.createElement('option');option.value=String(channel);
  option.textContent=`CH ${channel} · ${mhz.toFixed(6)} MHz`;$('channel').append(option);
}
const manual=document.createElement('option');manual.value='manual';manual.textContent='Manual frequency';$('channel').append(manual);
$('channel').value='20';
$('channel').onchange=()=>{
  const choice=channels.find(c=>String(c.channel)===$('channel').value);
  if(choice){$('frequency').value=choice.mhz.toFixed(6);log(`Canal RF ${choice.channel}: ${choice.mhz.toFixed(6)} MHz. El archivo I/Q permanece igual.`);}
};
$('frequency').oninput=()=>{
  const match=channels.find(c=>Math.abs(c.mhz-Number($('frequency').value))<0.0000006);
  $('channel').value=match?String(match.channel):'manual';
};
$('gain').oninput=()=>{$('gainText').textContent=`${$('gain').value} dB`;};
$('connect').onclick=async()=>{
  loading=true;refresh();
  try {
    const device=await navigator.usb.requestDevice({filters:[{vendorId:0x1d50,productId:0x6089}]});
    const next=new HackRF(device);const firmware=await next.open();radio=next;
    $('device').textContent=device.productName||'HackRF One';$('firmware').textContent=`Firmware: ${firmware}`;state('Conectado · RF detenida');
  }catch(e){state(e.name==='NotFoundError'?'Selección cancelada':`No se pudo conectar: ${e.message}`);}
  finally{loading=false;refresh();}
};
$('disconnect').onclick=async()=>{try{await radio.close();radio=null;$('device').textContent='HackRF desconectado';state('RF detenida');}catch(e){state(e.message);}refresh();};
async function load(source,name){
  loading=true;bytes=null;refresh();
  try{const buffer=await source();if(buffer.byteLength===0||buffer.byteLength%2)throw Error('Se necesita I/Q de 8 bits intercalado (número par de bytes).');
    bytes=new Uint8Array(buffer);$('source').textContent=`${name} · ${(bytes.length/1e6).toFixed(1)} MB · ${(bytes.length/(RATE*2)).toFixed(1)} s`;state('Señal cargada · RF detenida');
  }catch(e){state(`No se pudo cargar: ${e.message}`);}finally{loading=false;refresh();}
}
$('demo').onclick=async()=>{
  if(loading||running)return;
  loading=true;bytes=null;refresh();state('Preparando barras One-Seg · RF detenida');
  try{
    const response=await fetch('demo/bars-layer-a.ts');
    if(!response.ok)throw Error('No se pudo cargar la fuente de barras.');
    const layerA=new Uint8Array(await response.arrayBuffer());
    const iq=await barsWaveform.build(layerA,value=>{$('progress').textContent=`${Math.round(value*100)}% · preparando barras en el navegador`;});
    bytes=iq;$('source').textContent=`Barras One-Seg · ${(bytes.length/1e6).toFixed(1)} MB · ${(bytes.length/(RATE*2)).toFixed(1)} s`;
    state('Barras cargadas · CH 20 · RF detenida');
  }catch(error){state(`No se pudieron preparar las barras: ${error.message}`);}
  finally{loading=false;refresh();}
};
$('start').onclick=async()=>{
  if(running||videoBusy||!radio||!bytes)return;
  running=true;refresh();state('Iniciando transmisión…');
  try{await radio.transmit(bytes,Number($('frequency').value)*1e6,Number($('gain').value),$('amp').checked,(sent,total)=>{
    $('state').textContent='Transmitiendo';$('progress').textContent=`${(sent/1e6).toFixed(1)} / ${(total/1e6).toFixed(1)} MB enviados por USB`;
  });state('RF detenida · prueba finalizada');}catch(e){state(`RF detenida / error: ${e.message}`);}
  finally{running=false;refresh();}
};
$('stop').onclick=async()=>{state('Deteniendo…');try{await radio?.stop();}catch(e){log(e.message);} };
navigator.usb?.addEventListener('disconnect',e=>{if(e.device===radio?.device){radio.active=false;state('HackRF desconectado');refresh();}});
window.addEventListener('pagehide',()=>{radio?.stop().catch(()=>{});});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&running){radio?.stop().catch(e=>log(e.message));}});
refresh();

window.addEventListener('video-busy',event=>{
  videoBusy=event.detail;
  if(videoBusy){
    bytes=null;
    $('source').textContent='Vídeo en preparación · no hay señal I/Q cargada';
    $('progress').textContent='0 MB enviados por USB';
    state('RF detenida · preparando señal del vídeo');
  }
  refresh();
});
window.addEventListener('video-invalidated',()=>{
 if(running)return;
 bytes=null;$('source').textContent='Contenido cambiado · vuelve a preparar el vídeo o cargar las barras';state('RF detenida');refresh();
});
window.addEventListener('video-iq',event=>{
 if(running)return;
 bytes=event.detail.bytes;
 $('channel').value='20';$('frequency').value='515.142857';
 $('source').textContent=`${event.detail.name} · ${(bytes.length/1e6).toFixed(1)} MB · ${(bytes.length/(RATE*2)).toFixed(1)} s`;
 state('Vídeo cargado · CH 20 · RF detenida');refresh();
});
window.addEventListener('language-changed',()=>{supportText();refresh();});
