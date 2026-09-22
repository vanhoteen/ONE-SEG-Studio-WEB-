const copy={
 es:{
  tagline:'Una señal. Un navegador.',intro:'Prueba de reproducción I/Q por USB. Los archivos permanecen en tu ordenador.',
  connect:'Conectar HackRF',disconnect:'Desconectar',test:'La señal de prueba',bars:'Cargar barras preparadas',
  barsHelp:'Si solo vas a transmitir barras, pulsa «Cargar barras preparadas» y ve directamente al último paso: Emitir.',
  radio:'Ajustes de radio',video:'Prepara tu MP4',videoIntro:'Convierte un fragmento a 320 × 240 y 15 fps, con audio AAC. El archivo no sale de tu ordenador.',
  prepare:'Preparar vídeo',cancel:'Cancelar',duration:'La señal I/Q ocupa unos 16 MB por segundo. 15 s es el modo fiable; 30 s es una prueba experimental que necesita aproximadamente 480 MB de RAM.',
  footer:'WebUSB · Chrome / Edge · Sin servidores de procesamiento. Barras con imagen y audio verificadas por el usuario. Modulador de vídeo contrastado con GNU Radio; recepción del vídeo web pendiente de prueba.',
  emit:'▶ Emitir',stop:'■ Detener',language:'Idioma',badge:'BETA LOCAL',connection:'03 / CONEXIÓN Y EMISIÓN',content:'01 / CONTENIDO',output:'02 / SALIDA',
  barsLabel:'barras con audio',channel:'Canal japonés (UHF)',channels:'Canales físicos 13–52. Los botones 1–12 del televisor son memorias de emisoras.',frequency:'Frecuencia (MHz)',amp:'Amplificador RF',sample:'Muestreo',filter:'Filtro',radioHelp:'El selector cambia la frecuencia RF; no modifica las tablas del archivo I/Q. Las barras incluidas están preparadas para CH 20.',
  videoStep:'VÍDEO LOCAL / CONVERSIÓN EN EL NAVEGADOR',file:'Seleccionar vídeo',durationLabel:'Fragmento desde el inicio',aspect:'Formato en pantalla',bitrate:'Bitrate de vídeo',notice:'Esta etapa prepara el vídeo y la capa A con las tablas de la aplicación para CH 20. Después genera la señal I/Q en tu navegador. Al terminar, pulsa Emitir para realizar la prueba. La generación no activa el HackRF.',firmwareHelp:'Cuando aparezca una versión de firmware, por ejemplo 2024.02.1, el navegador ha abierto correctamente el HackRF.',conversionLog:'Registro de conversión',status:'ESTADO',testLog:'Registro de la prueba'
 },
 en:{
  tagline:'One signal. One browser.',intro:'USB I/Q playback test. Your files stay on your computer.',
  connect:'Connect HackRF',disconnect:'Disconnect',test:'Test signal',bars:'Load prepared bars',
  barsHelp:'For bars only, choose “Load prepared bars” and go straight to the final step: Transmit.',
  radio:'Radio settings',video:'Prepare your MP4',videoIntro:'Converts a clip to 320 × 240 at 15 fps with AAC audio. The file never leaves your computer.',
  prepare:'Prepare video',cancel:'Cancel',duration:'I/Q takes about 16 MB per second. 15 s is the reliable mode; the experimental 30 s test needs about 480 MB of RAM.',
  footer:'WebUSB · Chrome / Edge · No processing servers. Bars with video and audio verified by the user. Video modulator compared with GNU Radio; browser-video reception still needs a hardware test.',
  emit:'▶ Transmit',stop:'■ Stop',language:'Language',badge:'LOCAL BETA',connection:'03 / CONNECT AND TRANSMIT',content:'01 / CONTENT',output:'02 / OUTPUT',
  barsLabel:'bars with audio',channel:'Japanese channel (UHF)',channels:'Physical channels 13–52. TV buttons 1–12 are station memories.',frequency:'Frequency (MHz)',amp:'RF amplifier',sample:'Sample rate',filter:'Filter',radioHelp:'The selector changes RF frequency; it does not modify I/Q tables. Included bars are prepared for CH 20.',
  videoStep:'LOCAL VIDEO / BROWSER CONVERSION',file:'Select video',durationLabel:'Clip from the beginning',aspect:'Display format',bitrate:'Video bitrate',notice:'This stage prepares the video and layer A using the CH 20 application tables. It then generates I/Q in your browser. When finished, press Transmit for the test. Preparation never activates HackRF.',firmwareHelp:'When a firmware version appears, for example 2024.02.1, the browser has opened HackRF successfully.',conversionLog:'Conversion log',status:'STATUS',testLog:'Test log'
 }
};
const $=id=>document.getElementById(id);
export function applyLanguage(language){
 const t=copy[language]||copy.es;document.documentElement.lang=language;
 $('tagline').textContent=t.tagline;$('introText').textContent=t.intro;$('connect').textContent=t.connect;$('disconnect').textContent=t.disconnect;
 $('testTitle').textContent=t.test;$('demo').textContent=t.bars;$('barsHelp').textContent=t.barsHelp;$('radioTitle').textContent=t.radio;
 $('videoTitle').textContent=t.video;$('videoIntro').textContent=t.videoIntro;$('convert').textContent=t.prepare;$('cancelConvert').textContent=t.cancel;$('durationNote').textContent=t.duration;
 $('footer').textContent=t.footer;$('start').textContent=t.emit;$('stop').textContent=t.stop;
 $('badge').textContent=t.badge;$('connectionStep').textContent=t.connection;$('contentStep').textContent=t.content;$('outputStep').textContent=t.output;
 $('barsLabel').textContent=t.barsLabel;$('channelLabel').firstChild.textContent=t.channel;$('channelsHelp').textContent=t.channels;$('frequencyLabel').firstChild.textContent=t.frequency;
 $('ampLabel').textContent=t.amp;$('sampleLabel').textContent=t.sample;$('filterLabel').textContent=t.filter;$('radioHelp').textContent=t.radioHelp;
 $('videoStep').textContent=t.videoStep;$('fileLabel').firstChild.textContent=t.file;$('durationLabel').firstChild.textContent=t.durationLabel;$('aspectLabel').firstChild.textContent=t.aspect;$('bitrateLabel').firstChild.textContent=t.bitrate;
 $('videoNotice').textContent=t.notice;$('firmwareHelp').textContent=t.firmwareHelp;$('conversionLog').textContent=t.conversionLog;$('statusLabel').textContent=t.status;$('testLog').textContent=t.testLog;
 const format=$('videoAspect');format.options[0].textContent=language==='en'?'4:3 · full picture':'4:3 · imagen completa';format.options[1].textContent=language==='en'?'16:9 · crop to fill':'16:9 · recortado para llenar';
 const duration=$('clipDuration');duration.options[3].textContent=language==='en'?'30 seconds · experimental':'30 segundos · experimental';
 if($('state').textContent==='RF detenida'||$('state').textContent==='RF stopped')$('state').textContent=language==='en'?'RF stopped':'RF detenida';
 document.querySelector('.language').firstChild.textContent=t.language+' ';
 window.dispatchEvent(new CustomEvent('language-changed',{detail:{language,t}}));
}
const saved=localStorage.getItem('oneseg-language')||(navigator.language.startsWith('en')?'en':'es');
$('language').value=saved;applyLanguage(saved);
$('language').addEventListener('change',event=>{localStorage.setItem('oneseg-language',event.target.value);applyLanguage(event.target.value);});
