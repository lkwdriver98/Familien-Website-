// Add-on: Web Push + lokale Erinnerungen
(() => {
  // TODO: Eigene Server-Infos eintragen:
  const PUBLIC_VAPID  = 'BB9qyg8tvtP1R0SUwENxStOdRIcXI3yJo-niOb6mK9NkqWZp2J0EO5UGNBhWBeKpk3e7m3lMWsGfy4b-1qdgADQ';
  const SAVE_ENDPOINT = 'https://schade-family-push.onrender.com/save';
  const TEST_ENDPOINT = 'https://schade-family-push.onrender.com/test';

  const $ = (s,r=document)=>r.querySelector(s);

  async function registerSW(){
    if(!('serviceWorker' in navigator)) return null;
    // SW muss im Root liegen: /tf-pwa-sw.js
    return navigator.serviceWorker.register('/tf-pwa-sw.js');
  }
  async function ensurePermission(){
    if(!('Notification' in window)){ alert('Notifications werden nicht unterstützt.'); return false; }
    let p = Notification.permission;
    if(p==='default') p = await Notification.requestPermission();
    return p==='granted';
  }
  function urlBase64ToUint8Array(base64String){
    const padding='='.repeat((4-base64String.length%4)%4);
    const b64=(base64String+padding).replace(/-/g,'+').replace(/_/g,'/');
    const raw=atob(b64); const out=new Uint8Array(raw.length);
    for(let i=0;i<raw.length;i++) out[i]=raw.charCodeAt(i);
    return out;
  }
  async function subscribePush(){
    const reg=await registerSW(); if(!reg){ alert('Service Worker nicht verfügbar.'); return; }
    const ok=await ensurePermission(); if(!ok){ alert('Bitte Benachrichtigungen erlauben.'); return; }
    const sub=await reg.pushManager.subscribe({ userVisibleOnly:true, applicationServerKey:urlBase64ToUint8Array(PUBLIC_VAPID) });
    await fetch(SAVE_ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(sub)});
    alert('Push-Abo gespeichert ✅');
  }
  function notifyLocal(title, body){
    if(Notification.permission!=='granted') return;
    new Notification(title,{ body });
  }

  function injectUI(){
    const host=document.querySelector('header .max-w-6xl .flex.items-center.gap-2')||document.querySelector('header .max-w-6xl');
    if(!host) return;
    const wrap=document.createElement('div'); wrap.className='flex items-center gap-2';
    wrap.innerHTML = `
      <button id="tf-push-sub"  class="btn btn-ghost text-sm">Push aktivieren</button>
      <button id="tf-push-test" class="btn btn-ghost text-sm">Test-Push</button>
      <button id="tf-local-nudge" class="btn btn-ghost text-sm">Lokale Erinnerung</button>
    `;
    host.appendChild(wrap);
    $('#tf-push-sub').addEventListener('click', subscribePush);
    $('#tf-push-test').addEventListener('click', async ()=>{
      try { await fetch(TEST_ENDPOINT,{method:'POST'}); alert('Test-Push gesendet.'); }
      catch { alert('Test-Push fehlgeschlagen.'); }
    });
    $('#tf-local-nudge').addEventListener('click', async ()=>{
      const ok=await ensurePermission(); if(!ok) return;
      notifyLocal('Einkauf','Denk an die Einkaufsliste 🛒');
    });
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',injectUI); else injectUI();
})();

