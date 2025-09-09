// TechFlair Family Hub - vanilla JS (localStorage based)
const STORAGE = {
  settings: "tf_settings_v1",
  meals: "tf_meals_v1",
  shopping: "tf_shopping_v1",
  chores: "tf_chores_v1",
  contacts: "tf_contacts_v1",
};

// State
const state = {
  settings: {
    familyName: "Familie",
    calendarId: "",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Berlin",
    compact: false,
  },
  weekStart: startOfWeek(new Date()),
  meals: {}, // {weekKey: {0..6: {breakfast,lunch,dinner}}}
  shopping: [],
  chores: [{ id: uid(), text: "Müll rausbringen", done: false }],
  contacts: [],
};

// Utils
function uid(){ return Math.random().toString(36).slice(2)+Date.now().toString(36); }
function startOfWeek(date){
  const d = new Date(date);
  const day = (d.getDay()+6)%7; // Mon=0
  d.setDate(d.getDate()-day); d.setHours(0,0,0,0);
  return d;
}
function addDays(d,n){ const c = new Date(d); c.setDate(c.getDate()+n); return c; }
function isoDate(d){ return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10); }
const DAYS = ["Mo","Di","Mi","Do","Fr","Sa","So"];

// Load from localStorage
for (const key of Object.keys(STORAGE)) {
  try {
    const raw = localStorage.getItem(STORAGE[key]);
    if (!raw) continue;
    const data = JSON.parse(raw);
    if (key === "settings") state.settings = { ...state.settings, ...data };
    else state[key] = data;
  } catch {}
}
document.getElementById("year").textContent = new Date().getFullYear();

// Settings UI
function openSettings(){ document.getElementById("settingsDlg").showModal(); bindSettingsInputs(); }
function bindSettingsInputs(){
  const s = state.settings;
  document.getElementById("sFamily").value = s.familyName;
  document.getElementById("sCalendar").value = s.calendarId;
  document.getElementById("sTZ").value = s.timezone;
  document.getElementById("sCompact").checked = s.compact;
}
function saveSettings(){
  state.settings.familyName = document.getElementById("sFamily").value || "Familie";
  state.settings.calendarId = document.getElementById("sCalendar").value.trim();
  state.settings.timezone = document.getElementById("sTZ").value || "Europe/Berlin";
  state.settings.compact = document.getElementById("sCompact").checked;
  localStorage.setItem(STORAGE.settings, JSON.stringify(state.settings));
  applySettings();
  renderCalendar();
  document.getElementById("settingsDlg").close();
}
function applySettings(){
  document.getElementById("heroFamily").textContent = state.settings.familyName;
  document.body.classList.toggle("text-sm", state.settings.compact);
}
document.getElementById("openSettings").addEventListener("click", openSettings);
document.getElementById("sSave").addEventListener("click", saveSettings);
document.getElementById("sCancel").addEventListener("click", ()=>document.getElementById("settingsDlg").close());

// Tabs
let currentTab = "planner";
const tabs = document.querySelectorAll(".tab");
tabs.forEach(btn => btn.addEventListener("click", () => {
  currentTab = btn.dataset.tab;
  tabs.forEach(b=> b.classList.toggle("ring-2", b===btn));
  // (simple highlight only; content is always visible in this single-page layout)
}));

// Calendar
function renderCalendar(){
  const link = document.getElementById("calendarLink");
  const embed = document.getElementById("calendarEmbed");
  const id = state.settings.calendarId;
  if(!id){
    link.classList.add("hidden");
    embed.innerHTML = '<div>Trage die <b>Google Kalender ID</b> in den Einstellungen ein.</div>';
    return;
  }
  const tz = encodeURIComponent(state.settings.timezone);
  const cid = encodeURIComponent(id);
  link.href = `https://calendar.google.com/calendar/embed?src=${cid}&ctz=${tz}`;
  link.classList.remove("hidden");
  embed.innerHTML = `<iframe src="https://calendar.google.com/calendar/embed?height=600&wkst=2&bgcolor=%23000000&ctz=${tz}&src=${cid}" class="w-full h-full" title="Google Calendar"></iframe>`;
}

