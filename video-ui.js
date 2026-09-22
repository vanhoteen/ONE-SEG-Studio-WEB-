import {VideoConverter} from './video.js';
import {StreamingWaveform} from './stream-waveform.js';
const $=id=>document.getElementById(id),converter=new VideoConverter();
let busy=false,urls=[];
function clearResult(){for(const url of urls)URL.revokeObjectURL(url);urls=[];$('videoPreview').removeAttribute('src');$('videoPreview').load();$('videoResult').hidden=true;}
function update(){
  const transmitting=$('start').dataset.running==='true';
  $('convert').disabled=busy||transmitting||!$('videoFile').files.length;
  $('cancelConvert').disabled=!busy;
  for(const id of ['videoFile','clipDuration','videoAspect','videoBitrate'])$(id).disabled=busy||transmitting;
}
for(const id of ['videoFile','clipDuration','videoAspect','videoBitrate'])$(id).addEventListener('change',()=>{clearResult();window.dispatchEvent(new Event('video-invalidated'));$('videoState').textContent='Listo para preparar · no transmite';update();});
window.addEventListener('radio-state',update);
$('cancelConvert').onclick=()=>{converter.cancel();};
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
    const stream=new StreamingWaveform(result.layerA);
    window.dispatchEvent(new CustomEvent('video-stream',{detail:{stream,name:$('videoFile').files[0].name,seconds:stream.seconds}}));
    $('videoProgress').value=1;
    $('videoState').textContent=`Vídeo preparado · ${stream.seconds.toFixed(1)} s · CH 20 · pulsa Emitir para modular y transmitir por bloques`;
    $('videoLog').textContent+='\nCapa A preparada. La modulación I/Q se producirá por bloques al pulsar Emitir; RF detenida.';
  }catch(error){$('videoState').textContent=error.message;}
  finally{busy=false;update();window.dispatchEvent(new CustomEvent('video-busy',{detail:false}));}
};
update();
