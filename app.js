const units = [
  "The Changing World", "Inspiring People", "Smart Learning", "Our Memory",
  "Power of Ideas", "Beyond Earth", "Feel the Rhythm", "More than a Game"
];
const allCatalogUnits = {...catalogUnits,pep9:Object.fromEntries(units.map((title,i)=>[i+1,"Unit "+(i+1)+" · "+title]))};
const allWords = [...vocabulary,...extraWords];
const catalogWords = Object.fromEntries(Object.keys(catalogInfo).map(key => [key,allWords.filter(word => courseKey(word)===key)]));
let currentCatalog = "pep9";
const get = id => document.getElementById(id);
const html = value => String(value).replace(/[&<>"']/g, char =>
  ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[char]);
const records = new Map(allWords.map(word => [word.id, word]));
const selectionKey = "pep9a-2026-classroom-v1";
const selected = new Set();
try {
  const previous = JSON.parse(localStorage.getItem(selectionKey) || "[]");
  if (Array.isArray(previous)) previous.filter(id => records.has(id)).forEach(id => selected.add(id));
} catch {}
let focusOnly = false;
let wordIndex = 0;
let practicePage = 0;
let player;
let currentMode = "library";
let currentBank = "words";
const pagedGroups = new Map();

function playWord(id, button) {
  if (!records.has(id)) return;
  player?.pause();
  player = new Audio(typeof offlineAudio === "undefined" ? "audio/"+id+".mp3" : offlineAudio[id]);
  player.play().catch(() => {
    const oldLabel = button.textContent;
    button.textContent = "请再点一次播放";
    setTimeout(() => { button.textContent = oldLabel; }, 1600);
  });
}

function activeEntries() {
  return Array.from(selected, id => records.get(id));
}

function currentUnitWords() {
  const value = get("unit").value;
  return catalogWords[currentCatalog].filter(word => value === "all" || String(word.unit) === value);
}

function visibleWords() {
  const value = get("section").value;
  const query = get("search").value.trim().toLowerCase();
  const date = currentCatalog === "mag" ? get("magDate").value : "";
  return currentUnitWords().filter(word => {
    return (!date || word.dates?.includes(date)) && (value === "all" || value === word.section) && (!focusOnly || word.focus) &&
      (!query || (word.word+" "+word.zh).toLowerCase().includes(query));
  });
}

function saveSelection() {
  try { localStorage.setItem(selectionKey, JSON.stringify(Array.from(selected))); } catch {}
  get("selectedCount").textContent = selected.size+" 词";
  get("selectedList").innerHTML = activeEntries().map(word =>
    '<li><span lang="en">'+html(word.word)+'</span><small class="badge-source">'+html(catalogInfo[courseKey(word)].short)+'</small></li>').join("");
  get("start").disabled = !selected.size;
  get("clear").disabled = !selected.size;
  get("selectionHelp").textContent = selected.size ? "按所选顺序投屏，可跨单元、跨词库选词。" : "可跨单元、跨词库选词。";
  refreshChecks();
}

function refreshChecks() {
  get("results").querySelectorAll("input[data-word]").forEach(input => {
    input.checked = selected.has(input.dataset.word);
  });
}

function audioControl(word,isStudy=false) {
  if (courseKey(word)==="pep9" || word.audio) {
    return '<button type="button" '+(isStudy?'class="primary" ':'')+'data-audio="'+word.id+'" aria-label="'+
      html("播放 "+word.word)+'">'+(isStudy?"播放发音":"发音")+'</button>';
  }
  return '<a class="audio-link" target="_blank" rel="noreferrer" href="https://dictionary.cambridge.org/search/english/?q='+
    encodeURIComponent(word.word)+'">在线查音</a>';
}
function wordRow(word) {
  const badge = word.wordSource ? '<span class="cue">'+html(word.wordSource)+'</span>' : word.primary ? '<span class="cue">小学回顾</span>' :
    word.focus ? '<span class="cue">推荐</span>' : "";
  return '<div class="word-row"><label class="wordcheck"><input type="checkbox" data-word="'+word.id+'">'+
    '<span><span class="headword" lang="en">'+html(word.word)+'</span>'+badge+
    '<small>'+html(word.ipa)+'　'+html(word.pos)+'　'+html(word.zh)+'</small></span></label>'+
    audioControl(word)+'</div>';
}

function renderLibrary() {
  const visible = visibleWords();
  get("selectVisible").disabled = !visible.length;
  get("selectUnit").disabled = get("unit").value === "all";
  const unitLabel = catalogInfo[currentCatalog].unitLabel;
  get("selectUnit").textContent = get("unit").value === "all" ? "先选"+unitLabel : "加入整个"+unitLabel;
  if (!visible.length) {
    get("results").innerHTML = '<p class="empty">没有符合条件的词。可切换单元或日期，也可清空筛选。</p>';
    return;
  }
  const groups = new Map();
  const order = Object.keys(allCatalogUnits[currentCatalog]);
  const list = [...visible].sort((a,b)=>order.indexOf(String(a.unit))-order.indexOf(String(b.unit)) ||
    sectionOrder.indexOf(a.section)-sectionOrder.indexOf(b.section));
  for (const word of list) {
    const key = groupKey(word);
    if (!groups.has(key)) groups.set(key,[]);
    groups.get(key).push(word);
  }
  get("results").innerHTML = Array.from(groups, ([key,words]) => {
    const limit = pagedGroups.get(key) ?? 18;
    const remaining = words.length-limit;
    const heading = unitName(currentCatalog,words[0].unit)+" · "+labelSection[words[0].section];
    return '<section class="group" aria-label="'+html(heading)+'">'+
      '<div class="group-top"><h3>'+html(heading)+'（'+words.length+'）</h3>'+
      '<button type="button" data-group="'+html(key)+'">加入此栏</button></div>'+
      words.slice(0,limit).map(wordRow).join("")+
      (remaining>0?'<button class="group-more" type="button" data-more="'+key+'">显示本栏其余 '+remaining+' 词</button>':'')+'</section>';
  }).join("");
  refreshChecks();
}

function addWords(words) {
  words.forEach(word => selected.add(word.id));
  saveSelection();
}

function showMode(mode) {
  player?.pause();
  currentMode = mode;
  for (const button of get("modes").querySelectorAll("[data-mode]")) {
    const active = button.dataset.mode === mode;
    button.setAttribute("aria-pressed", String(active));
    get(button.dataset.mode).hidden = !active || (mode === "library" && currentBank === "verbs");
  }
  get("verbLibrary").hidden = mode !== "library" || currentBank !== "verbs";
  get("lessonUnit").closest("label").hidden = currentBank === "verbs";
  if (currentBank === "verbs") {
    renderVerbMode(mode);
    return;
  }
  if (mode === "library") renderLibrary();
  if (mode === "study") renderStudy();
  if (mode === "practice") renderPractice();
  if (mode === "reading") renderReading();
}

function emptyLesson(panel) {
  panel.innerHTML = '<h2>先选本课要用的词</h2><button type="button" class="primary" data-return>去教师选词</button>';
}

function exampleHTML(example, replacement) {
  const [before,target,after] = example.split(/[\[\]]/);
  return html(before)+(replacement ?? '<strong>'+html(target)+'</strong>')+html(after);
}

function renderStudy() {
  const words = activeEntries();
  const panel = get("study");
  if (!words.length) { emptyLesson(panel);return; }
  wordIndex = Math.max(0, Math.min(wordIndex,words.length-1));
  const word = words[wordIndex];
  panel.innerHTML = '<div class="study-head"><h2>投屏词卡</h2><span class="muted counter">'+(wordIndex+1)+' / '+words.length+'</span></div>'+
    '<div class="study-word"><p>'+html(catalogInfo[courseKey(word)].short+' · '+unitName(courseKey(word),word.unit)+' · '+labelSection[word.section])+(word.primary?' · 小学回顾':'')+'</p>'+
    '<h2 lang="en">'+html(word.word)+'</h2><p lang="en">'+html(word.ipa||'')+'　'+html(word.pos||'')+'</p>'+
    audioControl(word,true)+'</div>'+
    '<div class="definitions"><div class="box"><strong>中文释义</strong><p>'+html(word.zh)+'</p></div>'+
    '<div class="box"><strong>英文释义</strong><p lang="en">'+(word.en?html(word.en):'可在线查词')+'</p></div></div>'+
    
    (word.example?'<div class="lesson-block"><h3>例句</h3><p class="en" lang="en">'+exampleHTML(word.example)+'</p>':
      '<div class="lesson-block"><h3>造句练习</h3><p>用这个词写一句与你的生活相关的话。</p>')+
    (word.wordSource?'<p class="muted">'+html(word.wordSource)+'</p>':'')+
    (word.exampleRef?'<a class="audio-link" href="https://tatoeba.org/en/sentences/show/'+encodeURIComponent(word.exampleRef)+'" target="_blank" rel="noreferrer">例句来源</a>':'')+
    (word.alt ? '<details class="answer"><summary>查看同义词或替换表达</summary><p class="muted">'+html(word.altKind||"同义或近义表达")+'</p><p class="en" lang="en">'+html(word.alt)+'</p><p class="muted">结合释义和例句选用表达，必要时调整句子结构。</p></details>':'')+
    (word.appendix?'<p class="muted">教材词表 p.'+word.appendix+'</p>':'')+'</div>'+
    '<div class="actions page-nav"><button type="button" data-direction="-1" '+(wordIndex===0?'disabled':'')+'>上一词</button>'+
    '<button class="primary" type="button" data-direction="1" '+(wordIndex===words.length-1?'disabled':'')+'>下一词</button></div>';
}

function renderPractice() {
  const words = activeEntries();
  const panel = get("practice");
  if (!words.length) { emptyLesson(panel);return; }
  const pageSize = 6;
  const last = Math.ceil(words.length/pageSize)-1;
  practicePage = Math.max(0, Math.min(practicePage,last));
  const start = practicePage*pageSize;
  panel.innerHTML = '<div class="study-head"><h2>句子填空</h2><span class="muted counter">'+(practicePage+1)+' / '+(last+1)+' 页</span></div>'+
    '<p>在本子上填词。完成后选一个有替换表达的句子，试着换个说法，保持原意。</p>'+
    '<ol start="'+(start+1)+'">'+words.slice(start,start+pageSize).map(word =>
      '<li class="exercise"><p class="en">'+(word.example?exampleHTML(word.example,"<strong>______</strong>"):'根据释义写词，再用它造句。')+'</p>'+
      '<p class="muted">词义提示　'+html(word.zh)+'</p>'+
      '<details class="answer"><summary>看答案</summary><p lang="en">'+(word.example?exampleHTML(word.example):html(word.word))+'</p>'+
      (word.alt ? '<p>'+html(word.altKind||'可尝试的替换表达')+'　<span lang="en">'+html(word.alt)+'</span></p>':'')+'</details></li>'
    ).join("")+'</ol>'+
    '<div class="actions page-nav"><button type="button" data-page="-1" '+(!practicePage?'disabled':'')+'>上一页</button>'+
    '<button class="primary" type="button" data-page="1" '+(practicePage===last?'disabled':'')+'>下一页</button></div>';
}

function renderReading() {
  const unit = get("lessonUnit").value;
  const lesson = currentCatalog === "pep9" ? lessons[Number(unit)-1] : extraLessons[currentCatalog]?.[unit];
  if (!lesson) {
    const prompt = currentCatalog === "bridge" ? "选三个本课词，写 4 句，介绍自己、家人、学校或一次日常活动。" :
      "先读选定日期的文章，找出两个与课堂词卡意思相近的表达。再用本课至少两个词写 4 句，总结主题或分享自己的看法。";
    get("readingContent").innerHTML = '<h2>阅读与写作练习</h2><p>'+prompt+'</p>'+
      (currentCatalog === "mag" ? magazineLink(unit) : '')+
      '<details class="answer"><summary>展开写作支架</summary><p lang="en">I want to talk about …<br>One example is …<br>I think … because …</p></details>';
    return;
  }
  const numbered = (items, cls) => '<ol'+(cls?' class="'+cls+'"':'')+'>'+items.map(item=>'<li>'+html(item)+'</li>').join("")+'</ol>';
  get("readingContent").innerHTML = '<h2>阅读理解 · '+html(lesson.title)+'</h2>'+
    '<p>答题后，在本子上并排抄下题干和原文中意思对应的表达。</p>'+
    '<div class="box reading-copy" lang="en">'+lesson.paragraphs.map(para=>'<p>'+html(para)+'</p>').join("")+'</div>'+
    '<div class="lesson-block" lang="en">'+numbered(lesson.questions.map(pair=>pair[0]),"en")+'</div>'+
    '<details class="answer"><summary>核对答案和替换线索</summary>'+numbered(lesson.questions.map(pair=>pair[1]),"en")+'</details>'+
    '<section class="lesson-block"><h2>作文小练笔 · '+html(lesson.prompt)+'</h2><p>'+html(lesson.context)+'</p>'+
    '<p>基础任务写 4 句，圈出至少两个本单元学过的词或短语。完成较快的学生加写一个具体细节，再试着改写其中一句。</p>'+
    '<details><summary>展开写作支架</summary>'+numbered(lesson.frames,"en")+'</details>'+
    '<details class="answer"><summary>写完后看范文</summary><p class="en" lang="en">'+html(lesson.model)+'</p></details></section>';
}

get("unit").onchange = () => {
  const unit = get("unit").value;
  if (unit !== "all") get("lessonUnit").value = unit;
  if (currentCatalog === "mag") {
    const firstDay = magazineLessons[unit]?.[0];
    get("magDate").value = firstDay ? "2026-11-"+firstDay : "";
  }
  renderLibrary();
};
get("section").onchange = renderLibrary;
get("catalog").onchange = () => {
  currentCatalog = get("catalog").value;
  syncCatalog();
  renderLibrary();
};
get("magDate").onchange = () => {
  get("unit").value = "all";
  const match = visibleWords()[0];
  if (match) get("lessonUnit").value = String(match.unit);
  renderLibrary();
};
get("search").oninput = renderLibrary;
get("lessonUnit").onchange = renderReading;
get("focusOnly").onclick = () => {
  focusOnly = !focusOnly;
  get("focusOnly").setAttribute("aria-pressed", String(focusOnly));
  renderLibrary();
};
get("selectUnit").onclick = () => { if (get("unit").value !== "all") addWords(currentUnitWords()); };
get("selectVisible").onclick = () => addWords(visibleWords());
get("start").onclick = () => {
  wordIndex = 0;
  practicePage = 0;
  const first = activeEntries().find(word => courseKey(word)===currentCatalog);
  if (first) get("lessonUnit").value = String(first.unit);
  showMode("study");
  window.scrollTo(0,0);
};
get("clear").onclick = () => { selected.clear();saveSelection(); };
get("results").onchange = event => {
  const id = event.target.dataset.word;
  if (!records.has(id)) return;
  if (event.target.checked) selected.add(id); else selected.delete(id);
  saveSelection();
};
document.addEventListener("click", event => {
  const button = event.target.closest("button");
  if (!button) return;
  const data = button.dataset;
  if (data.bank) switchBank(data.bank);
  if (data.mode) showMode(data.mode);
  if (data.return !== undefined) showMode("library");
  if (data.audio) playWord(data.audio,button);
  if (data.group) {
    addWords(currentUnitWords().filter(word => groupKey(word) === data.group));
  }
  if (data.more) { pagedGroups.set(data.more, Number.MAX_SAFE_INTEGER);renderLibrary(); }
  if (data.direction) {
    if (currentBank === "verbs") moveVerb(Number(data.direction));
    else { player?.pause();wordIndex += Number(data.direction);renderStudy(); }
  }
  if (data.page) { practicePage += Number(data.page);renderPractice(); }
});
document.addEventListener("keydown", event => {
  if (currentMode !== "study" || event.target.closest("button,input,select,summary,a")) return;
  if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
    event.preventDefault();
    player?.pause();
    const direction = event.key === "ArrowRight" ? 1 : -1;
    if (currentBank === "verbs") moveVerb(direction);
    else { wordIndex += direction;renderStudy(); }
  }
});
syncCatalog();
renderLibrary();
saveSelection();
