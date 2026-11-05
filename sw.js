const C='shiorilab-v2';
const CORE=['./','index.html','manifest.webmanifest','si1-32.png','si1-180.png','si1-192.png','si1-512.png','si1-512-maskable.png'];
const EXT=[
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://fonts.googleapis.com/css2?family=Zen+Maru+Gothic:wght@500;700;900&display=swap'
];
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
    e.respondWith(fetch(r).then(res=>{if(res.ok){const c=res.clone();caches.open(C).then(x=>x.put(r,c))}return res})
      .catch(()=>caches.match(r,{ignoreSearch:true}).then(m=>m||(r.mode==='navigate'?caches.match('index.html'):Response.error()))));
    return;
  }
  if(EXT_HOSTS.includes(u.hostname)){
    e.respondWith(caches.match(r.url).then(m=>m||fetch(r).then(res=>{if(res.ok||res.type==='opaque'){const c=res.clone();caches.open(C).then(x=>x.put(r.url,c))}return res})));
  }
});
