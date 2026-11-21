const verbBank = [...irregularVerbRows, ...modalRows];
const verbById = new Map(verbBank.map(verb => [verb.id,verb]));
const verbStorageKey = "pep9a-2026-irregular-selection";
const verbSelected = new Set();
try {
  const saved = JSON.parse(localStorage.getItem(verbStorageKey) || "[]");
  if (Array.isArray(saved)) saved.filter(id => verbById.has(id)).forEach(id => verbSelected.add(id));
} catch {}
let verbIndex = 0;
let tensePage = 0;
let grammarPage = 0;

const verbNotes = {
  be:"I / he / she / it → was；you / we / they → were。",
  bear:"出生用 be born；表示承受、负担时，过去分词用 borne。",
  get:"got 和 gotten 都在词表中；例题中的 get colder 可用两个形式。",
  hang:"表示「悬挂」时用 hung → hung。",
  lay:"lay 是「放置」，通常接宾语。lie 表示「躺」时，过去式恰好是 lay。",
  lie:"这里用的是「躺」的 lie。表示「说谎」时，过去式和过去分词都是 lied。",
  read:"拼写不变。原形读 /riːd/，过去式和过去分词读 /red/。"
};

const choiceIng = {
  be:"being",begin:"beginning",dig:"digging",forget:"forgetting",get:"getting",hit:"hitting",
  cut:"cutting",let:"letting",lie:"lying",put:"putting",run:"running",see:"seeing",set:"setting",
  shut:"shutting",sit:"sitting",swim:"swimming",win:"winning"
};

function switchBank(bank) {
  currentBank = bank;
  for (const button of get("banks").querySelectorAll("[data-bank]")) {
    button.setAttribute("aria-pressed",String(button.dataset.bank === bank));
  }
  const verbMode = bank === "verbs";
  get("bankTitle").textContent = verbMode ? "中考不规则动词" : catalogInfo[currentCatalog].title;
  get("bankIntro").textContent = verbMode ? "看原形写两种词形，再用句子区分过去式和过去分词。" :
    "老师选词，学生在本子上练词义、同义替换和写作。";
  const labels = verbMode ? ["动词选词","投屏词卡","动词时态填空","语法选择题"] :
    ["教师选词","投屏词卡","句子填空","阅读与写作"];
  get("modes").querySelectorAll("[data-mode]").forEach((button,index) => {
    button.textContent = labels[index];
  });
  get("scope").textContent = verbMode ? irregularVerbRows.length+" 个教材动词 · "+modalRows.length+" 个课标情态动词" :
    catalogSummary();
  showMode("library");
}

function filteredVerbs() {
  const range = get("verbRange").value;
  const query = get("verbSearch").value.trim().toLowerCase();
  return verbBank.filter(verb => {
    return (range === "all" || (range === "main") === Boolean(verb.participle)) &&
      [verb.base,verb.past,verb.participle,verb.zh].join(" ").toLowerCase().includes(query);
  });
}

function selectedVerbs() {
  return Array.from(verbSelected,id => verbById.get(id));
}

function syncVerbSelection() {
  try { localStorage.setItem(verbStorageKey,JSON.stringify(Array.from(verbSelected))); } catch {}
  get("verbCount").textContent = verbSelected.size+" 词";
  get("verbSelectedList").innerHTML = selectedVerbs().map(verb => '<li lang="en">'+html(verb.base)+'</li>').join("");
  get("verbStart").disabled = !verbSelected.size;
  get("verbClear").disabled = !verbSelected.size;
  get("verbResults").querySelectorAll("[data-verb]").forEach(input => {
    input.checked = verbSelected.has(input.dataset.verb);
  });
}

function renderVerbLibrary() {
  const verbs = filteredVerbs();
  get("verbAdd").disabled = !verbs.length;
  get("verbResults").innerHTML = verbs.length ?
    '<table><thead><tr><th scope="col">原形</th><th scope="col">过去式</th><th scope="col">过去分词</th></tr></thead><tbody>'+
    verbs.map(verb => '<tr><td><label><input type="checkbox" data-verb="'+html(verb.id)+'"><strong lang="en">'+
      html(verb.base)+'</strong></label><small>'+html(verb.zh)+'</small></td><td lang="en">'+html(verb.past)+
      '</td><td lang="en">'+html(verb.participle||"—")+'</td></tr>').join("")+'</tbody></table>' :
    '<p class="empty">没有找到这个动词。试试原形或清空搜索。</p>';
  syncVerbSelection();
}

function verbNavigation(attribute,index,last,labels) {
  return '<div class="actions page-nav"><button type="button" '+attribute+'="-1" '+(index===0?'disabled':'')+
    '>'+labels[0]+'</button><button class="primary" type="button" '+attribute+'="1" '+(index===last?'disabled':'')+
    '>'+labels[1]+'</button></div>';
}

function renderVerbStudy() {
  const panel = get("study");
  const list = selectedVerbs();
  if (!list.length) { emptyLesson(panel);return; }
  verbIndex = Math.max(0,Math.min(verbIndex,list.length-1));
  const verb = list[verbIndex];
  const note = verbNotes[verb.id] || (!verb.participle ? verb.reason : "");
  panel.innerHTML = '<div class="study-head"><h2>不规则动词词卡</h2><span class="muted counter">'+
    (verbIndex+1)+' / '+list.length+'</span></div><div class="study-word"><p>动词原形</p><h2 lang="en">'+
    html(verb.base)+'</h2></div><p class="lesson-block">先在本子上写出过去式和过去分词，再核对。'+
    (!verb.participle?'本词是情态动词。':'')+'</p>'+
    '<details class="answer"><summary>揭晓过去式和过去分词</summary>'+
    '<div class="definitions verb-answers"><div class="box"><strong>过去式'+(!verb.participle?'（课标表）':'')+
    '</strong><p lang="en">'+html(verb.past)+'</p></div>'+
    '<div class="box"><strong>过去分词</strong><p lang="en">'+html(verb.participle||"—")+'</p></div></div>'+
    '<p>'+html(verb.zh)+(note?' · '+html(note):'')+'</p></details>'+
    verbNavigation("data-direction",verbIndex,list.length-1,["上一词","下一词"])+
    '<p class="muted">按空格键，切换下一词。</p>';
}

