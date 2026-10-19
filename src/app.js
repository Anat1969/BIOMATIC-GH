import { TOPICS } from "./data.js";

/* הפורמט הקבוע: כל תת־נושא מוצג תמיד בשלוש הממלכות, בסדר הזה.
   ממלכה בלי מקור השראה מוצגת כמשבצת ריקה — כדי שהחסר יהיה גלוי. */
const KINGDOMS = [
  { key:"animal",  ord:"א", name:"חי",   full:"בעלי חיים", hint:"אורגניזם שפותר את הבעיה בהתנהגות או במבנה גוף" },
  { key:"plant",   ord:"ב", name:"צומח", full:"צמחים",     hint:"פתרון של אורגניזם נטוע, שאינו יכול לזוז מהמקום" },
  { key:"mineral", ord:"ג", name:"דומם", full:"סלע וחומר", hint:"סלע, מינרל או תופעה פיזיקלית ללא חיים" }
];
const kingdomOf = k => KINGDOMS.find(x=>x.key===k) || {};

/* מפרק החיבור: אותה כותרת ממלכה, בשפת הכלי, מעל כל עמודת תוכן */
function kingdomHead(k, state){
  const txt = { full:"מאוכלס", text:"טקסט בלבד", empty:"פנוי" }[state];
  return `<div class="kingdom-head tool ${state==="empty" ? "" : "filled"}">
    <span class="ord">${k.ord}</span>
    <span class="kname">${k.name}</span>
    <span class="kfull">${k.full}</span>
    <span class="kstate">${txt}</span>
  </div>`;
}
const srcState = src => (src.mech.img && src.app.img) ? "full" : "text";

/* מסגרת תמונה, או מצייני־מקום כשהתמונה עדיין לא הוזנה */
function frame(cls, part, tag){
  if(!part.img) return `
    <figure class="frame ${cls} pending">
      <span class="label">${tag}</span>
      <h3>${part.title}</h3>
      <span class="one-line">${part.line}</span>
      <span class="file">ממתין לתמונה · ${part.imgFile}</span>
    </figure>`;
  return `
    <figure class="frame ${cls}">
      <img src="${part.img}" alt="${part.title}" loading="lazy">
      <figcaption>
        <span class="label">${tag}</span>
        <h3>${part.title}</h3>
        <span class="one-line">${part.line}</span>
      </figcaption>
    </figure>`;
}

const railTopics = document.getElementById("railTopics");
const railSubs   = document.getElementById("railSubs");
const stage      = document.getElementById("stage");
const footer     = document.getElementById("footer");
const detail     = document.getElementById("detail");

/* topicKey ריק = דף הבית */
let topicKey = null;
let subKey   = null;
let lastFocus = null;

/* הכתובת שומרת את הנושא ותת־הנושא, כדי שקישור משותף ייפתח באותו מקום */
function readHash(){
  const [tk, sk] = decodeURIComponent(location.hash.slice(1)).split("/");
  if(!tk){ topicKey = null; subKey = null; return true; }
  const t = TOPICS.find(x=>x.key===tk);
  if(!t) return false;
  topicKey = t.key;
  const s = t.subs.find(x=>x.key===sk) || t.subs.find(x=>x.sources.length) || t.subs[0];
  subKey = s ? s.key : null;
  return true;
}
function writeHash(){
  const h = topicKey ? "#" + topicKey + (subKey ? "/" + subKey : "") : "";
  if(location.hash !== h) history.replaceState(null, "", h || location.pathname);
}
readHash();
window.addEventListener("hashchange", ()=>{ if(readHash()) render(); });

const topic = ()=> TOPICS.find(t=>t.key===topicKey);
const sub   = ()=> { const t = topic(); return t ? (t.subs.find(s=>s.key===subKey) || null) : null; };

function renderTopics(){
  railTopics.querySelectorAll(".tab").forEach(n=>n.remove());
  TOPICS.forEach(t=>{
    const filled = t.subs.filter(s=>s.sources.length).length;
    const b = document.createElement("button");
    b.className = "tab" + (filled ? "" : " soon");
    b.style.setProperty("--hue", t.hue);
    b.dataset.topic = t.key;
    b.setAttribute("aria-current", t.key===topicKey ? "true" : "false");
    b.innerHTML = `<span class="pip"></span>${t.name}` +
      (t.subs.length ? `<span class="count">${t.subs.length}</span>` : `<span class="count">בהכנה</span>`);
    railTopics.appendChild(b);
  });
}

