const slides=[...document.querySelectorAll('.slide')],dots=[...document.querySelectorAll('.dots button')];let current=0;function showSlide(n){if(!slides.length)return;current=(n+slides.length)%slides.length;slides.forEach((s,i)=>{s.classList.toggle('active',i===current);s.setAttribute('aria-hidden',String(i!==current))});dots.forEach((d,i)=>{d.classList.toggle('active',i===current);d.setAttribute('aria-label','Toon afbeelding '+(i+1))})}dots.forEach((d,i)=>d.addEventListener('click',()=>showSlide(i)));if(slides.length){showSlide(0);setInterval(()=>showSlide(current+1),6000)}document.querySelector('.menu')?.addEventListener('click',()=>{const el=document.querySelector('.mobile-nav');const open=el.classList.toggle('open');document.querySelector('.menu').setAttribute('aria-expanded',String(open))});
/* Entire product card is accessible without intercepting its CTA. */
document.querySelectorAll('.product').forEach(card=>{
 const link=card.querySelector('a[href]');
 if(!link)return;
 card.classList.add('clickable-card');
 card.setAttribute('tabindex','0');
 card.setAttribute('role','link');
 card.setAttribute('aria-label',card.querySelector('h3')?.textContent?.trim()+' — bekijken');
 card.addEventListener('click',event=>{if(event.target.closest('a,button,input,select'))return;window.location.assign(link.href)});
 card.addEventListener('keydown',event=>{if(event.target!==card)return;if(event.key==='Enter'||event.key===' '){event.preventDefault();window.location.assign(link.href)}});
});

/* Indicative EUR gold spot ticker; never invent a price on API failure. */
(function(){
 const header=document.querySelector('.top');if(!header)return;
 const bar=document.createElement('div');bar.className='gold-ticker';bar.setAttribute('role','status');
 bar.innerHTML='<span>GOUDKOERS (INDICATIEF)</span> <strong id="site-gold-gram">Koers laden…</strong> <span id="site-gold-time"></span>';
 header.insertAdjacentElement('afterend',bar);
 const value=document.getElementById('site-gold-gram'),time=document.getElementById('site-gold-time');
 const euro=new Intl.NumberFormat('nl-NL',{style:'currency',currency:'EUR'});
 async function refresh(){
  try{
   const res=await fetch('https://xaus.com/api/v1/spot?currency=EUR&unit=gram&compact=1',{cache:'no-store'});
   if(!res.ok)throw Error('Unavailable');
   const d=await res.json(),price=Number(d?.xau?.price),asof=new Date(d?.price_as_of||d?.data_state?.as_of||d?.updated_at);
   if(d?.xau?.currency!=='EUR'||d?.xau?.unit!=='gram'||d?.stale===true||d?.data_state?.status==='stale'||!Number.isFinite(price)||price<=0||!Number.isFinite(asof.getTime())||Math.abs(Date.now()-asof.getTime())>300000)throw Error('Stale');
   value.textContent=euro.format(price)+' / gram';
   time.textContent='Bijgewerkt '+new Intl.DateTimeFormat('nl-NL',{hour:'2-digit',minute:'2-digit',timeZone:'Europe/Amsterdam'}).format(asof);
  }catch(e){value.textContent='Koers tijdelijk niet beschikbaar';time.textContent='Prijs op aanvraag'}
 }
 refresh();setInterval(refresh,60000);
})();


/* Accessible click-to-enlarge product photography */
(()=>{
 const images=[...document.querySelectorAll('img.product-zoomable')];
 if(!images.length)return;
 const overlay=document.createElement('div');
 overlay.className='product-lightbox';overlay.hidden=true;
 overlay.innerHTML='<button type="button" class="product-lightbox-close" aria-label="Sluit afbeelding">×</button><img alt=""><p>Druk op Esc of klik buiten de afbeelding om te sluiten</p>';
 document.body.appendChild(overlay);
 const enlarged=overlay.querySelector('img'),close=()=>{overlay.hidden=true;document.body.style.overflow='';enlarged.removeAttribute('src');};
 images.forEach(img=>{img.tabIndex=0;img.setAttribute('role','button');img.setAttribute('aria-label',(img.alt||'Productfoto')+' vergroten');const open=()=>{enlarged.src=img.currentSrc||img.src;enlarged.alt=img.alt;overlay.hidden=false;document.body.style.overflow='hidden';overlay.querySelector('button').focus()};img.addEventListener('click',open);img.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open()}})});
 overlay.addEventListener('click',e=>{if(e.target===overlay||e.target.closest('.product-lightbox-close'))close()});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!overlay.hidden)close()});
})();
