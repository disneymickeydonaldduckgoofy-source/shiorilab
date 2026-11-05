const C='shiorilab-v3';
const CORE=['./','index.html','manifest.webmanifest','si1-32.png','si1-180.png','si1-192.png','si1-512.png','si1-512-maskable.png'];
const EXT=[
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://fonts.googleapis.com/css2?family=Zen+Maru+Gothic:wght@500;700;900&display=swap'
];
const FONT_CSS=EXT[2];
const EXT_HOSTS=['cdnjs.cloudflare.com','fonts.googleapis.com','fonts.gstatic.com'];
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(C).then(async c=>{
    await c.addAll(CORE);
    await Promise.all(EXT.map(u=>fetch(u,{mode:'cors'}).then(r=>{if(r.ok)return c.put(u,r)}).catch(()=>{})));
  }).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==C).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  const r=e.request;if(r.method!=='GET')return;
  const u=new URL(r.url);
  if(u.origin===location.origin){
    if(u.searchParams.has('vc'))return;
    e.respondWith(fetch(r).then(res=>{if(res.ok){const c=res.clone();caches.open(C).then(x=>x.put(r,c))}return res})
      .catch(()=>caches.match(r,{ignoreSearch:true}).then(m=>m||(r.mode==='navigate'?caches.match('index.html'):Response.error()))));
    return;
  }
  if(EXT_HOSTS.includes(u.hostname)){
    e.respondWith(caches.match(r.url).then(m=>m||fetch(r).then(res=>{if(res.ok||res.type==='opaque'){const c=res.clone();caches.open(C).then(x=>x.put(r.url,c))}return res})));
  }
});
async function warmFonts(){
  const c=await caches.open(C);if(await c.match('fonts-done'))return;
  const r=await c.match(FONT_CSS);if(!r)return;const css=await r.text();
  const urls=[],re=/\/\*([^*]*)\*\/\s*@font-face\s*\{([^}]*)\}/g;let m;
  while((m=re.exec(css))){const n=/\[(\d+)\]/.exec(m[1]),lat=/\blatin\b(?!-ext)/.test(m[1]),u=/url\(([^)]+)\)/.exec(m[2]);
    if(u&&((n&&+n[1]>=60)||(!n&&lat)))urls.push(u[1].replace(/['"]/g,''))}
  if(!urls.length)return;let ok=0;const q=urls.slice();
  await Promise.all(Array.from({length:6},async()=>{while(q.length){const x=q.shift();try{if(await c.match(x)){ok++;continue}const res=await fetch(x,{mode:'cors'});if(res.ok){await c.put(x,res);ok++}}catch(e){}}}));
  if(ok===urls.length)await c.put('fonts-done',new Response(String(ok)));
}
self.addEventListener('message',e=>{if(e.data&&e.data.t==='fonts')e.waitUntil(warmFonts())});
