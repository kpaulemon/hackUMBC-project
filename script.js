document.addEventListener('DOMContentLoaded', () => {
    // ===== Timer state =====
    let digitStr = "";
    let remaining = 0;
    let interval = null;
    let running = false;
  
    // SAFE fallback: use body if #app doesn't exist
    const app   = document.getElementById('app') || document.body;
    const label = document.getElementById('time');
    const btn   = document.getElementById('toggle');
    const clearBtn = document.getElementById('clear');
  
    const clampDigits = s => (s.replace(/\D/g, "").slice(-6));
    function digitsToHMS(s){ s = s.padStart(6,"0"); return [s.slice(0,2), s.slice(2,4), s.slice(4,6)]; }
    function digitsToSeconds(s){ const [hh,mm,ss]=digitsToHMS(s).map(n=>parseInt(n,10)); return hh*3600+mm*60+ss; }
    function secondsToDigits(sec){
      sec = Math.max(0, sec|0);
      const h=Math.floor(sec/3600), m=Math.floor((sec%3600)/60), s=sec%60;
      return String(Math.min(h,99)).padStart(2,"0")+String(m).padStart(2,"0")+String(s).padStart(2,"0");
    }
    function renderFromDigits(){ const [hh,mm,ss]=digitsToHMS(digitStr); label.textContent=`${hh}:${mm}:${ss}`; }
    function renderFromSeconds(){ const six=secondsToDigits(remaining); label.textContent=`${six.slice(0,2)}:${six.slice(2,4)}:${six.slice(4,6)}`; }
  
    function placeCaretEnd(el){
      const r=document.createRange(); r.selectNodeContents(el); r.collapse(false);
      const s=window.getSelection(); s.removeAllRanges(); s.addRange(r);
    }
    function enterEditMode(){ if(running) return; app.classList.add('editing'); label.setAttribute('contenteditable','true'); placeCaretEnd(label); }
    function exitEditMode(){ app.classList.remove('editing'); label.setAttribute('contenteditable','false'); }
  
    label.addEventListener('focus', enterEditMode);
    label.addEventListener('blur', () => app.classList.remove('editing'));
  
    label.addEventListener('keydown', (e) => {
      if (running) { e.preventDefault(); return; }
      const isDigit = e.key >= '0' && e.key <= '9';
      const isBackspace = e.key === 'Backspace';
      const isDelete = e.key === 'Delete';
      const isEnter = e.key === 'Enter';
      const isSpace = e.key === ' ';
      if (isEnter || isSpace) { e.preventDefault(); toggle(); return; }
      if (['Tab','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(e.key)) return;
      if (!isDigit && !isBackspace && !isDelete) { e.preventDefault(); return; }
      e.preventDefault();
      if (isDigit) digitStr = clampDigits(digitStr + e.key);
      else if (isBackspace) digitStr = digitStr.slice(0, -1);
      else if (isDelete) digitStr = "";
      renderFromDigits();
      remaining = digitsToSeconds(digitStr);
    });
  
    label.addEventListener('paste', (e) => {
      if (running) { e.preventDefault(); return; }
      e.preventDefault();
      const text=(e.clipboardData.getData('text')||'').replace(/\D/g,'');
      if(!text) return;
      digitStr = clampDigits(digitStr + text);
      renderFromDigits();
      remaining = digitsToSeconds(digitStr);
    });
  
    label.addEventListener('click', () => { if (!running) enterEditMode(); });
  
    function start(){
      if (remaining <= 0) return;
      running = true; app.classList.add('running'); btn.textContent='Pause'; exitEditMode();
      interval = setInterval(() => {
        remaining--; renderFromSeconds();
        if (remaining <= 0) {
          clearInterval(interval); interval=null; running=false;
          app.classList.remove('running'); btn.textContent='Start'; digitStr="";
        }
      }, 1000);
    }
    function pause(){
      running=false; app.classList.remove('running'); btn.textContent='Start';
      clearInterval(interval); interval=null;
      digitStr = secondsToDigits(remaining).replace(/^0+/, "");
      label.setAttribute('contenteditable','true');
    }
    function toggle(){ running ? pause() : startFromLabelIfNeeded(); }
    function startFromLabelIfNeeded(){
      if (!digitStr) { const txt=(label.textContent||'').replace(/\D/g,''); digitStr=clampDigits(txt); }
      remaining = digitsToSeconds(digitStr);
      if (remaining > 0) { renderFromSeconds(); start(); }
    }
  
    btn.addEventListener('click', toggle);
    clearBtn.addEventListener('click', () => {
      if (running) return;
      digitStr=""; remaining=0; label.textContent="00:00:00"; label.focus(); enterEditMode();
    });
  
    label.setAttribute('contenteditable','true');
    renderFromDigits();
    placeCaretEnd(label);
  
    // ===== URL / Blocklist (typed dropdown + list) =====
    const urlInput  = document.getElementById('urlInput');
    const addUrlBtn = document.getElementById('addUrlBtn');
    const urlListEl = document.getElementById('urlList');
  
    const STORAGE_KEY = 'rb_blocklist';
    function loadBlocklist(){
      try { const v = JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]'); return Array.isArray(v)? v: []; }
      catch { return []; }
    }
    function saveBlocklist(list){ localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); }
  
    let blocklist = loadBlocklist();
    if (blocklist.length === 0) {
      blocklist = ['youtube.com','instagram.com','twitter.com','tiktok.com','reddit.com'];
      saveBlocklist(blocklist);
    }
  
    function normalizeHost(str){
      if (!str) return '';
      let s=str.trim();
      if (!/^https?:\/\//i.test(s)) s='http://'+s; // help URL parser
      try { return new URL(s).hostname.replace(/^www\./,'').toLowerCase(); }
      catch {
        return str.replace(/^https?:\/\/(www\.)?/i,'').replace(/\/.*$/,'').toLowerCase();
      }
    }
  
    function renderBlocklist(){
      urlListEl.innerHTML='';
      blocklist.forEach((host, idx) => {
        const li=document.createElement('li');
  
        const a=document.createElement('a');
        a.href='https://'+host; a.target='_blank'; a.rel='noopener noreferrer';
        a.textContent=host; a.style.color='inherit'; a.style.textDecoration='none';
  
        const rm=document.createElement('button');
        rm.className='remove'; rm.type='button'; rm.setAttribute('aria-label',`Remove ${host}`); rm.textContent='×';
        rm.addEventListener('click', () => {
          blocklist.splice(idx,1); saveBlocklist(blocklist); renderBlocklist();
        });
  
        li.append(a, rm);
        urlListEl.appendChild(li);
      });
    }
  
    function addHostFromInput(){
      const host = normalizeHost(urlInput.value);
      if (!host) return;
      if (!blocklist.includes(host)) {
        blocklist.push(host);
        saveBlocklist(blocklist);
        renderBlocklist();
      }
      urlInput.value='';
    }
  
    addUrlBtn?.addEventListener('click', addHostFromInput);
    urlInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); addHostFromInput(); }
    });
  
    renderBlocklist();
  });
  