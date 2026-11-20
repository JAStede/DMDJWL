(()=>{
'use strict';
const cards=[...document.querySelectorAll('[data-gold-weight]')];
if(!cards.length)return;
const fmt=new Intl.NumberFormat('nl-NL',{style:'currency',currency:'EUR'});
const endpoint='https://xaus.com/api/v1/';
const set=(el,value)=>{if(el)el.textContent=value};
let spot=null,fx=null;
const dateFormat=new Intl.DateTimeFormat('nl-NL',{dateStyle:'short',timeStyle:'short',timeZone:'Europe/Amsterdam'});
async function get(url){const res=await fetch(url,{cache:'no-store'});if(!res.ok)throw new Error('HTTP '+res.status);return res.json()}
function showPrice(error){
 const gram=spot?.gram;
 cards.forEach(card=>{
  const weight=Number(card.dataset.goldWeight),premium=Number(card.dataset.goldPremium||1.2);
  const base=gram*weight,price=base*(1+premium/100);
  set(card.querySelector('[data-live-price]'),gram?fmt.format(price):'Prijs op aanvraag');
  set(card.querySelector('[data-spot-value]'),gram?'Goudwaarde '+fmt.format(base)+' · + '+premium+'% premie':'Koers niet beschikbaar'+(error?' ('+error+')':''));
  set(card.querySelector('#gold-gram'),gram?fmt.format(gram):'—');
  set(card.querySelector('#gold-total'),gram?fmt.format(base):'—');
  set(card.querySelector('#gold-selling'),gram?fmt.format(price):'—');
  set(card.querySelector('#gold-updated'),gram?dateFormat.format(spot.time):'—');
 });
 set(document.querySelector('[data-chart-current]'),gram?fmt.format(gram)+' / gram':'Koers niet beschikbaar');
 set(document.querySelector('[data-gold-timestamp]'),gram?'Indicatieve spotprijs · '+dateFormat.format(spot.time):'Geen actuele koers beschikbaar'+(error?' ('+error+')':''));
}
async function loadSpot(){
 try{
  const d=await get(endpoint+'spot?currency=EUR&unit=gram&compact=1');
  const updated=new Date(d.price_as_of||d.data_state?.as_of||d.updated_at);
  if(d.stale===true||d.data_state?.status==='unavailable'||d.fx_stale===true)throw Error('Koersbron meldt verouderde gegevens');
  if(!Number.isFinite(updated.getTime())||Date.now()-updated.getTime()>300000)throw Error('Koers ouder dan vijf minuten');
  fx=Number(d.fx_rate);
  const direct=d.xau?.currency==='EUR'&&d.xau?.unit==='gram'?Number(d.xau.price):NaN;
  const converted=Number(d.spot_usd_oz)*fx/31.1034768;
  const gram=Number.isFinite(direct)&&direct>0?direct:converted;
  if(!Number.isFinite(gram)||gram<=0)throw Error('Geen geldige EUR-koers ontvangen');
  spot={gram,time:updated};
  showPrice();
 }catch(e){spot=null;showPrice(e.message)}
}
let currentRange='1d';
function draw(points){
 const svg=document.querySelector('[data-gold-chart]'),message=document.querySelector('[data-chart-message]');
 if(!svg)return;
 if(points.length<2){svg.innerHTML='';set(message,'Voor deze periode zijn geen historische koersen beschikbaar.');return}
 const vals=points.map(p=>p.value),low=Math.min(...vals),high=Math.max(...vals),padding=Math.max((high-low)*.15,.15),min=low-padding,max=high+padding;
 const x=i=>75+650*i/(points.length-1),y=v=>215-165*(v-min)/(max-min);
 const line=points.map((p,i)=>(i?'L':'M')+x(i).toFixed(1)+' '+y(p.value).toFixed(1)).join(' ');
 svg.setAttribute('viewBox','0 0 780 270');
 const grid=[0,1,2,3,4].map(i=>{const v=min+(max-min)*i,yy=y(v);return '<line x1="75" x2="725" y1="'+yy+'" y2="'+yy+'" stroke="#dce5de" stroke-dasharray="3 6"/><text x="65" y="'+(yy+4)+'" text-anchor="end" font-size="12" fill="#536a5b">'+fmt.format(v)+'</text>'}).join('');
 svg.innerHTML=grid+'<path d="'+line+'" fill="none" stroke="#b78a42" stroke-width="3" stroke-linejoin="round"/><line data-cross x1="0" x2="0" y1="45" y2="215" stroke="#927647" stroke-dasharray="4 4" visibility="hidden"/><circle data-dot r="5" fill="#b78a42" stroke="#fff" stroke-width="2" visibility="hidden"/><rect data-tooltip-bg width="200" height="50" rx="6" fill="#153d32" visibility="hidden"/><text data-tooltip fill="white" font-size="12" visibility="hidden"></text><rect x="75" y="45" width="650" height="170" fill="transparent" data-hit/>';
 const cross=svg.querySelector('[data-cross]'),dot=svg.querySelector('[data-dot]'),bg=svg.querySelector('[data-tooltip-bg]'),tip=svg.querySelector('[data-tooltip]'),hit=svg.querySelector('[data-hit]');
 const hide=()=>[cross,dot,bg,tip].forEach(el=>el.setAttribute('visibility','hidden'));
 hit.addEventListener('pointermove',e=>{
  const rect=svg.getBoundingClientRect(),xx=(e.clientX-rect.left)*780/rect.width;
  const i=Math.max(0,Math.min(points.length-1,Math.round((xx-75)/650*(points.length-1)))),px=x(i),py=y(points[i].value);
  cross.setAttribute('x1',px);cross.setAttribute('x2',px);dot.setAttribute('cx',px);dot.setAttribute('cy',py);
  const tx=Math.max(75,Math.min(525,px-100)),ty=Math.max(5,py-65);
  bg.setAttribute('x',tx);bg.setAttribute('y',ty);tip.setAttribute('x',tx+10);tip.setAttribute('y',ty+19);
  const when=dateFormat.format(points[i].time);
  tip.textContent='';
  const t1=document.createElementNS('http://www.w3.org/2000/svg','tspan');t1.setAttribute('x',tx+10);t1.textContent=when;
  const t2=document.createElementNS('http://www.w3.org/2000/svg','tspan');t2.setAttribute('x',tx+10);t2.setAttribute('dy','18');t2.textContent=fmt.format(points[i].value)+' / gram';
  tip.append(t1,t2);[cross,dot,bg,tip].forEach(el=>el.setAttribute('visibility','visible'));
 });
 hit.addEventListener('pointerleave',hide);
 set(message,'Historische indicatieve goudkoers in EUR per gram · bron XAUS. Omgerekend met de actuele USD/EUR-wisselkoers.');
}
async function loadChart(range){
 const message=document.querySelector('[data-chart-message]');set(message,'Grafiek laden…');
 try{
  const intraday=range==='1d';
  const url=intraday?'intraday?symbol=xau&hours=24':'chart?symbol=xau&range='+range+'&interval=1d';
  const d=await get(endpoint+url);
  if(!Number.isFinite(fx)||fx<=0)throw Error('Wisselkoers ontbreekt');
  const points=(d.points||[]).map(p=>{
   const raw=Number(intraday?p.p:p.c),t=Number(p.t);
   const time=intraday?new Date(t>1e12?t:t*1000):new Date(Number.isFinite(t)&&t>0?(t>1e12?t:t*1000):(p.d||p.date));
   return {time,value:raw*fx/31.1034768};
  }).filter(p=>Number.isFinite(p.time.getTime())&&Number.isFinite(p.value)&&p.value>0).sort((a,b)=>a.time-b.time);
  if(points.length<2)throw Error('Geen punten');
  draw(points);
 }catch(e){const svg=document.querySelector('[data-gold-chart]');if(svg)svg.innerHTML='';set(message,'Historische koers momenteel niet beschikbaar ('+e.message+').')}
}
document.querySelectorAll('[data-chart-range]').forEach(button=>button.addEventListener('click',()=>{currentRange=button.dataset.chartRange;document.querySelectorAll('[data-chart-range]').forEach(other=>other.setAttribute('aria-pressed',String(other===button)));loadChart(currentRange)}));
loadSpot().then(()=>loadChart(currentRange));
setInterval(loadSpot,60000);
})();