function renderSubs(){
  railSubs.querySelectorAll(".tab, .blurb").forEach(n=>n.remove());
  const t = topic();
  if(!t){
    const s = document.createElement("div");
    s.className = "blurb";
    s.style.marginInlineStart = "0";
    s.textContent = "בחרו נושא כדי לראות את תתי־הנושאים שלו";
    railSubs.appendChild(s);
    return;
  }
  if(!t.subs.length){
    const s = document.createElement("div");
    s.className = "blurb";
    s.style.marginInlineStart = "0";
    s.style.paddingInlineStart = "clamp(13px,2.4vw,30px)";
    s.textContent = "טרם הוגדרו תתי־נושאים";
    railSubs.appendChild(s);
    return;
  }
  t.subs.forEach(s=>{
    const b = document.createElement("button");
    b.className = "tab" + (s.sources.length ? "" : " soon");
    b.style.setProperty("--hue", t.hue);
    b.dataset.sub = s.key;
    b.setAttribute("aria-current", s.key===subKey ? "true" : "false");
    b.innerHTML = s.name + `<span class="count">${s.sources.length}/3</span>`;
    railSubs.appendChild(b);
  });
  const cur = sub();
  if(cur){
    const d = document.createElement("div");
    d.className = "blurb";
    d.textContent = cur.blurb;
    railSubs.appendChild(d);
  }
}

/* דף הבית: מפת כל הנושאים, עם תמונה מייצגת ותתי־הנושאים של כל אחד */
function renderHome(){
  const allSubs = TOPICS.flatMap(t=>t.subs);
  const allSrc  = allSubs.flatMap(s=>s.sources);
  stage.innerHTML = `
    <div class="home">
      <section class="home-hero">
        <span class="label">ביומימטיקה בתכנון</span>
        <h2>איך הטבע פותר את מה שהבניין צריך לפתור</h2>
        <p>לכל אתגר תכנוני שלושה מקורות השראה, אחד מכל ממלכה: חי, צומח ודומם. לכל מקור זוג: המנגנון בטבע מול היישום בבנייה.</p>
        <dl class="home-stats">
          <div><dt>נושאים</dt><dd>${TOPICS.length}</dd></div>
          <div><dt>תתי־נושאים</dt><dd>${allSubs.length}</dd></div>
          <div><dt>מקורות השראה</dt><dd>${allSrc.length}</dd></div>
        </dl>
      </section>
      <div class="home-grid">
        ${TOPICS.map((t,i)=>{
          const cover = t.subs.flatMap(s=>s.sources).find(x=>x.mech.img);
          return `
          <article class="home-card" style="--hue:${t.hue};--i:${i}">
            <button class="home-cover" data-topic="${t.key}" aria-label="מעבר לנושא ${t.name}">
              ${cover ? `<img src="${cover.mech.img}" alt="" loading="lazy">` : ""}
              <span class="home-cover-text">
                <span class="label">${String(i+1).padStart(2,"0")} · ${t.subs.length} תתי־נושאים</span>
                <h3>${t.name}</h3>
              </span>
            </button>
            <div class="home-card-body">
              <p>${t.blurb}</p>
              <ul>${t.subs.map(s=>`<li><button data-topic="${t.key}" data-sub="${s.key}">${s.name}</button></li>`).join("")}</ul>
            </div>
          </article>`;
        }).join("")}
      </div>
    </div>`;
}

