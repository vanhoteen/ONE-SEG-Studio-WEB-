import {VideoConverter} from './video.js';
import {WaveformBuilder} from './waveform.js';
const $=id=>document.getElementById(id),converter=new VideoConverter();
let busy=false,urls=[];
const waveform=new WaveformBuilder();
function clearResult(){for(const url of urls)URL.revokeObjectURL(url);urls=[];$('videoPreview').removeAttribute('src');$('videoPreview').load();$('videoResult').hidden=true;}
function update(){
  const transmitting=$('start').dataset.running==='true';
  $('convert').disabled=busy||transmitting||!$('videoFile').files.length;
  $('cancelConvert').disabled=!busy;
  for(const id of ['videoFile','clipDuration','videoAspect','videoBitrate'])$(id).disabled=busy||transmitting;
}
for(const id of ['videoFile','clipDuration','videoAspect','videoBitrate'])$(id).addEventListener('change',()=>{clearResult();window.dispatchEvent(new Event('video-invalidated'));$('videoState').textContent='Listo para preparar · no transmite';update();});
window.addEventListener('radio-state',update);
$('cancelConvert').onclick=()=>{converter.cancel();waveform.cancel();};
$('convert').onclick=async()=>{
  if(busy)return;
  busy=true;clearResult();update();window.dispatchEvent(new CustomEvent('video-busy',{detail:true}));
  $('videoState').textContent='Preparando en el navegador…';$('videoLog').textContent='';$('videoProgress').value=0;
  try {
    const result=await converter.convert($('videoFile').files[0],{duration:Number($('clipDuration').value),bitrate:Number($('videoBitrate').value),aspect:$('videoAspect').value},message=>{
      $('videoLog').textContent=($('videoLog').textContent+'\n'+message).slice(-20000);
    },value=>{$('videoProgress').value=value*.45;});
    const preview=URL.createObjectURL(new Blob([result.preview],{type:'video/mp4'}));
    urls=[preview];
    $('videoPreview').src=preview;$('videoResult').hidden=false;
    $('videoState').textContent='Generando señal One-Seg en el navegador…';
    const iq=await waveform.build(result.layerA,value=>{$('videoProgress').value=.45+.55*value;});
    window.dispatchEvent(new CustomEvent('video-iq',{detail:{bytes:iq,name:$('videoFile').files[0].name}}));
    $('videoState').textContent=`Señal preparada · ${(iq.length/16000000).toFixed(1)} s · CH 20 · pulsa Emitir para probar`;
    $('videoLog').textContent+='\nModulación terminada a 8 MS/s. RF detenida. Recepción de este vídeo pendiente de prueba.';
  }catch(error){$('videoState').textContent=error.message;}
  finally{busy=false;update();window.dispatchEvent(new CustomEvent('video-busy',{detail:false}));}
};
update();