// Meal Planner
function renderMeals(){
  const weekKey = isoDate(state.weekStart);
  const monday = state.weekStart;
  const label = new Intl.DateTimeFormat("de-DE", { day:"2-digit", month:"2-digit" }).format(monday);
  document.getElementById("weekLabel").textContent = `Woche ab ${label}`;
  const plan = state.meals[weekKey] || {};
  const grid = document.getElementById("mealGrid");
  grid.innerHTML = "";
  for(let i=0;i<7;i++){
    const dayPlan = plan[i] || {breakfast:"", lunch:"", dinner:""};
    const box = document.createElement("div");
    box.className = "grid grid-cols-[46px_1fr] gap-2 items-start";
    box.innerHTML = `
      <div class="pt-2 text-slate-400">${DAYS[i]}</div>
      <div class="grid gap-2">
        <input data-day="${i}" data-field="breakfast" class="input rounded-xl px-3 py-2" placeholder="Frühstück" value="${escapeHtml(dayPlan.breakfast)}" />
        <input data-day="${i}" data-field="lunch" class="input rounded-xl px-3 py-2" placeholder="Mittag" value="${escapeHtml(dayPlan.lunch)}" />
        <input data-day="${i}" data-field="dinner" class="input rounded-xl px-3 py-2" placeholder="Abendessen" value="${escapeHtml(dayPlan.dinner)}" />
      </div>`;
    grid.appendChild(box);
  }
  grid.querySelectorAll("input").forEach(inp => {
    inp.addEventListener("change", e => {
      const idx = +e.target.dataset.day;
      const field = e.target.dataset.field;
      const value = e.target.value;
      const key = isoDate(state.weekStart);
      const wk = state.meals[key] ? {...state.meals[key]} : {};
      const d = wk[idx] ? {...wk[idx]} : {breakfast:"", lunch:"", dinner:""};
      d[field] = value;
      wk[idx] = d;
      state.meals[key] = wk;
      localStorage.setItem(STORAGE.meals, JSON.stringify(state.meals));
    });
  });
}
function escapeHtml(str){ return String(str||"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;"); }
document.getElementById("prevWeek").addEventListener("click", ()=>{ state.weekStart = addDays(state.weekStart, -7); renderMeals(); });
document.getElementById("nextWeek").addEventListener("click", ()=>{ state.weekStart = addDays(state.weekStart, 7); renderMeals(); });

// Shopping
function renderShopping(){
  const list = document.getElementById("shoppingList");
  list.innerHTML = "";
  state.shopping.forEach(item => {
    const li = document.createElement("li");
    li.className = "flex items-center justify-between rounded-xl border border-slate-800 p-2";
    li.innerHTML = `
      <label class="flex items-center gap-2">
        <input type="checkbox" ${item.done?"checked":""}>
        <span class="${item.done?"line-through text-slate-500":""}">${escapeHtml(item.text)}</span>
      </label>
      <button class="px-2 py-1 rounded-lg border border-slate-700 hover:bg-slate-800">Löschen</button>
    `;
    const cb = li.querySelector("input");
    const del = li.querySelector("button");
    cb.addEventListener("change", ()=>{
      item.done = cb.checked;
      localStorage.setItem(STORAGE.shopping, JSON.stringify(state.shopping));
      renderShopping();
    });
    del.addEventListener("click", ()=>{
      state.shopping = state.shopping.filter(x=>x!==item);
      localStorage.setItem(STORAGE.shopping, JSON.stringify(state.shopping));
      renderShopping();
    });
    list.appendChild(li);
  });
}
document.getElementById("shoppingAdd").addEventListener("click", ()=>{
  const inp = document.getElementById("shoppingInput");
  const val = inp.value.trim();
  if(!val) return;
  state.shopping.push({ id: uid(), text: val, done: false });
  localStorage.setItem(STORAGE.shopping, JSON.stringify(state.shopping));
  inp.value = "";
  renderShopping();
});
document.getElementById("shoppingInput").addEventListener("keydown", (e)=>{
  if(e.key==="Enter"){ document.getElementById("shoppingAdd").click(); }
});

