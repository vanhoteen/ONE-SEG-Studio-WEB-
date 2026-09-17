// Mode 3 inverse FFT, shifted spectrum, guard 1/16 and desktop baseband gain.
// Radix-2 inverse transform is unnormalized, matching GNU Radio / FFTW.
const N=8192,reverse=new Uint16Array(N),cos=new Float64Array(N/2),sin=new Float64Array(N/2);
for(let i=0;i<N;i++){let v=i,r=0;for(let b=0;b<13;b++){r=(r<<1)|(v&1);v>>=1;}reverse[i]=r;}
for(let i=0;i<N/2;i++){cos[i]=Math.cos(2*Math.PI*i/N);sin[i]=Math.sin(2*Math.PI*i/N);}
export function ofdm(input){
 if(input.length%(2*N))throw Error('Símbolo FFT incompleto.');
 const out=new Float32Array(input.length/(2*N)*(N+512)*2),work=new Float64Array(N*2),gain=Math.fround(0.0022097087);
 for(let base=0,symbol=0;base<input.length;base+=N*2,symbol++){
  for(let i=0;i<N;i++){const source=base+((i+N/2)%N)*2,target=reverse[i]*2;work[target]=input[source];work[target+1]=input[source+1];}
  for(let size=2;size<=N;size*=2){
   const half=size/2,stride=N/size;
   for(let start=0;start<N;start+=size)for(let k=0;k<half;k++){
    const a=(start+k)*2,b=(start+k+half)*2,c=cos[k*stride],s=sin[k*stride];
    const re=work[b]*c-work[b+1]*s,im=work[b]*s+work[b+1]*c,ar=work[a],ai=work[a+1];
    work[a]=ar+re;work[a+1]=ai+im;work[b]=ar-re;work[b+1]=ai-im;
   }
  }
  const target=symbol*(N+512)*2;
  for(let i=0;i<N+512;i++){
   const source=((i+N-512)%N)*2;
   out[target+i*2]=Math.fround(work[source])*gain;out[target+i*2+1]=Math.fround(work[source+1])*gain;
  }
 }
 return out;
}
