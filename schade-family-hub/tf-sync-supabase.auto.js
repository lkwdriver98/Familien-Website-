// Add-on: Supabase Sync (geräteübergreifend)
(() => {
  // TODO: hier deine Supabase-Daten einsetzen:
  const SUPABASE_URL = 'https://dpikqjeyxdziekqlggao.supabase.co';
  const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwaWtxamV5eGR6aWVrcWxnZ2FvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0MTIxNzUsImV4cCI6MjA3Mjk4ODE3NX0.s7CMgU5YjYBGvfDrGNhtFOWMAhqZVUo0TB3wM2f73BY';

  const $ = (s,r=document)=>r.querySelector(s);
  let supa = null;

  function getFamily(){
    try{ const s=JSON.parse(localStorage.getItem('tf_settings_v3'))||{}; return s.familyName||'Schade'; }catch{return 'Schade';}
  }
  function injectUI(){
    const host = document.querySelector('header .max-w-6xl .flex.items-center.gap-2') || document.querySelector('header .max-w-6xl');
    if(!host) return;
    const wrap=document.createElement('div');
    wrap.className='flex items-center gap-2';
    wrap.innerHTML = `
      <button id="tf-sync-pull" class="btn btn-ghost text-sm">Sync → Pull</button>
      <button id="tf-sync-push" class="btn btn-primary text-sm">Sync → Push</button>
      <span id="tf-sync-status" class="text-xs text-slate-400"></span>
    `;
    host.appendChild(wrap);
  }
  function setStatus(t){ const el=$('#tf-sync-status'); if(el) el.textContent=t; }
  function init(){
    // supabase SDK via <script src="https://esm.sh/@supabase/supabase-js@2">
    // eslint-disable-next-line no-undef
    supa = supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
  }
  function collectAll(){
    const keys=['tf_settings_v3','tf_meals_v3','tf_shopping_v3','tf_chores_v3','tf_contacts_v3']; const out={};
    keys.forEach(k=>{ try{ out[k]=JSON.parse(localStorage.getItem(k)||'null'); }catch{ out[k]=null; } });
    return out;
  }
  async function pushAll(){
    const fam=getFamily(); const all=collectAll(); const rows=[];
    if(all.tf_settings_v3) rows.push({family:fam,bucket:'settings',key:null,data:all.tf_settings_v3});
    if(all.tf_meals_v3)    rows.push({family:fam,bucket:'meals',key:'all',data:all.tf_meals_v3});
    if(all.tf_shopping_v3) rows.push({family:fam,bucket:'shopping',key:'list',data:all.tf_shopping_v3});
    if(all.tf_chores_v3)   rows.push({family:fam,bucket:'chores',key:'list',data:all.tf_chores_v3});
    if(all.tf_contacts_v3) rows.push({family:fam,bucket:'contacts',key:'list',data:all.tf_contacts_v3});

    for (const r of rows) {
      await supa.from('fh_items').upsert({...r,updated_at:new Date().toISOString()}).select().then(()=>{}).catch(()=>{});
    }
    setStatus('Push OK');
  }
  async function pullAll(){
    const fam=getFamily();
    const { data, error } = await supa.from('fh_items').select('*').eq('family', fam);
    if(error){ setStatus('Pull Fehler'); return; }
    data.forEach(row=>{
      const d=row.data||{};
      if(row.bucket==='settings') localStorage.setItem('tf_settings_v3',JSON.stringify(d));
      if(row.bucket==='meals' && row.key==='all') localStorage.setItem('tf_meals_v3',JSON.stringify(d));
      if(row.bucket==='shopping') localStorage.setItem('tf_shopping_v3',JSON.stringify(d));
      if(row.bucket==='chores')   localStorage.setItem('tf_chores_v3',JSON.stringify(d));
      if(row.bucket==='contacts') localStorage.setItem('tf_contacts_v3',JSON.stringify(d));
    });
    setStatus('Pull OK – lade neu…'); setTimeout(()=>location.reload(),600);
  }
  function realtime(){
    const fam=getFamily();
    supa.channel('fh_changes')
      .on('postgres_changes',{event:'*',schema:'public',table:'fh_items',filter:`family=eq.${fam}`},()=>{
        setStatus('Änderung erkannt → Pull…');
        pullAll();
      }).subscribe();
  }
  function boot(){
    injectUI(); init(); realtime();
    document.getElementById('tf-sync-push')?.addEventListener('click', pushAll);
    document.getElementById('tf-sync-pull')?.addEventListener('click', pullAll);

    /* ► Optional: Auto-Sync ohne Klicks:
    pullAll();
    let _t; window.addEventListener('storage',()=>{ clearTimeout(_t); _t=setTimeout(pushAll,1000); });
    setInterval(pushAll,60000);
    */
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot();
})();