function renderStage(){
  const t = topic(), s = sub();
  if(!t){ renderHome(); return; }
  if(!s){
    stage.innerHTML = `
      <div class="empty" style="--hue:${t.hue}">
        <span class="label">${t.name}</span>
        <h2>תתי־נושאים יתווספו כאן</h2>
        <p>${t.blurb}. כל תת־נושא בנוי משלושה מקורות השראה — בעלי חיים, צמחים ודומם — ולכל מקור זוג: המנגנון בטבע מול היישום בבנייה.</p>
        <div class="slots">
          ${KINGDOMS.map(k=>`<div class="slot"><span class="label">${k.ord} · ${k.name} — ${k.full}</span><span>${k.hint}</span></div>`).join("")}
        </div>
      </div>`;
    return;
  }
  /* תמיד שלוש עמודות, תמיד באותו סדר: בעלי חיים · צמחים · דומם */
  stage.innerHTML = `<div class="triptych" style="--n:3">` + KINGDOMS.map(k=>{
    const src = s.sources.find(x=>x.kingdom===k.key);
    if(!src) return `
      <div class="slot-col" style="--hue:var(--tool-line)">
        ${kingdomHead(k, "empty")}
        <div class="awaiting">
          <h2>ממתין למקור השראה</h2>
          <div class="ghost"><span class="label">מנגנון בטבע</span></div>
          <div class="ghost"><span class="label">יישום בבנייה</span></div>
          <p>${k.hint}.</p>
        </div>
      </div>`;
    return `
    <button class="source" data-key="${src.key}" style="--hue:${src.hue}" aria-label="פתיחת ${src.name}">
      ${kingdomHead(k, srcState(src))}
      <div class="source-head">
        <span class="open-hint">להעמקה ←</span>
        <span class="label">${src.strategy}</span>
        <h2>${src.name}</h2>
        <span class="taxon">${src.taxon}</span>
      </div>
      ${frame("nature", src.mech, "מנגנון")}
      ${frame("built", src.app, "יישום")}
    </button>`;
  }).join("") + `</div>`;
}

function renderFooter(){
  const s = sub();
  if(!s){
    footer.innerHTML = `<span class="hint" style="margin-inline-start:0">בחרו נושא ותת־נושא מהשורות שלמעלה</span>`;
    return;
  }
  footer.innerHTML = KINGDOMS.map(k=>{
    const src = s.sources.find(x=>x.kingdom===k.key);
    return src
      ? `<span><span class="dot" style="background:${src.hue}"></span>${k.name} · ${src.strategy}</span>`
      : `<span style="opacity:.65"><span class="dot" style="background:none;border:1px dashed currentColor;box-sizing:border-box"></span>${k.name} · חסר</span>`;
  }).join("") + `<span class="hint">לחצו על מקור השראה כדי להעמיק · Esc לסגירה</span>`;
}

function goTo(tk, sk){
  if(!detail.hidden) closeDetail();
  topicKey = tk;
  const t = topic();
  const pick = t && (t.subs.find(s=>s.key===sk) || t.subs.find(s=>s.sources.length) || t.subs[0]);
  subKey = pick ? pick.key : null;
  render();
  stage.scrollTop = 0;
  window.scrollTo(0, 0);
}

function render(){
  document.body.classList.toggle("is-home", !topicKey);
  document.getElementById("btnPrint").disabled = !sub();
  renderTopics(); renderSubs(); renderStage(); renderFooter(); buildPrintSheet();
  writeHash();
}

railTopics.addEventListener("click", e=>{
  const b = e.target.closest("[data-topic]");
  if(!b) return;
  goTo(b.dataset.topic);
});
railSubs.addEventListener("click", e=>{
  const b = e.target.closest("[data-sub]");
  if(!b) return;
  goTo(topicKey, b.dataset.sub);
});
document.getElementById("homeLink").addEventListener("click", e=>{
  e.preventDefault();
  goTo(null);
});

/* גובה סרגל הניווט הקבוע, כדי שעמוד ההעמקה ייפתח מתחתיו */
const navstack = document.getElementById("navstack");
const setNavH = ()=> document.documentElement.style.setProperty("--nav-h", navstack.offsetHeight + "px");
new ResizeObserver(setNavH).observe(navstack);
setNavH();

stage.addEventListener("click", e=>{
  const h = e.target.closest("[data-topic]");
  if(h){ goTo(h.dataset.topic, h.dataset.sub); return; }
  const b = e.target.closest(".source");
  if(b) openDetail(b.dataset.key);
});

