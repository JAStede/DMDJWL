(()=>{'use strict';
const blocks=[...document.querySelectorAll('[data-silver-weight]')];if(!blocks.length)return;
const euro=new Intl.NumberFormat('nl-NL',{style:'currency',currency:'EUR',minimumFractionDigits:2,maximumFractionDigits:2});
const endpoint='https://xaus.com/api/v1/spot?currency=EUR&unit=gram&compact=1';
const OZ=31.1034768;
const setText=(root,selector,text)=>{const el=root.querySelector(selector);if(el)el.textContent=text};
let inFlight=false;
async function refresh(){
 if(inFlight)return;inFlight=true;
 try{
  const response=await fetch(endpoint,{cache:'no-store',headers:{'Accept':'application/json'}});
  if(!response.ok)throw Error('Koersdienst geeft HTTP '+response.status);
  const data=await response.json();
  const silver=Number(data.silver_usd_oz),fx=Number(data.fx_rate);
  const timestamp=Date.parse(data.updated_at);
  if(!Number.isFinite(silver)||silver<=0)throw Error('Geen zilverkoers ontvangen');
  if(!Number.isFinite(fx)||fx<=0||data.fx_stale===true)throw Error('Actuele EUR-wisselkoers ontbreekt');
  if(!Number.isFinite(timestamp)||Math.abs(Date.now()-timestamp)>5*60*1000)throw Error('Koersgegevens zijn verouderd');
  if(String(data.silver_source||'').toLowerCase().includes('last known good'))throw Error('Zilverkoers is verouderd');
  const gram=silver*fx/OZ;
  if(!Number.isFinite(gram)||gram<=0)throw Error('Omrekening mislukt');
  const updated=new Intl.DateTimeFormat('nl-NL',{dateStyle:'short',timeStyle:'short',timeZone:'Europe/Amsterdam'}).format(new Date(timestamp));
  blocks.forEach(b=>{
   const weight=Number(b.dataset.silverWeight),premium=Number(b.dataset.silverPremium),bond=b.dataset.silverBond==='true';
   const base=gram*weight,ex=base*(1+premium/100);
   setText(b,'[data-silver-price]',euro.format(ex)+(bond?' · vóór eventuele btw':' excl. btw'));
   setText(b,'[data-silver-base]',euro.format(base));
   setText(b,'[data-silver-status]','Spot '+euro.format(gram)+' / gram · bijgewerkt '+updated);
   if(!bond){setText(b,'[data-silver-vat]',euro.format(ex*.21));setText(b,'[data-silver-total]',euro.format(ex*1.21))}
  });
 }catch(error){
  blocks.forEach(b=>{
   setText(b,'[data-silver-price]','Prijs op aanvraag');
   setText(b,'[data-silver-base]','—');
   setText(b,'[data-silver-vat]','—');
   setText(b,'[data-silver-total]','—');
   setText(b,'[data-silver-status]','Live zilverkoers tijdelijk niet beschikbaar ('+error.message+').');
  });
 }finally{inFlight=false}
}
document.querySelectorAll('[data-silver-chart]').forEach(svg=>{svg.innerHTML='';const message=svg.parentElement?.querySelector('[data-silver-chart-status]');if(message)message.textContent='XAUS levert momenteel geen historische zilverreeks. De actuele zilverprijs hierboven wordt iedere minuut bijgewerkt wanneer de bron beschikbaar is.'});
refresh();setInterval(refresh,60000);
})();