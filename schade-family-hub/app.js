// TechFlair Family Hub – Admin/User

const STORAGE = {
  settings: "tf_settings_v3",
  meals: "tf_meals_v3",
  shopping: "tf_shopping_v3",
  chores: "tf_chores_v3",
  contacts: "tf_contacts_v3",
  role: "tf_role_v1",
};

const state = {
  settings: {
    familyName: "Schade",
    calendarId: "",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Berlin",
    compact: false,
    adminPin: "1234",
  },
  isAdmin: false,
  weekStart: startOfWeek(new Date()),
  meals: {},
  shopping: [],
  chores: [],
  contacts: [],
};

// --- Helper ---
function uid(){ return Math.random().toString(36).slice(2)+Date.now().toString(36); }
function startOfWeek(date){ const d=new Date(date); const day=(d.getDay()+6)%7; d.setDate(d.getDate()-day); d.setHours(0,0,0,0); return d; }
function addDays(d,n){ const c=new Date(d); c.setDate(c.getDate()+n); return c; }
function isoDate(d){ return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10); }
function escapeHtml(s){ return String(s||"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;"); }
const DAYS=["Mo","Di","Mi","Do","Fr","Sa","So"];

function openDlg(id){ const el=document.getElementById(id); if(typeof el.showModal==="function") el.showModal(); else el.setAttribute("open",""); }
function closeDlg(id){ const el=document.getElementById(id); if(typeof el.close==="function") el.close(); else el.removeAttribute("open"); }

// --- Load persisted ---
for (const key of ["settings","meals","shopping","chores","contacts"]) {
  try {
    const raw = localStorage.getItem(STORAGE[key]);
    if (!raw) continue;
    const parsed = JSON.parse(raw);
    state[key] = parsed || state[key];
  } catch {}
}
try {
  const rawRole = localStorage.getItem(STORAGE.role);
  if (rawRole) state.isAdmin = !!JSON.parse(rawRole).isAdmin;
} catch {}
document.getElementById("year").textContent = new Date().getFullYear();

// --- Role ---
function renderRoleUI(){
  const badge = document.getElementById("roleBadge");
  const btn = document.getElementById("roleBtn");
  badge.textContent = state.isAdmin ? "Modus: Admin" : "Modus: Benutzer";
  btn.textContent = state.isAdmin ? "Admin abmelden" : "Als Admin anmelden";
  document.getElementById("shoppingAddRow").classList.toggle("hidden", !state.isAdmin);
  document.getElementById("choreAddRow").classList.toggle("hidden", !state.isAdmin);
  document.getElementById("contactEditor").classList.toggle("hidden", !state.isAdmin);
  document.getElementById("openSettings").classList.toggle("opacity-50", !state.isAdmin);
}
document.getElementById("roleBtn").addEventListener("click", ()=>{
  if (state.isAdmin) {
    state.isAdmin = false;
    localStorage.setItem(STORAGE.role, JSON.stringify({ isAdmin:false }));
    renderRoleUI(); renderAll();
  } else {
    openDlg("adminDlg");
  }
});
document.getElementById("aCancel").addEventListener("click", ()=>closeDlg("adminDlg"));
document.getElementById("aLogin").addEventListener("click", ()=>{
  const pin = (document.getElementById("loginPin").value || "").trim();
  if (pin && pin === state.settings.adminPin) {
    state.isAdmin = true;
    localStorage.setItem(STORAGE.role, JSON.stringify({ isAdmin:true }));
    closeDlg("adminDlg");
    renderRoleUI(); renderAll();
  } else {
    alert("Falsche PIN.");
  }
});

