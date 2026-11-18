(function(){
 const cards=[...document.querySelectorAll('[data-gold-weight]')];if(!cards.length)return;
 const euro=new Intl.NumberFormat('nl-NL',{style:'currency',currency:'EUR'}),usd=new Intl.NumberFormat('nl-NL',{style:'currency',currency:'USD',maximumFractionDigits:0});
 const api='https://xaus.com/api/v1/';
 let spot=null,series=[],range='1d';
 const isFresh=d=>d&&d.data_state?.status==='fresh'&&d.stale!==true&&d.fx_stale!==true&&d.xau?.currency==='EUR'&&d.xau?.unit==='gram'&&Number(d.xau.price)>0&&Number.isFinite(Date.parse(d.price_as_of||d.data_state.as_of))&&Math.abs(Date.now()-Date.parse(d.price_as_of||d.data_state.as_of))<300000;
 async function fetchJSON(url){const r=await fetch(url,{cache:'no-store'});if(!r.ok)throw Error('Koersdienst niet beschikbaar');return r.json()}
 function setPrices(){
  cards.forEach(card=>{const w=Number(card.dataset.goldWeight),premium=Number(card.dataset.goldPremium||2),el=card.querySelector('[data-live-price]'),base=card.querySelector('[data-spot-value]');if(!el)return;
   if(!spot){el.textContent='Prijs op aanvraag';if(base)base.textContent='Koers tijdelijk niet beschikbaar';return}
   const value=spot.xau.price*w,asking=value*(1+premium/100);
   el.textContent=euro.format(asking);if(base)base.textContent='Goudwaarde '+euro.format(value)+' · + '+premium+'% premie';
  });
  const stamp=document.querySelector('[data-gold-timestamp]');if(stamp)stamp.textContent=spot?'Indicatie · '+new Intl.DateTimeFormat('nl-NL',{dateStyle:'short',timeStyle:'short',timeZone:'Europe/Amsterdam'}).format(new Date(spot.price_as_of||spot.data_state.as_of)):'Geen actuele koers beschikbaar';
 }
 async function loadSpot(){try{const d=await fetchJSON(api+'spot?currency=EUR&unit=gram&compact=1');spot=isFresh(d)?d:null}catch(e){spot=null}setPrices()}
 function draw(points){
  const svg=document.querySelector('[data-gold-chart]'),message=document.querySelector('[data-chart-message]');if(!svg)return;
  if(points.length<2){svg.innerHTML='';if(message)message.textContent='Voor deze periode zijn momenteel geen koersgegevens beschikbaar.';return}
  const vals=points.map(p=>p.p),min=Math.min(...vals),max=Math.max(...vals),pad=Math.max((max-min)*.12,1),lo=min-pad,hi=max+pad;
  const x=i=>40+(i/(points.length-1))*720,y=v=>210-(v-lo)/(hi-lo)*170;
  const line=points.map((p,i)=>(i?'L':'M')+x(i).toFixed(1)+' '+y(p.p).toFixed(1)).join(' ');
  const grid=[0,1,2,3].map(i=>{const v=lo+(hi-lo)*i,yy=y(v);return '<line x1="40" y1="'+yy+'" x2="760" y2="'+yy+'" stroke="#d9e1d8"/><text x="4" y="'+(yy+4)+'" font-size="11" fill="#52645b">'+Math.round(v)+'</text>'}).join('');
  svg.setAttribute('viewBox','0 0 780 230');svg.setAttribute('role','img');svg.setAttribute('aria-label','Historische goudkoers in Amerikaanse dollars per troy ounce');
  svg.innerHTML=grid+'<path d="'+line+'" fill="none" stroke="#a88140" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>';
  if(message)message.textContent='Historische goudkoers in USD per troy ounce · bron XAUS. De verkoopprijzen hierboven zijn indicatief in EUR.';
 }
 async function loadChart(selected){
  const message=document.querySelector('[data-chart-message]');if(message)message.textContent='Grafiek laden…';
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