// Chores
function renderChores(){
  const list = document.getElementById("choreList");
  list.innerHTML = "";
  state.chores.forEach(ch => {
    const li = document.createElement("li");
    li.className = "flex items-center justify-between rounded-xl border border-slate-800 p-2";
    li.innerHTML = `
      <label class="flex items-center gap-2">
        <input type="checkbox" ${ch.done?"checked":""}>
        <span class="${ch.done?"line-through text-slate-500":""}">${escapeHtml(ch.text)}</span>
      </label>`;
    const cb = li.querySelector("input");
    cb.addEventListener("change", ()=>{
      ch.done = cb.checked;
      localStorage.setItem(STORAGE.chores, JSON.stringify(state.chores));
      renderChores();
    });
    list.appendChild(li);
  });
}
document.getElementById("choreAdd").addEventListener("click", ()=>{
  const inp = document.getElementById("choreInput");
  const val = inp.value.trim();
  if(!val) return;
  state.chores.push({ id: uid(), text: val, done: false });
  localStorage.setItem(STORAGE.chores, JSON.stringify(state.chores));
  inp.value = "";
  renderChores();
});
document.getElementById("choreInput").addEventListener("keydown", (e)=>{
  if(e.key==="Enter"){ document.getElementById("choreAdd").click(); }
});

// Contacts
function renderContacts(){
  const grid = document.getElementById("contactGrid");
  grid.innerHTML = "";
  if(state.contacts.length===0){
    grid.innerHTML = '<div class="text-slate-400">Noch keine Kontakte. Füge welche hinzu!</div>';
    return;
  }
  state.contacts.forEach(c => {
    const card = document.createElement("div");
    card.className = "card rounded-2xl p-3";
    card.innerHTML = `
      <div class="font-medium text-lg">${escapeHtml(c.name)}</div>
      <div class="text-slate-400 text-sm">${escapeHtml(c.role||"")}</div>
      <div class="text-sm mt-2">${c.phone?("📞 "+escapeHtml(c.phone)):""}</div>
      <div class="text-sm">${c.email?("✉️ "+escapeHtml(c.email)):""}</div>
      <div class="mt-3 flex gap-2">
        <button class="px-3 py-1 rounded-lg border border-slate-700 hover:bg-slate-800">Bearbeiten</button>
        <button class="px-3 py-1 rounded-lg border border-rose-700 text-rose-300 hover:bg-rose-900/20">Löschen</button>
      </div>`;
    const [editBtn, delBtn] = card.querySelectorAll("button");
    editBtn.addEventListener("click", ()=>{
      document.getElementById("cName").value = c.name;
      document.getElementById("cRole").value = c.role||"";
      document.getElementById("cPhone").value = c.phone||"";
      document.getElementById("cEmail").value = c.email||"";
      // On save we'll overwrite if same id exists
      card.scrollIntoView({behavior:"smooth", block:"center"});
    });
    delBtn.addEventListener("click", ()=>{
      state.contacts = state.contacts.filter(x=>x!==c);
      localStorage.setItem(STORAGE.contacts, JSON.stringify(state.contacts));
      renderContacts();
    });
    grid.appendChild(card);
  });
}
document.getElementById("contactAdd").addEventListener("click", ()=>{
  const name = document.getElementById("cName").value.trim();
  const role = document.getElementById("cRole").value.trim();
  const phone = document.getElementById("cPhone").value.trim();
  const email = document.getElementById("cEmail").value.trim();
  if(!name) return;
  // Upsert by name+email
  const idx = state.contacts.findIndex(c => c.name===name && c.email===email);
  const entry = { id: idx>=0? state.contacts[idx].id : uid(), name, role, phone, email };
  if(idx>=0) state.contacts[idx] = entry; else state.contacts.push(entry);
  localStorage.setItem(STORAGE.contacts, JSON.stringify(state.contacts));
  document.getElementById("cName").value = "";
  document.getElementById("cRole").value = "";
  document.getElementById("cPhone").value = "";
  document.getElementById("cEmail").value = "";
  renderContacts();
});

// Render all
function renderAll(){
  applySettings();
  renderCalendar();
  renderMeals();
  renderShopping();
  renderChores();
  renderContacts();
}
renderAll();
