export function encodingArgs({duration=15,bitrate=300,audio=true,aspect='4:3'}={}) {
  if(!Number.isInteger(duration)||duration<1||duration>15)throw Error('Elige entre 1 y 15 segundos.');
  if(![80,100,200,300].includes(bitrate))throw Error('Bitrate no admitido.');
  const peak=Math.max(100,bitrate);
  if(!['4:3','16:9'].includes(aspect))throw Error('Formato no admitido.');
  const picture=aspect==='16:9'
    ? 'fps=15,scale=320:240:force_original_aspect_ratio=increase,crop=320:240,setsar=1'
    : 'fps=15,scale=320:240:force_original_aspect_ratio=decrease,pad=320:240:(ow-iw)/2:(oh-ih)/2,setsar=1';
  return ['-i','input',...(!audio?['-f','lavfi','-i','anullsrc=r=24000:cl=stereo']:[]),
    '-t',String(duration),'-map','0:v:0','-map',audio?'0:a:0':'1:a:0',
    '-shortest','-vf',picture,
    '-r','15','-c:v','libx264','-profile:v','baseline','-level:v','1.2','-pix_fmt','yuv420p',
    '-b:v',`${bitrate}k`,'-maxrate:v',`${peak}k`,'-bufsize:v',`${peak}k`,
    '-g','15','-bf','0','-refs','1','-x264-params','repeat-headers=1:aud=1:scenecut=0:force-cfr=1',
    '-c:a','aac','-ar','24000','-ac','2','-b:a','48k','-mpegts_service_id','1544',
    '-mpegts_pmt_start_pid','4096','-streamid','0:256','-streamid','1:257',
    '-muxrate','440563','-f','mpegts','base.ts'];
}