/* ---------- detail ---------- */
function shot(part){
  return part.img
    ? `<img src="${part.img}" alt="${part.title}">`
    : `<span class="shot-pending"><span class="file">ממתין לתמונה · ${part.imgFile}</span></span>`;
}
function factList(f){
  return `<dl class="facts">${f.map(([k,v])=>`<div><dt>${k}</dt><dd>${v}</dd></div>`).join("")}</dl>`;
}
function openDetail(key){
  const list = sub().sources;
  const s = list.find(x=>x.key===key);
  if(!s) return;
  lastFocus = document.activeElement;
  const nxt = list[(list.indexOf(s)+1) % list.length];
  detail.innerHTML = `
    <header class="detail-bar tool" style="--hue:${s.hue}">
      <span class="kslug"><span class="ord">${kingdomOf(s.kingdom).ord}</span><span class="kname">${kingdomOf(s.kingdom).name}</span></span>
      <h2 id="detailTitle">${s.name}</h2>
      <span class="taxon">${s.taxon}</span>
      <span class="strat">${s.strategy}</span>
      <span class="rule"></span>
      <div class="nav-strip">
        <button class="btn" data-print-one="${s.key}" title="דף A4 אחד למקור זה">הדפסת דף</button>
        ${list.length>1 ? `<button class="btn" data-go="${nxt.key}">הבא: ${nxt.name}</button>` : ""}
        <button class="btn" data-close>סגירה</button>
      </div>
    </header>
    <div class="panes">
      <section class="pane" style="--hue:${s.hue}">
        <div class="shot">${shot(s.mech)}<span class="label stamp">מנגנון בטבע</span></div>
        <div class="pane-body">
          <h3>${s.mech.title}</h3>
          <p>${s.mech.body}</p>
          ${factList(s.mech.facts)}
        </div>
      </section>
      <section class="pane" style="--hue:${s.hue}">
        <div class="shot">${shot(s.app)}<span class="label stamp">יישום בבנייה</span></div>
        <div class="pane-body">
          <h3>${s.app.title}</h3>
          <p>${s.app.body}</p>
          ${factList(s.app.facts)}
        </div>
      </section>
      <div class="bridge" style="--hue:${s.hue}">
        <span class="label">מה בעצם עובר מהטבע לבניין</span>
        <p>${s.bridge}</p>
        <div class="cols">
          <p class="note"><strong>הערת דיוק · </strong>${s.note}</p>
          <div>
            <span class="label" style="display:block;margin-block-end:6px">מקורות</span>
            <ul class="refs">${s.refs.map(r=>`<li>${r}</li>`).join("")}</ul>
          </div>
        </div>
      </div>
    </div>`;
  detail.hidden = false;
  document.body.style.overflow = "hidden";
  detail.querySelector("[data-close]").focus();
}
function closeDetail(){
  detail.hidden = true;
  detail.innerHTML = "";
  document.body.style.overflow = "";
  if(lastFocus && document.contains(lastFocus)) lastFocus.focus();
}
detail.addEventListener("click", e=>{
  if(e.target.closest("[data-close]")) closeDetail();
  const go = e.target.closest("[data-go]");
  if(go) openDetail(go.dataset.go);
  const one = e.target.closest("[data-print-one]");
  if(one){
    buildPrintSheet(one.dataset.printOne);   // עמוד יחיד
    window.print();
    buildPrintSheet();                        // חזרה לתת־הנושא המלא
  }
});
document.addEventListener("keydown", e=>{
  if(e.key==="Escape" && !detail.hidden && settingsCard.hidden) closeDetail();
});

/* ---------- print: the active sub-topic, one page per source ---------- */
function printFacts(f){
  return `<dl class="p-facts">${f.map(([k,v])=>`<div><dt>${k}</dt><dd>${v}</dd></div>`).join("")}</dl>`;
}
/* עמוד A4 יחיד למקור אחד — הפריסה זהה בשני מצבי ההדפסה */
function printPage(src, k, t, s){
  return `
    <section class="p-src">
      <header class="p-head">
        <span class="p-crumb">${t.name} · ${s.name}</span>
        <span class="p-strategy">${k.ord} · ${k.name} — ${src.strategy}</span>
        <h2>${src.name}</h2>
        <div class="p-taxon">${src.taxon}</div>
      </header>
      <div class="p-cols">
        <div>
          ${src.mech.img ? `<img src="${src.mech.img}" alt="${src.mech.title}">` : ""}
          <span class="p-tag">מנגנון בטבע</span>
          <h3>${src.mech.title}</h3>
          <p>${src.mech.body}</p>
          ${printFacts(src.mech.facts)}
        </div>
        <div>
          ${src.app.img ? `<img src="${src.app.img}" alt="${src.app.title}">` : ""}
          <span class="p-tag">יישום בבנייה</span>
          <h3>${src.app.title}</h3>
          <p>${src.app.body}</p>
          ${printFacts(src.app.facts)}
        </div>
      </div>
      <div class="p-tail">
        <div class="p-bridge"><h4>מה בעצם עובר מהטבע לבניין</h4><p>${src.bridge}</p></div>
        <div><h4>הערת דיוק</h4><p>${src.note}</p></div>
        <div><h4>מקורות</h4><ul>${src.refs.map(r=>`<li>${r}</li>`).join("")}</ul></div>
      </div>
    </section>`;
}

