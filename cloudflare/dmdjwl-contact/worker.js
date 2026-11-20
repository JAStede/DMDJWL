import { EmailMessage } from "cloudflare:email";
const allowed = new Set(["https://jastede.github.io","https://dmdjwl.pages.dev"]); // Add verified production origins before deployment.
const json = (data,status=200,origin="") => new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json; charset=utf-8",...(allowed.has(origin)?{"access-control-allow-origin":origin,"vary":"Origin"}:{})}});
const clean = (v,max=2000) => String(v??"").trim().slice(0,max);
const validEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
export default {async fetch(request,env){
 const origin=request.headers.get("Origin")||"";
 if(request.method==="OPTIONS") return allowed.has(origin)?new Response(null,{status:204,headers:{"access-control-allow-origin":origin,"access-control-allow-methods":"POST, OPTIONS","access-control-allow-headers":"Content-Type","access-control-max-age":"600"}}):new Response(null,{status:403});
 if(request.method!=="POST")return json({ok:false,error:"Methode niet toegestaan"},405,origin);
 if(!allowed.has(origin))return json({ok:false,error:"Herkomst niet toegestaan"},403,origin);
 if(Number(request.headers.get("content-length")||0)>12000)return json({ok:false,error:"Aanvraag te groot"},413,origin);
 let data;try{data=await request.json()}catch{return json({ok:false,error:"Ongeldige aanvraag"},400,origin)}
 if(data.website||data._honey)return json({ok:true},200,origin);
 const naam=clean(data.naam,120),email=clean(data.email,180),product=clean(data.product,120),bericht=clean(data.bericht,3000),locatie=clean(data.locatie,120),plaats=clean(data.plaats,120);
 if(naam.length<2||!validEmail(email)||!product||bericht.length<5||!data.privacy)return json({ok:false,error:"Controleer de verplichte velden"},400,origin);
 if(!env.DB||!env.SEND_EMAIL||!env.FROM_EMAIL||!env.TO_EMAIL)return json({ok:false,error:"Verzenddienst nog niet ingesteld"},503,origin);
 const key=email.toLowerCase();
 try{
  const since=new Date(Date.now()-86400000).toISOString();
  const count=await env.DB.prepare("SELECT COUNT(*) AS n FROM requests WHERE email = ? AND created_at > ?").bind(key,since).first();
  if((count?.n||0)>=3)return json({ok:false,error:"Te veel aanvragen. Probeer het later opnieuw."},429,origin);
  const result=await env.DB.prepare("INSERT INTO requests (email,naam,product,bericht,locatie,plaats,status) VALUES (?,?,?,?,?,?,?)").bind(key,naam,product,bericht,locatie,plaats,"pending").run();
  const id=result.meta.last_row_id;
  const safe=s=>s.replace(/[\r\n]/g," ");
  const body=[`Aanvraag #${id}`,`Naam: ${naam}`,`E-mail: ${email}`,`Product: ${product}`,`Afspraak: ${locatie}`,`Plaats: ${plaats}`,"",bericht].join("\r\n");
  const mime=`From: DMD JWL <${safe(env.FROM_EMAIL)}>\r\nTo: <${safe(env.TO_EMAIL)}>\r\nSubject: DMD JWL offerteaanvraag #${id}\r\nReply-To: <${safe(email)}>\r\nMIME-Version: 1.0\r\nContent-Type: text/plain; charset=UTF-8\r\n\r\n${body}`;
  try{await env.SEND_EMAIL.send(new EmailMessage(env.FROM_EMAIL,env.TO_EMAIL,mime));await env.DB.prepare("UPDATE requests SET status='sent' WHERE id=?").bind(id).run();return json({ok:true,reference:id},200,origin)}
  catch(err){console.error("Email send failed",err);return json({ok:false,error:"Aanvraag opgeslagen maar e-mail niet verzonden. Neem contact op met DMD JWL."},502,origin)}
 }catch(err){console.error("Request processing failed",err);return json({ok:false,error:"Tijdelijke technische fout"},500,origin)}
}};