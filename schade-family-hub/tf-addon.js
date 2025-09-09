// TechFlair Add-on: Theme (Light/Dark) + Export/Import + Print
(() => {
  const LS_THEME_KEY = "tf_theme", PREFIX="tf_";
  const $ = (s,r=document)=>r.querySelector(s);
  const el=(t,p={})=>Object.assign(document.createElement(t),p);
  const on=(n,e,f)=>n&&n.addEventListener(e,f);

  function currentTheme(){ return localStorage.getItem(LS_THEME_KEY)||"dark"; }
  function ensureStyle(){
    if ($('#tf-theme-style')) return;
    const style = el('style',{id:'tf-theme-style'});
    style.textContent = `
      :root { --bg:#0b1220; --card:#0f172a; --border:#1f2937; --text:#e5e7eb; --primary:#2563eb; --primary-hover:#1d4ed8; --chip1:rgba(34,211,238,.15); --chip2:rgba(59,130,246,.15); --chipb:rgba(59,130,246,.25);}
      [data-theme="light"] { --bg:#f8fafc; --card:#ffffff; --border:#e2e8f0; --text:#0f172a; --primary:#2563eb; --primary-hover:#1d4ed8; --chip1:rgba(34,211,238,.15); --chip2:rgba(59,130,246,.15); --chipb:rgba(59,130,246,.25);}
      html,body{ background:var(--bg)!important; color:var(--text)!important;}
      .card{ background:var(--card)!important; border-color:var(--border)!important;}
      .input{ background:var(--bg)!important; border-color:var(--border)!important; color:var(--text)!important;}
      .btn-primary{ background:var(--primary)!important;} .btn-primary:hover{ background:var(--primary-hover)!important;}
      .btn-ghost{ background:var(--bg)!important; border-color:var(--border)!important;}
    `;
    document.head.appendChild(style);
  }
  function applyTheme(t){ document.documentElement.dataset.theme=t; localStorage.setItem(LS_THEME_KEY,t); ensureStyle(); }

  function getAll(){ const d={}; for(let i=0;i<localStorage.length;i++){ const k=localStorage.key(i); if(k&&k.startsWith(PREFIX)){ try{d[k]=JSON.parse(localStorage.getItem(k))}catch{d[k]=localStorage.getItem(k)} } } return d; }
  function importAll(obj){ Object.entries(obj||{}).forEach(([k,v])=>{ if(!k.startsWith(PREFIX))return; try{localStorage.setItem(k,JSON.stringify(v))}catch{localStorage.setItem(k,String(v))} }); }

  function buildBar(){
    const host = document.querySelector('header .max-w-6xl .flex.items-center.gap-2') || document.querySelector('header .max-w-6xl');
    if(!host) return;
    const bar = el('div',{className:'flex items-center gap-2'});
    const themeBtn = el('button',{className:'btn btn-ghost text-sm',textContent:'Light/Dark'});
    const exportBtn= el('button',{className:'btn btn-ghost text-sm',textContent:'Export'});
    const importBtn= el('button',{className:'btn btn-ghost text-sm',textContent:'Import'});
    const file = el('input',{type:'file',accept:'application/json',className:'hidden'});
    const printBtn = el('button',{className:'btn btn-ghost text-sm',textContent:'Drucken'});

    bar.append(themeBtn,exportBtn,importBtn,file,printBtn); host.appendChild(bar);

    on(themeBtn,'click',()=>applyTheme(currentTheme()==='dark'?'light':'dark'));
    on(exportBtn,'click',()=>{
      const data=getAll(); const stamp=new Date().toISOString().replace(/[:.]/g,'-');
      const a=el('a',{href:URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'})),download:`familyhub-backup-${stamp}.json`});
      document.body.appendChild(a); a.click(); a.remove();
    });
    on(importBtn,'click',()=>file.click());
    on(file,'change',async e=>{
      const f=e.target.files?.[0]; if(!f) return;
      try{ const txt=await f.text(); importAll(JSON.parse(txt)); alert('Import OK – lade neu'); location.reload(); }
      catch{ alert('Import fehlgeschlagen'); }
    });
    on(printBtn,'click',()=>{
      const s=el('style',{id:'tf-print-style'});
      s.textContent='@media print{header,footer,#contactEditor,#shoppingAddRow,#choreAddRow,dialog{display:none!important}.card{break-inside:avoid} body{background:white!important;color:black!important}}';
      document.head.appendChild(s); window.print(); setTimeout(()=>s.remove(),1000);
    });
  }

  function boot(){ applyTheme(currentTheme()); buildBar(); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot();
})();
