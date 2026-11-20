const catalogInfo = {
  pep7:{title:"人教版七年级上册",short:"七上",unitLabel:"单元",source:"https://www.ai2book.com/diandu/book/242", note:"2024 秋启用版。含 Starter Unit、正式单元及小学回顾词，按课本词汇附录所列页码归入 Section。"},
  pep8:{title:"人教版八年级上册",short:"八上",unitLabel:"单元",source:"https://www.ai2book.com/diandu/book/45790",note:"2025 秋启用版。按单元导入、Section A 和 Section B 归类，含小学回顾词。"},
  pep9:{title:"人教版九年级上册",short:"九上",unitLabel:"单元",source:"https://www.ai2book.com/diandu/book/45880?p=128318",note:"2026 秋启用版。Section A 含 Grammar Focus；小学回顾词归入出现位置。"},
  joy:{title:"翰林佳音 iEnglish B1",short:"佳音 B1",unitLabel:"课次",source:"https://www.junyiacademy.org/topics/h-j-114-vocab-b1-u1",note:"台湾国中英语第一册，按 114 学年度 Unit 1–6 单字卷编排。"},
  bridge:{title:"iEnglish B1 衔接 2500 词",short:"B1 衔接",unitLabel:"词组",source:"https://www.ceec.edu.tw/xmdoc?xsmsid=0K213553204833715309",note:"先学 B1 课内词，再按台湾大考中心词表级别拓展。课内与拓展合计 2500 个不重复词条。"},
  mag:{title:"《大家說英語》2026 年 11 月",short:"大家說英語",unitLabel:"课文主题",source:"https://shop.studioclassroom.com/km/news/2913",note:"选择教学日期或课文主题。出版方公开试阅词与根据当日主题编写的课堂拓展词分别标明。"}
};
const magazineLessons = {
  1:["02","03"],2:["04"],3:["05","06"],4:["09"],5:["10","11"],6:["12","13"],
  7:["16"],8:["17","18"],9:["19","20"],10:["23","24"],11:["25","26"],12:["27"],13:["30"]
};
const labelSection = {intro:"单元导入",A:"Section A",B:"Section B",all:"词汇",preview:"官方试阅词",extension:"主题拓展词"};
const sectionOrder = ["intro","A","B","all","preview","extension"];
const courseKey = word => word.catalog ?? "pep9";
const groupKey = word => courseKey(word)+":"+word.unit+":"+word.section;
const unitName = (catalog,unit) => allCatalogUnits[catalog]?.[String(unit)] ?? String(unit);
function catalogSummary() {
  return currentCatalog === "pep9" ? "8 个单元 · 486 条单元词汇 + 5 条回顾词" :
    Object.keys(allCatalogUnits[currentCatalog]).length+" 组 · "+catalogWords[currentCatalog].length+" 词条";
}
function syncCatalog() {
  const info = catalogInfo[currentCatalog];
  get("bankTitle").textContent = info.title;
  get("scope").textContent = catalogSummary();
  get("libraryTitle").textContent = currentCatalog === "mag" ? "按教学日期和主题选词" :
    currentCatalog.startsWith("pep") ? "按单元和 Section 选词" : "按课次或词组选词";
  get("libraryIntro").textContent = currentCatalog === "mag" ?
    "选择本期的教学日期，加入当天的主题词。" :
    "可以单独勾选，也可以将整课或整个单元加入本课。";
  get("unitLabel").textContent = info.unitLabel;
  get("dateFilter").hidden = currentCatalog !== "mag";
  get("sectionFilter").hidden = !currentCatalog.startsWith("pep");
  get("catalogNote").innerHTML = html(info.note)+' <a href="'+info.source+'" target="_blank" rel="noreferrer">查看来源</a>';
  const options = Object.entries(allCatalogUnits[currentCatalog]).map(([value,label])=>'<option value="'+html(value)+'">'+html(label)+'</option>').join("");
  get("unit").innerHTML = '<option value="all">全部'+info.unitLabel+'</option>'+options;
  get("unit").value = currentCatalog === "bridge" || currentCatalog === "mag" ? "all" : "1";
  get("lessonUnit").innerHTML = options;
  get("section").value = "all";
  get("search").value = "";
  get("magDate").value = "";
}
function magazineLink(unit) {
  const chosen = get("magDate").value;
  const days = magazineLessons[unit];
  const day = chosen || (days ? "2026-11-"+days[0] : "");
  const url = day && days ? "https://cloud.studioclassroom.com/read/lt/"+
    day.slice(0,4)+"/"+day.slice(5,7)+"/"+String(unit).padStart(2,"0")+"/"+day.slice(8,10) :
    catalogInfo.mag.source;
  return '<a class="audio-link" href="'+url+'" target="_blank" rel="noreferrer">打开所选日期的官方课文</a>';
}
