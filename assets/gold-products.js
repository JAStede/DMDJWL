(function(){
 const cards=[...document.querySelectorAll('[data-gold-weight]')];if(!cards.length)return;
 const euro=new Intl.NumberFormat('nl-NL',{style:'currency',currency:'EUR'}),euroGram=new Intl.NumberFormat('nl-NL',{style:'currency',currency:'EUR',minimumFractionDigits:2,maximumFractionDigits:2});
 const api='https://xaus.com/api/v1/';
 let spot=null,series=[],range='1d';
 const isFresh=d=>d&&d.data_state?.status==='fresh'&&d.stale!==true&&d.fx_stale!==true&&d.xau?.currency==='EUR'&&d.xau?.unit==='gram'&&Number(d.xau.price)>0&&Number.isFinite(Date.parse(d.price_as_of||d.data_state.as_of))&&Math.abs(Date.now()-Date.parse(d.price_as_of||d.data_state.as_of))<300000&&Number.isFinite(Date.parse(d.updated_at))&&Math.abs(Date.now()-Date.parse(d.updated_at))<300000;
 async function fetchJSON(url){const r=await fetch(url,{cache:'no-store'});if(!r.ok)throw Error('Koersdienst niet beschikbaar');return r.json()}
 function setPrices(){
  cards.forEach(card=>{const w=Number(card.dataset.goldWeight),premium=Number(card.dataset.goldPremium||1.2),el=card.querySelector('[data-live-price]'),base=card.querySelector('[data-spot-value]');if(!el)return;
   if(!spot){if(w===250){for(const id of ['gold-gram','gold-total','gold-selling','gold-updated']){const node=card.querySelector('#'+id);if(node)node.textContent='—'}}el.textContent='Prijs op aanvraag';if(base)base.textContent='Koers tijdelijk niet beschikbaar';return}
   const value=spot.xau.price*w,asking=value*(1+premium/100);
   if(w===250){const gram=card.querySelector('#gold-gram'),total=card.querySelector('#gold-total'),selling=card.querySelector('#gold-selling'),updated=card.querySelector('#gold-updated');if(gram)gram.textContent=euro.format(spot.xau.price);if(total)total.textContent=euro.format(value);if(selling)selling.textContent=euro.format(asking);if(updated)updated.textContent=new Intl.DateTimeFormat('nl-NL',{dateStyle:'short',timeStyle:'short',timeZone:'Europe/Amsterdam'}).format(new Date(spot.price_as_of||spot.data_state.as_of));}
   el.textContent=euro.format(asking);if(base)base.textContent='Goudwaarde '+euro.format(value)+' · + '+premium+'% premie';
  });
  const stamp=document.querySelector('[data-gold-timestamp]');if(stamp)stamp.textContent=spot?'Indicatie · '+new Intl.DateTimeFormat('nl-NL',{dateStyle:'short',timeStyle:'short',timeZone:'Europe/Amsterdam'}).format(new Date(spot.price_as_of||spot.data_state.as_of)):'Geen actuele koers beschikbaar';
 }
 async function loadSpot(){try{const d=await fetchJSON(api+'spot?currency=EUR&unit=gram&compact=1');spot=isFresh(d)?d:null}catch(e){spot=null}setPrices()}
 function draw(points){
 const svg=document.querySelector('[data-gold-chart]'),message=document.querySelector('[data-chart-message]');if(!svg)return;
 if(points.length<2){svg.innerHTML='';if(message)message.textContent='Voor deze periode zijn momenteel geen koersgegevens beschikbaar.';return}
 const vals=points.map(p=>p.p),min=Math.min(...vals),max=Math.max(...vals),pad=Math.max((max-min)*.16,1),lo=min-pad,hi=max+pad;
 const x=i=>78+(i/(points.length-1))*650,y=v=>218-(v-lo)/(hi-lo)*158;
 const coords=points.map((p,i)=>[x(i),y(p.p)]),line=coords.map(([xx,yy],i)=>(i?'L':'M')+xx.toFixed(1)+' '+yy.toFixed(1)).join(' ');
 const area=line+' L728 218 L78 218 Z',last=coords[coords.length-1],first=vals[0],end=vals[vals.length-1],delta=(end-first)/first*100;
 const grid=[0,1,2,3,4].map(i=>{const v=lo+(hi-lo)*i,yy=y(v);return '<line x1="78" y1="'+yy+'" x2="728" y2="'+yy+'" stroke="#dce5de" stroke-dasharray="3 6"/><text x="68" y="'+(yy+4)+'" text-anchor="end" font-size="13" fill="#536a5b">'+euroGram.format(v)+'</text>'}).join('');
 const markers=[0,Math.floor((points.length-1)/2),points.length-1].map(i=>{const t=points[i].t;const date=new Date(t>1e12?t:t*1000);const label=Number.isFinite(date.getTime())?new Intl.DateTimeFormat('nl-NL',{day:'2-digit',month:'short',...(range==='1d'?{hour:'2-digit',minute:'2-digit'}:{})}).format(date):'';return '<text x="'+x(i)+'" y="251" text-anchor="'+(i===0?'start':i===points.length-1?'end':'middle')+'" font-size="12" fill="#75867a">'+label+'</text>'}).join('');
 svg.setAttribute('viewBox','0 0 780 285');svg.setAttribute('role','img');svg.setAttribute('aria-label','Historische indicatieve goudkoers in euro per gram');
 svg.innerHTML='<defs><linearGradient id="goldArea" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#c8a05b" stop-opacity=".34"/><stop offset="1" stop-color="#c8a05b" stop-opacity="0"/></linearGradient><linearGradient id="goldLine" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#d6b46b"/><stop offset="1" stop-color="#97702c"/></linearGradient></defs>'+grid+'<path d="'+area+'" fill="url(#goldArea)"/><path d="'+line+'" fill="none" stroke="url(#goldLine)" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="'+last[0]+'" cy="'+last[1]+'" r="9" fill="#c6a061" opacity=".2"/><circle cx="'+last[0]+'" cy="'+last[1]+'" r="4.5" fill="#a27b37" stroke="white" stroke-width="2"/>'+markers+'<line data-chart-crosshair x1="0" y1="42" x2="0" y2="218" stroke="#947a4d" stroke-dasharray="4 5" visibility="hidden"/><circle data-chart-point r="6" fill="#b78a42" stroke="white" stroke-width="3" visibility="hidden"/><rect data-chart-tip-bg rx="7" width="180" height="49" fill="#153d32" visibility="hidden"/><text data-chart-tip-text font-size="12" font-weight="600" fill="#fff" visibility="hidden"></text><rect x="78" y="42" width="650" height="176" fill="transparent" data-chart-hit/>';
 const hit=svg.querySelector('[data-chart-hit]'),cross=svg.querySelector('[data-chart-crosshair]'),dot=svg.querySelector('[data-chart-point]'),bg=svg.querySelector('[data-chart-tip-bg]'),tip=svg.querySelector('[data-chart-tip-text]');
 svg.addEventListener('pointermove',e=>{const rect=svg.getBoundingClientRect(),xx=(e.clientX-rect.left)*780/rect.width,i=Math.max(0,Math.min(points.length-1,Math.round((xx-78)/650*(points.length-1)))),px=x(i),py=y(vals[i]);cross.setAttribute('x1',px);cross.setAttribute('x2',px);dot.setAttribute('cx',px);dot.setAttribute('cy',py);bg.setAttribute('x',Math.max(78,Math.min(548,px-90)));bg.setAttribute('y',Math.max(6,py-65));tip.setAttribute('x',Math.max(88,Math.min(558,px-80)));tip.setAttribute('y',Math.max(24,py-43));const t=points[i].t,date=new Date(t>1e12?t:t*1000),time=Number.isFinite(date.getTime())?new Intl.DateTimeFormat('nl-NL',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',timeZone:'Europe/Amsterdam'}).format(date):'Tijd onbekend';tip.innerHTML='<tspan x="'+tip.getAttribute('x')+'" dy="0">'+time+'</tspan><tspan x="'+tip.getAttribute('x')+'" dy="17">'+new Intl.NumberFormat('nl-NL',{style:'currency',currency:'USD'}).format(vals[i])+' / oz</tspan>';[cross,dot,bg,tip].forEach(el=>el.setAttribute('visibility','visible'))});
 svg.addEventListener('pointerleave',()=>[cross,dot,bg,tip].forEach(el=>el.setAttribute('visibility','hidden')));
 if(message)message.textContent='Koersverandering in deze periode: '+(delta>=0?'+':'')+delta.toFixed(2).replace('.',',')+'% · EUR per gram · bron XAUS. Historische omrekening op basis van EUR/USD.';
 }
 async function loadChart(selected){
 const message=document.querySelector('[data-chart-message]');if(message)message.textContent='Grafiek laden…';
 document.querySelectorAll('[data-chart-range]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.chartRange===selected)));
 try{
  const interval=selected==='1d'?'5m':selected==='5d'?'60m':'1d';
  const goldURL=selected==='1d'?api+'intraday?symbol=xau&hours=24':api+'chart?symbol=xau&range='+selected+'&interval='+interval;
  const fxURL=api+'chart?symbol=eurusd&range='+selected+'&interval='+interval;
  const [gold,fx]=await Promise.all([fetchJSON(goldURL),fetchJSON(fxURL)]);
  if(gold.data_state?.status==='unavailable'||gold.data_state?.status==='stale'||fx.data_state?.status==='unavailable'||fx.data_state?.status==='stale')throw Error('Historische koers niet beschikbaar');
  const fxPoints=(fx.points||[]).map(p=>({t:Number(p.t),rate:Number(p.c)})).filter(p=>Number.isFinite(p.t)&&Number.isFinite(p.rate)&&p.rate>0).sort((a,b)=>a.t-b.t);
  const goldPoints=(gold.points||[]).map(p=>({t:Number(p.t),usd:Number(selected==='1d'?p.p:p.c)})).filter(p=>Number.isFinite(p.t)&&Number.isFinite(p.usd)&&p.usd>0).sort((a,b)=>a.t-b.t);
  if(fxPoints.length<2||goldPoints.length<2)throw Error('Onvoldoende gegevens');
  const maxGap=selected==='1d'?3600*3:selected==='5d'?3600*6:86400*4;
  let j=0;const converted=[];
  for(const p of goldPoints){while(j+1<fxPoints.length&&Math.abs(fxPoints[j+1].t-p.t)<=Math.abs(fxPoints[j].t-p.t))j++;if(Math.abs(fxPoints[j].t-p.t)>maxGap)continue;converted.push({t:p.t,p:p.usd/fxPoints[j].rate/31.1034768})}
  if(converted.length<2)throw Error('Geen betrouwbare EUR-omrekening');
  draw(converted);
 }catch(e){draw([]);if(message)message.textContent='Historische goudkoers in EUR per gram is tijdelijk niet beschikbaar. Er worden geen geschatte koersen getoond.'}
 }
 document.querySelectorAll('[data-chart-range]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.chartRange===selected)));
  try{
   const url=selected==='1d'?api+'intraday?symbol=xau&hours=24':api+'chart?symbol=xau&range='+selected+'&interval=1d';
   const d=await fetchJSON(url);
   if(d.data_state?.status==='unavailable'||d.data_state?.status==='stale')throw Error('Geen actuele historische reeks');
   const points=(d.points||[]).map(p=>({t:Number(p.t),p:Number(selected==='1d'?p.p:p.c)})).filter(p=>Number.isFinite(p.p)&&p.p>0).sort((a,b)=>a.t-b.t);
   draw(points);
  }catch(e){draw([])}
 }
 document.querySelectorAll('[data-chart-range]').forEach(b=>b.addEventListener('click',()=>{range=b.dataset.chartRange;loadChart(range)}));
 loadSpot();setInterval(loadSpot,60000);if(document.querySelector('[data-gold-chart]'))loadChart(range);
})();