// --- Settings ---
function openSettings(){
  if (!state.isAdmin) { openDlg("adminDlg"); return; }
  document.getElementById("sFamily").value = state.settings.familyName;
  document.getElementById("sCalendar").value = state.settings.calendarId;
  document.getElementById("sTZ").value = state.settings.timezone;
  document.getElementById("sCompact").checked = state.settings.compact;
  document.getElementById("sAdminPin").value = state.settings.adminPin;
  openDlg("settingsDlg");
}
function saveSettings(){
  state.settings.familyName = document.getElementById("sFamily").value || "Schade";
  state.settings.calendarId = document.getElementById("sCalendar").value.trim();
  state.settings.timezone = document.getElementById("sTZ").value || "Europe/Berlin";
  state.settings.compact = document.getElementById("sCompact").checked;
  const pin = document.getElementById("sAdminPin").value.trim();
  if (pin && pin.length>=4 && pin.length<=12) state.settings.adminPin = pin;
  localStorage.setItem(STORAGE.settings, JSON.stringify(state.settings));
  applySettings(); renderCalendar(); closeDlg("settingsDlg");
}
function applySettings(){
  document.getElementById("heroFamily").textContent = state.settings.familyName;
  document.body.classList.toggle("text-sm", state.settings.compact);
}
document.getElementById("openSettings").addEventListener("click", openSettings);
document.getElementById("sSave").addEventListener("click", saveSettings);
document.getElementById("sCancel").addEventListener("click", ()=>closeDlg("settingsDlg"));

// --- Kalender ---
function renderCalendar(){
  const link = document.getElementById("calendarLink");
  const embed = document.getElementById("calendarEmbed");
  const id = state.settings.calendarId;
  if(!id){
    link.classList.add("hidden");
    embed.innerHTML = '<div>Füge die <b>Google Kalender ID</b> in den Einstellungen hinzu.</div>';
    return;
  }
  const tz = encodeURIComponent(state.settings.timezone);
  const cid = encodeURIComponent(id);
  link.href = `https://calendar.google.com/calendar/embed?src=${cid}&ctz=${tz}`;
  link.classList.remove("hidden");
  embed.innerHTML = `<iframe src="https://calendar.google.com/calendar/embed?height=600&wkst=2&bgcolor=%23000000&ctz=${tz}&src=${cid}" class="w-full h-full"></iframe>`;
}

// --- Essen ---
document.getElementById("prevWeek").addEventListener("click", ()=>{ state.weekStart = addDays(state.weekStart,-7); renderMeals(); });
document.getElementById("nextWeek").addEventListener("click", ()=>{ state.weekStart = addDays(state.weekStart, 7); renderMeals(); });
function renderMeals(){
  const weekKey = isoDate(state.weekStart);
  document.getElementById("weekLabel").textContent = `Woche ab ${weekKey}`;
  const plan = state.meals[weekKey] || {};
  const grid = document.getElementById("mealGrid"); grid.innerHTML = "";
  for(let i=0;i<7;i++){
    const dayPlan = plan[i] || {breakfast:"",lunch:"",dinner:""};
    const disabled = state.isAdmin ? "" : "disabled";
    const box = document.createElement("div"); box.className = "grid grid-cols-[46px_1fr] gap-2";
    box.innerHTML = `
      <div class="pt-2 text-slate-400">${DAYS[i]}</div>
      <div class="grid gap-2">
        <input ${disabled} data-day="${i}" data-field="breakfast" class="input" placeholder="Frühstück" value="${escapeHtml(dayPlan.breakfast)}" />
        <input ${disabled} data-day="${i}" data-field="lunch" class="input" placeholder="Mittag" value="${escapeHtml(dayPlan.lunch)}" />
        <input ${disabled} data-day="${i}" data-field="dinner" class="input" placeholder="Abendessen" value="${escapeHtml(dayPlan.dinner)}" />
      </div>`;
    grid.appendChild(box);
  }
  if (state.isAdmin) {
    grid.querySelectorAll("input").forEach(inp => inp.addEventListener("change", e => {
      const idx = +e.target.dataset.day, field = e.target.dataset.field, value = e.target.value;
      const key = isoDate(state.weekStart);
      const wk = state.meals[key] ? {...state.meals[key]} : {};
      const d = wk[idx] ? {...wk[idx]} : {breakfast:"",lunch:"",dinner:""};
      d[field] = value; wk[idx] = d; state.meals[key] = wk;
      localStorage.setItem(STORAGE.meals, JSON.stringify(state.meals));
    }));
  }
}

