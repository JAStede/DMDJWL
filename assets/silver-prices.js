(()=>{
'use strict';
const cards=[...document.querySelectorAll('[data-silver-weight]')];
const chart=document.querySelector('[data-silver-chart]');
if(!cards.length&&!chart)return;
const fmt=new Intl.NumberFormat('nl-NL',{style:'currency',currency:'EUR'});
const fmtGram=new Intl.NumberFormat('nl-NL',{style:'currency',currency:'EUR',minimumFractionDigits:3,maximumFractionDigits:3});
const timeFmt=new Intl.DateTimeFormat('nl-NL',{dateStyle:'short',timeStyle:'short',timeZone:'Europe/Amsterdam'});
const api='https://xaus.com/api/v1/';
const ounce=31.1034768;
let spot=null,fx=null,range='1d';
const put=(root,selector,value)=>{const node=root.querySelector(selector);if(node)node.textContent=value};
async function json(path){const res=await fetch(api+path,{cache:'no-store'});if(!res.ok)throw Error('Koersdienst HTTP '+res.status);return res.json()}
function update(error){
 cards.forEach(card=>{
  const weight=Number(card.dataset.silverWeight),premium=Number(card.dataset.silverPremium),bond=card.dataset.silverBond==='true';
  const base=spot?spot.gram*weight:0,ex=base*(1+premium/100);
  put(card,'[data-silver-price]',spot?fmt.format(ex)+(bond?' · vóór eventuele btw':' excl. btw'):'Prijs op aanvraag');
  put(card,'[data-silver-base]',spot?fmt.format(base):'—');
  put(card,'[data-silver-status]',spot?'Spot '+fmtGram.format(spot.gram)+' / gram · '+timeFmt.format(spot.time):'Actuele zilverkoers niet beschikbaar'+(error?' ('+error+')':''));
  if(!bond){put(card,'[data-silver-vat]',spot?fmt.format(ex*.21):'—');put(card,'[data-silver-total]',spot?fmt.format(ex*1.21):'—')}
 });
 document.querySelectorAll('[data-silver-current]').forEach(el=>el.textContent=spot?fmtGram.format(spot.gram)+' / gram':'Koers niet beschikbaar');
 document.querySelectorAll('[data-silver-updated]').forEach(el=>el.textContent=spot?'Bijgewerkt '+timeFmt.format(spot.time):'Geen actuele koers beschikbaar'+(error?' ('+error+')':''));
 document.querySelectorAll('[data-silver-list-price]').forEach(el=>{
  const weight=Number(el.dataset.silverListPrice),premium=Number(el.dataset.silverListPremium),bond=el.dataset.silverListBond==='true';
  const price=spot?spot.gram*weight*(1+premium/100):0;
  el.textContent=spot?fmt.format(price)+(bond?' · vóór eventuele btw':' excl. btw'):'Prijs op aanvraag';
 });
}
async function refresh(){
 try{
  const d=await json('spot?currency=EUR&unit=gram&compact=1');
  if(d.fx_stale===true)throw Error('Wisselkoers niet actueel');
  const rate=Number(d.fx_rate),silver=Number(d.silver_usd_oz),date=new Date(d.updated_at);
  if(!Number.isFinite(rate)||rate<=0||!Number.isFinite(silver)||silver<=0)throw Error('Koersgegevens ontbreken');
  if(!Number.isFinite(date.getTime())||Math.abs(Date.now()-date.getTime())>300000)throw Error('Koers is verouderd');
  if(String(d.silver_source||'').toLowerCase().includes('last known good'))throw Error('Zilverkoers is verouderd');
  fx=rate;spot={gram:silver*rate/ounce,time:date};update();
 }catch(e){spot=null;update(e.message)}
}
function render(points){
 if(!chart)return;
 const status=document.querySelector('[data-silver-chart-status]');
 if(points.length<2){chart.innerHTML='';if(status)status.textContent='Geen historische gegevens voor deze periode.';return}
 const values=points.map(p=>p.value),low=Math.min(...values),high=Math.max(...values),pad=Math.max((high-low)*.15,.015),min=low-pad,max=high+pad;
 const x=i=>80+640*i/(points.length-1),y=v=>215-165*(v-min)/(max-min);
 const line=points.map((p,i)=>(i?'L':'M')+x(i).toFixed(1)+' '+y(p.value).toFixed(1)).join(' ');
 chart.setAttribute('viewBox','0 0 780 275');
 const grid=[0,1,2,3,4].map(i=>{const v=min+(max-min)*i,yy=y(v);return '<line x1="80" x2="720" y1="'+yy+'" y2="'+yy+'" stroke="#d7dfdd" stroke-dasharray="4 6"/><text x="70" y="'+(yy+4)+'" text-anchor="end" font-size="12" fill="#52665f">'+fmtGram.format(v)+'</text>'}).join('');
 chart.innerHTML=grid+'<path d="'+line+' L720 215 L80 215 Z" fill="#90aaa3" opacity=".12"/><path d="'+line+'" fill="none" stroke="#547b70" stroke-width="3"/><line data-cross x1="0" x2="0" y1="45" y2="215" stroke="#547b70" stroke-dasharray="4 4" visibility="hidden"/><circle data-dot r="5" fill="#547b70" stroke="#fff" stroke-width="2" visibility="hidden"/><rect data-tip-bg width="200" height="52" rx="6" fill="#153d32" visibility="hidden"/><text data-tip fill="white" font-size="12" visibility="hidden"/><rect x="80" y="45" width="640" height="170" fill="transparent" data-hit/>';
 const cross=chart.querySelector('[data-cross]'),dot=chart.querySelector('[data-dot]'),bg=chart.querySelector('[data-tip-bg]'),tip=chart.querySelector('[data-tip]'),hit=chart.querySelector('[data-hit]');
 const hide=()=>[cross,dot,bg,tip].forEach(n=>n.setAttribute('visibility','hidden'));
 hit.addEventListener('pointermove',e=>{
  const rect=chart.getBoundingClientRect(),xx=(e.clientX-rect.left)*780/rect.width;
  const i=Math.max(0,Math.min(points.length-1,Math.round((xx-80)/640*(points.length-1)))),px=x(i),py=y(points[i].value),tx=Math.max(80,Math.min(520,px-100)),ty=Math.max(4,py-67);
  cross.setAttribute('x1',px);cross.setAttribute('x2',px);dot.setAttribute('cx',px);dot.setAttribute('cy',py);bg.setAttribute('x',tx);bg.setAttribute('y',ty);tip.setAttribute('x',tx+10);tip.setAttribute('y',ty+18);
  tip.textContent='';for(const [j,s] of [timeFmt.format(points[i].time),fmtGram.format(points[i].value)+' / gram'].entries()){const span=document.createElementNS('http://www.w3.org/2000/svg','tspan');span.setAttribute('x',tx+10);if(j)span.setAttribute('dy','19');span.textContent=s;tip.append(span)}
  [cross,dot,bg,tip].forEach(n=>n.setAttribute('visibility','visible'));
 });
 hit.addEventListener('pointerleave',hide);
 if(status)status.textContent='Historische zilverkoers in EUR per gram · bron XAUS · indicatief omgerekend met actuele USD/EUR-koers.';
}
async function loadChart(selected){
 if(!chart)return;
 const status=document.querySelector('[data-silver-chart-status]');if(status)status.textContent='Grafiek laden…';
 try{
  if(!Number.isFinite(fx)||fx<=0)throw Error('Wisselkoers niet beschikbaar');
  const intraday=selected==='1d',period=selected==='1m'?'1mo':selected;
  const d=await json(intraday?'chart?symbol=silver&range=1d&interval=5m':'chart?symbol=silver&range='+period+'&interval=1d');
  const points=(d.points||[]).map(p=>{
   const t=Number(p.t),date=new Date(Number.isFinite(t)&&t>0?(t>1e12?t:t*1000):(p.d||p.date));
   return {time:date,value:Number(p.c)*fx/ounce};
  }).filter(p=>Number.isFinite(p.time.getTime())&&Number.isFinite(p.value)&&p.value>0).sort((a,b)=>a.time-b.time);
  if(points.length<2)throw Error('Geen koerspunten ontvangen');
  render(points);
 }catch(e){chart.innerHTML='';if(status)status.textContent='Historische zilverkoers tijdelijk niet beschikbaar ('+e.message+').'}
}
document.querySelectorAll('[data-silver-range]').forEach(b=>b.addEventListener('click',()=>{
 range=b.dataset.silverRange;
 document.querySelectorAll('[data-silver-range]').forEach(other=>other.setAttribute('aria-pressed',String(other===b)));
 loadChart(range);
}));
refresh().then(()=>loadChart(range));setInterval(refresh,60000);
})();