/* onlyKey מוגדר → עמוד אחד בלבד, בלי שער. אחרת: שער + עמוד לכל ממלכה. */
function buildPrintSheet(onlyKey){
  const t = topic(), s = sub();
  const sheet = document.getElementById("printsheet");
  if(!s){ sheet.innerHTML = ""; return; }

  if(onlyKey){
    const src = s.sources.find(x=>x.key===onlyKey);
    if(!src){ sheet.innerHTML = ""; return; }
    sheet.innerHTML = printPage(src, kingdomOf(src.kingdom), t, s);
    return;
  }

  sheet.innerHTML = `
    <div class="p-doc-head">
      <h1>${s.name}</h1>
      <p>${t.name} · ${s.blurb} — המנגנון בטבע מול היישום בבנייה.</p>
      <p class="p-format">הפורמט: ${KINGDOMS.map(k=>`${k.ord} · ${k.name}`).join("  |  ")}</p>
    </div>
    ${KINGDOMS.map(k=>{
      const src = s.sources.find(x=>x.kingdom===k.key);
      if(!src) return `
      <section class="p-src p-missing">
        <span class="p-strategy">${k.ord} · ${k.name} — ${k.full}</span>
        <h2>ממתין למקור השראה</h2>
        <div class="p-taxon">${k.hint}</div>
      </section>`;
      return printPage(src, k, t, s);
    }).join("")}`;
}

/* ---------- כרטיס ההגדרות: נפתח מהלוגו של ענת ---------- */
const settings     = document.getElementById("settings");
const btnSettings  = document.getElementById("btnSettings");
const settingsCard = document.getElementById("settingsCard");
function setSettings(open){
  settingsCard.hidden = !open;
  btnSettings.setAttribute("aria-expanded", open ? "true" : "false");
  btnSettings.classList.toggle("on", open);
}
btnSettings.addEventListener("click", ()=> setSettings(settingsCard.hidden));
document.addEventListener("click", e=>{
  if(!settingsCard.hidden && !settings.contains(e.target)) setSettings(false);
});
document.addEventListener("keydown", e=>{
  if(e.key==="Escape" && !settingsCard.hidden){ setSettings(false); btnSettings.focus(); }
});
settingsCard.addEventListener("click", e=>{
  if(e.target.closest("a.sbtn")) setSettings(false);
});

document.getElementById("btnPrint").addEventListener("click", ()=>{
  setSettings(false);
  if(!detail.hidden) closeDetail();
  window.print();
});

const share = document.getElementById("btnShare");
share.hidden = !(location.protocol === "http:" || location.protocol === "https:");
{
  share.addEventListener("click", async ()=>{
    try{
      await navigator.clipboard.writeText(location.href);
      share.textContent = "הקישור הועתק";
    }catch(err){
      share.textContent = location.href;
    }
    setTimeout(()=>{ share.textContent = "העתקת קישור"; }, 2600);
  });
}

render();

/* ---------- התקנה כאפליקציה ---------- */
if("serviceWorker" in navigator && location.protocol === "https:"){
  navigator.serviceWorker.register("/sw.js").catch(()=>{});
}
const btnInstall = document.getElementById("btnInstall");
let installEvent = null;
window.addEventListener("beforeinstallprompt", e=>{
  e.preventDefault();
  installEvent = e;
  btnInstall.hidden = false;
  document.getElementById("installNote").hidden = true;
});
btnInstall.addEventListener("click", async ()=>{
  if(!installEvent) return;
  installEvent.prompt();
  await installEvent.userChoice;
  installEvent = null;
  btnInstall.hidden = true;
});
window.addEventListener("appinstalled", ()=>{ btnInstall.hidden = true; });
if(matchMedia("(display-mode: standalone)").matches) document.getElementById("installNote").hidden = true;