// --- Einkauf ---
function renderShopping(){
  const list = document.getElementById("shoppingList"); list.innerHTML = "";
  state.shopping.forEach(item => {
    const li = document.createElement("li"); li.className = "flex justify-between p-2 border border-slate-800 rounded-xl";
    const delBtn = state.isAdmin ? `<button class="btn btn-ghost">Löschen</button>` : "";
    li.innerHTML = `<label class="flex items-center gap-2"><input type="checkbox" ${item.done?"checked":""}><span class="${item.done?"line-through":""}">${escapeHtml(item.text)}</span></label>${delBtn}`;
    li.querySelector("input").addEventListener("change", ()=>{ item.done = !item.done; localStorage.setItem(STORAGE.shopping, JSON.stringify(state.shopping)); renderShopping(); });
    if (state.isAdmin) li.querySelector("button").addEventListener("click", ()=>{ state.shopping = state.shopping.filter(x=>x!==item); localStorage.setItem(STORAGE.shopping, JSON.stringify(state.shopping)); renderShopping(); });
    list.appendChild(li);
  });
}
document.getElementById("shoppingAdd").addEventListener("click", ()=>{
  if (!state.isAdmin) return;
  const val=document.getElementById("shoppingInput").value.trim(); if(!val) return;
  state.shopping.push({ id: uid(), text: val, done:false }); localStorage.setItem(STORAGE.shopping, JSON.stringify(state.shopping));
  document.getElementById("shoppingInput").value=""; renderShopping();
});

// --- Aufgaben ---
function renderChores(){
  const list = document.getElementById("choreList"); list.innerHTML = "";
  state.chores.forEach(ch => {
    const li = document.createElement("li"); li.className = "flex justify-between p-2 border border-slate-800 rounded-xl";
    li.innerHTML = `<label class="flex items-center gap-2"><input type="checkbox" ${ch.done?"checked":""}><span class="${ch.done?"line-through":""}">${escapeHtml(ch.text)}</span></label>`;
    li.querySelector("input").addEventListener("change", ()=>{ ch.done = !ch.done; localStorage.setItem(STORAGE.chores, JSON.stringify(state.chores)); renderChores(); });
    list.appendChild(li);
  });
}
document.getElementById("choreAdd").addEventListener("click", ()=>{
  if (!state.isAdmin) return;
  const val=document.getElementById("choreInput").value.trim(); if(!val) return;
  state.chores.push({ id: uid(), text: val, done:false }); localStorage.setItem(STORAGE.chores, JSON.stringify(state.chores));
  document.getElementById("choreInput").value=""; renderChores();
});

// --- Kontakte ---
function renderContacts(){
  const grid = document.getElementById("contactGrid"); grid.innerHTML = "";
  state.contacts.forEach(c => {
    const card = document.createElement("div"); card.className = "card p-3";
    card.innerHTML = `
      <div class="font-medium">${escapeHtml(c.name)}</div>
      <div class="text-slate-400">${escapeHtml(c.role||"")}</div>
      <div class="text-sm">${c.phone||""}</div>
      <div class="text-sm">${c.email||""}</div>
      ${state.isAdmin?'<button class="btn btn-ghost mt-2" data-del>Löschen</button>':""}`;
    if(state.isAdmin) card.querySelector("[data-del]").addEventListener("click", ()=>{ state.contacts = state.contacts.filter(x=>x!==c); localStorage.setItem(STORAGE.contacts, JSON.stringify(state.contacts)); renderContacts(); });
    grid.appendChild(card);
  });
}
document.getElementById("contactAdd").addEventListener("click", ()=>{
  if (!state.isAdmin) return;
  const name = document.getElementById("cName").value.trim(); if(!name) return;
  const role = document.getElementById("cRole").value.trim();
  const phone = document.getElementById("cPhone").value.trim();
  const email = document.getElementById("cEmail").value.trim();
  state.contacts.push({ id: uid(), name, role, phone, email });
  localStorage.setItem(STORAGE.contacts, JSON.stringify(state.contacts));
  document.getElementById("cName").value = "";
  document.getElementById("cRole").value = "";
  document.getElementById("cPhone").value = "";
  document.getElementById("cEmail").value = "";
  renderContacts();
});

// --- Render all ---
function renderAll(){ applySettings(); renderCalendar(); renderMeals(); renderShopping(); renderChores(); renderContacts(); }
renderRoleUI(); renderAll();