function moveVerb(delta) {
  verbIndex += delta;
  renderVerbStudy();
}

function verbExercises() {
  return selectedVerbs().flatMap(verb => {
    if (!verb.participle) return [{verb,sentence:verb.sentence,answer:verb.answer,options:verb.options,reason:verb.reason}];
    const past = verb.id === "be" ? "were" : verb.past;
    const perfect = verb.id === "bear" ? "borne" : verb.participle;
    return [
      {verb,sentence:verb.pastSentence,answer:past,reason:verb.id === "be" ?
        "last night 表示过去，主语 They 搭配 were。" : "句子给出了明确的过去时间，用一般过去时。"},
      {verb,sentence:verb.perfectSentence,answer:perfect,isPerfect:true,reason:verb.id === "bear" ?
        "has 后接过去分词。这里表示承担成本，用 borne。" : "have / has 后接过去分词，构成现在完成时。"}
    ];
  });
}

function choiceOptions(exercise,index) {
  const verb = exercise.verb;
  const correct = exercise.answer.split(" / ")[0];
  const accepted = exercise.answer.split(" / ");
  const ing = choiceIng[verb.id] ?? verb.id.replace(/e$/,"")+"ing";
  const options = exercise.options ? [...exercise.options] : [correct,...Array.from(new Set([
    verb.id, ...verb.past.split(" / "), ...verb.participle.split(" / "), ing,
    exercise.isPerfect ? "was "+ing : "to "+verb.id
  ])).filter(value => value && !accepted.includes(value)).slice(0,2)];
  const offset = index % options.length;
  return options.slice(offset).concat(options.slice(0,offset));
}

function renderVerbExercise(isGrammar) {
  const panel = isGrammar ? get("readingContent") : get("practice");
  const list = verbExercises();
  if (!list.length) { emptyLesson(panel);return; }
  const pageSize = 6;
  const last = Math.ceil(list.length/pageSize)-1;
  const page = Math.max(0,Math.min(isGrammar?grammarPage:tensePage,last));
  if (isGrammar) grammarPage = page; else tensePage = page;
  const start = page*pageSize;
  panel.innerHTML = '<div class="study-head"><h2>'+(isGrammar?"语法选择题":"动词时态填空")+'</h2>'+
    '<span class="muted counter">'+(page+1)+' / '+(last+1)+' 页</span></div>'+
    '<p>'+(isGrammar?"在本子上写下选项，再找出决定词形的时间词或助动词。":
      "根据括号中的动词和句子线索，在本子上写出正确形式。")+'</p><ol start="'+(start+1)+'">'+
    list.slice(start,start+pageSize).map((exercise,localIndex) => {
      const options = isGrammar ? choiceOptions(exercise,start+localIndex) : [];
      const correct = options.indexOf(exercise.answer.split(" / ")[0]);
      const label = String.fromCharCode(65+correct);
      return '<li class="exercise"><p class="en">'+html(exercise.sentence)+
        (isGrammar?'':' <span class="muted">('+html(exercise.verb.id)+')</span>')+'</p>'+
        (isGrammar?'<div class="mc-options" lang="en">'+options.map((option,i) =>
          '<span><strong>'+String.fromCharCode(65+i)+'.</strong> '+html(option)+'</span>').join("")+'</div>':'')+
        '<details class="answer"><summary>看答案与依据</summary><p><strong lang="en">'+
        (isGrammar?label+'. ':'')+html(exercise.answer)+'</strong></p>'+
        '<p>'+html(exercise.reason)+'</p></details></li>';
    }).join("")+'</ol>'+verbNavigation("data-verb-page",page,last,["上一页","下一页"]);
}

function renderVerbMode(mode) {
  if (mode === "library") renderVerbLibrary();
  if (mode === "study") renderVerbStudy();
  if (mode === "practice" || mode === "reading") renderVerbExercise(mode === "reading");
}

get("verbRange").onchange = renderVerbLibrary;
get("verbSearch").oninput = renderVerbLibrary;
get("verbResults").onchange = event => {
  const id = event.target.dataset.verb;
  if (!verbById.has(id)) return;
  if (event.target.checked) verbSelected.add(id); else verbSelected.delete(id);
  syncVerbSelection();
};
get("verbAdd").onclick = () => {
  filteredVerbs().forEach(verb => verbSelected.add(verb.id));
  syncVerbSelection();
};
get("verbStart").onclick = () => {
  verbIndex = 0;
  tensePage = 0;
  grammarPage = 0;
  showMode("study");
  window.scrollTo(0,0);
};
get("verbClear").onclick = () => { verbSelected.clear();syncVerbSelection(); };
document.addEventListener("click",event => {
  const button = event.target.closest("button[data-verb-page]");
  if (!button || currentBank !== "verbs") return;
  const isGrammar = currentMode === "reading";
  if (isGrammar) grammarPage += Number(button.dataset.verbPage);
  else tensePage += Number(button.dataset.verbPage);
  renderVerbExercise(isGrammar);
});
