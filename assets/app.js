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
