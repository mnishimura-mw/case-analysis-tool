"use client";

import { useState, useRef, useEffect } from "react";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const ACCENT      = "#1A56DB";
const ACCENT_LIGHT= "#EFF6FF";
const ACCENT_DARK = "#1e3a8a";
const SUCCESS     = "#059669";
const WARN        = "#D97706";
const NUMS        = ["①", "②", "③", "④"];

interface CaseItem {
  title: string;
  input: string;
  inputType: string;
  analysis: Analysis | null;
  loading: boolean;
}

interface Analysis {
  companySize?: string;
  background: string[];
  challenges: string[];
  reasons: string[];
  effects: string[];
}

interface ProductInfo {
  companyName: string;
  name: string;
  url: string;
  note: string;
  fetched: string;
}

interface UniquePoint {
  company: string;
  point: string;
}

interface AxisData {
  common: string[];
  unique: UniquePoint[];
}

interface CommonData {
  issues: AxisData;
  strengths: AxisData;
  values: AxisData;
}

interface Requirements {
  functional: string[];
  nonFunctional: string[];
  operational: string[];
  environmental: string[];
}

interface Scenario {
  issue: string;
  externalTrend: string;
  value: string;
  strength: string;
  requirements: Requirements;
}

const EMPTY_CASE: CaseItem = { title: "", input: "", inputType: "text", analysis: null, loading: false };
const MAX_CASES  = 5;

// ─── PPTXGENJS LOADER ────────────────────────────────────────────────────────
function loadPptxGenJS(): Promise<unknown> {
  return new Promise((resolve, reject) => {
    if ((window as Window & { PptxGenJS?: unknown }).PptxGenJS) { resolve((window as Window & { PptxGenJS?: unknown }).PptxGenJS); return; }
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/pptxgenjs/dist/pptxgen.bundle.js";
    s.onload  = () => resolve((window as Window & { PptxGenJS?: unknown }).PptxGenJS);
    s.onerror = () => reject(new Error("PptxGenJS の読み込みに失敗しました"));
    document.head.appendChild(s);
  });
}

// ─── SLIDE GENERATION ────────────────────────────────────────────────────────
async function generateSlide(caseData: CaseItem) {
  const PptxGenJS = await loadPptxGenJS() as new () => {
    layout: string;
    addSlide: () => {
      background: { color: string };
      addShape: (shape: unknown, opts: unknown) => void;
      addText: (text: unknown, opts: unknown) => void;
    };
    ShapeType: { rect: unknown };
    writeFile: (opts: { fileName: string }) => Promise<void>;
  };
  const pres = new PptxGenJS();
  pres.layout = "LAYOUT_16x9";
  const slide = pres.addSlide();
  const { title, analysis } = caseData;

  const bg = analysis?.background  || [];
  const ch = analysis?.challenges  || [];
  const re = analysis?.reasons     || [];
  const ef = analysis?.effects     || [];

  // ── 背景：白
  slide.background = { color: "FFFFFF" };

  // ── 左カラム背景（紺）
  const LX = 0, LW = 2.7, SH = 5.625;
  slide.addShape(pres.ShapeType.rect, { x:LX, y:0, w:LW, h:SH, fill:{color:"1e3a8a"}, line:{color:"1e3a8a"} });

  // ── ロゴ枠
  slide.addShape(pres.ShapeType.rect, { x:0.18, y:0.18, w:2.34, h:0.9, fill:{color:"FFFFFF"}, line:{color:"CCCCCC", width:1} });
  slide.addText("お客様のロゴ", { x:0.18, y:0.18, w:2.34, h:0.9, fontSize:10, color:"999999", align:"center", valign:"middle" });

  // ── キーメッセージ枠
  slide.addShape(pres.ShapeType.rect, { x:0.18, y:1.3, w:2.34, h:1.3, fill:{color:"FFFFFF"}, line:{color:"CCCCCC", width:1} });
  slide.addText(title || "事例のキーメッセージ", { x:0.18, y:1.3, w:2.34, h:1.3, fontSize:10, color:"1e3a8a", align:"center", valign:"middle", wrap:true });

  // ── 選定の理由①②③（左下3枠）
  const reasons3 = re.slice(0,3);
  const boxH = 0.72, boxY0 = 2.85, gap = 0.08;
  reasons3.forEach((r, i) => {
    const y = boxY0 + i * (boxH + gap);
    slide.addShape(pres.ShapeType.rect, { x:0.18, y, w:2.34, h:boxH, fill:{color:"FFFFFF"}, line:{color:"CCCCCC", width:1} });
    slide.addText(r, { x:0.22, y, w:2.26, h:boxH, fontSize:8.5, color:"1e3a8a", align:"center", valign:"middle", wrap:true });
  });

  // ── 右エリア
  const RX = LX + LW + 0.18;
  const RW = 10 - RX - 0.18;

  // タイトルバー
  slide.addShape(pres.ShapeType.rect, { x:RX, y:0.15, w:RW, h:0.5, fill:{color:"F0F0F0"}, line:{color:"CCCCCC", width:0.5} });
  slide.addText(title || "お客様の取り組みサマリ（タイトル）", { x:RX+0.1, y:0.15, w:RW-0.2, h:0.5, fontSize:12, bold:false, color:"333333", valign:"middle" });

  // 4セクション
  const sections = [
    { label:"ご検討の背景",   items: bg, color:"1A56DB" },
    { label:"当時の課題",     items: ch, color:"1A56DB" },
    { label:"製品選定理由",   items: re, color:"1A56DB" },
    { label:"導入の効果",     items: ef, color:"1A56DB" },
  ];

  let curY = 0.82;
  const secGap = 0.06;
  const labelH = 0.24;
  const itemH  = 0.22;

  sections.forEach(sec => {
    // セクションラベル
    slide.addText(sec.label, { x:RX, y:curY, w:RW, h:labelH, fontSize:11, bold:false, color:sec.color, valign:"middle" });
    curY += labelH;

    // 箇条書き3点
    sec.items.slice(0,3).forEach(item => {
      slide.addText([
        { text:"●  ", options:{ color:sec.color, fontSize:8 } },
        { text:item,  options:{ color:"333333",   fontSize:9 } },
      ], { x:RX+0.1, y:curY, w:RW-0.1, h:itemH, valign:"middle", wrap:true });
      curY += itemH;
    });
    curY += secGap;
  });

  return pres;
}

async function downloadSlideFile(caseData: CaseItem) {
  const pres = await generateSlide(caseData);
  const fileName = `${caseData.title || "事例分析"}.pptx`;
  await pres.writeFile({ fileName });
}

// ─── AI CALLS ────────────────────────────────────────────────────────────────
async function fetchProductInfo(companyName: string, productName: string, url: string) {
  const subject = [companyName, productName].filter(Boolean).join(" / ");
  const urlLine = url ? `\n参考URL（補足情報として参照）: ${url}` : "";

  const prompt = `あなたは製品・サービスの専門アナリストです。
以下の製品について、あなたが学習済みの知識をもとに正確な情報のみを日本語でまとめてください。

【製品】${subject}${urlLine}

以下のルールを厳守してください：
- 確実に正しいと言える情報のみ記載する
- 不確かな情報・推測・曖昧な情報は一切含めない
- 知識にない場合はその項目を省略する

以下の項目を、わかる範囲でまとめてください：
1. 製品概要（何をするシステム・サービスか）
2. 主な機能・特徴
3. 強み・差別化ポイント
4. 主なターゲット顧客層・業種
5. 代表的な導入効果・実績（数字があれば）`;

  const res = await fetch("/api/claude", {
    method:"POST", headers:{"Content-Type":"application/json"},
    body: JSON.stringify({
      model:"claude-sonnet-4-20250514", max_tokens:2000,
      messages:[{role:"user",content:prompt}],
      action:"fetch_product"
    })
  });
  const data = await res.json();
  return data.content?.find((b: { type: string; text?: string }) => b.type==="text")?.text || "";
}

async function analyzeCase(text: string, productInfo: string) {
  const productCtx = productInfo ? `\n\n【分析対象製品の情報】\n${productInfo}` : "";
  const prompt = `あなたは営業コンサルタントです。以下の事例記事を分析し、4つの軸で整理してください。${productCtx}

事例テキスト:
${text}

以下の出力例を参考に、同じ構造・粒度でまとめてください：
- 検討の背景：製品ラインごとに異なる商流や見積手順があり、属人的な営業に限界があった。/ SFAとERP・生産管理が分断され、納期回答が遅れていた。/ 既存SFAは入力が煩雑で定着せず、データ活用が進まなかった。
- 当時の課題：提案や見積根拠が担当者ごとに異なり、営業プロセスが標準化されていなかった。/ 受注情報の二重入力が常態化し、誤発送や処理遅延を招いていた。/ データが蓄積されず改善サイクルが回らなかった。
- 選定の理由：柔軟なカスタマイズで製品別プロセスや商流に合わせた設計が可能。/ 基幹システムとAPI連携でき、営業から製造まで一気通貫でデータを統合。/ 直感的UIとモバイル対応で現場に定着しやすく、豊富な実績と支援も安心材料。
- 導入効果：提案・見積をテンプレ化し、新人育成期間が6か月から4か月へ短縮。/ 承認フロー電子化で承認時間50%短縮、処理工数30%削減、誤発送ゼロを実現。/ 入力定着で放置顧客や失注傾向が可視化され、営業一人当たり売上が20%増加。

以下のJSON形式のみで回答してください:
{
  "companySize": "従業員規模と業種（例：約15,000名（電子部品メーカー））",
  "background": ["背景の要点1（40字程度）","背景の要点2","背景の要点3"],
  "challenges": ["課題の要点1（具体的な困りごとを40字程度）","課題の要点2","課題の要点3"],
  "reasons": ["選定理由1（なぜ評価されたかを40字程度）","選定理由2","選定理由3"],
  "effects": ["導入効果1（数字・成果・理由を含めて50字程度）","導入効果2","導入効果3"]
}
各項目は必ず3点にし、出力例と同様の文体・粒度でまとめてください。`;

  const res = await fetch("/api/claude", {
    method:"POST", headers:{"Content-Type":"application/json"},
    body: JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:1200, messages:[{role:"user",content:prompt}], action:"analyze_case" })
  });
  const data = await res.json();
  const raw = data.content?.find((b: { type: string; text?: string }) => b.type==="text")?.text || "{}";
  try {
    return JSON.parse(raw.replace(/```json|```/g,"").trim());
  } catch {
    throw new Error("事例情報を抽出できませんでした。事例記事・導入事例のテキストやURLを指定してください");
  }
}

// PDF用: Anthropicのdocumentタイプを使ってPDFを直接解析
async function analyzeCasePDF(base64: string, productInfo: string) {
  const productCtx = productInfo ? `\n\n【分析対象製品の情報】\n${productInfo}` : "";
  const instruction = `あなたは営業コンサルタントです。添付のPDF（事例資料）を分析し、4つの軸で整理してください。${productCtx}

以下のJSON形式のみで回答してください:
{
  "companySize": "従業員規模と業種（例：約15,000名（電子部品メーカー））",
  "background": ["背景の要点1（40字程度）","背景の要点2","背景の要点3"],
  "challenges": ["課題の要点1（具体的な困りごとを40字程度）","課題の要点2","課題の要点3"],
  "reasons": ["選定理由1（なぜ評価されたかを40字程度）","選定理由2","選定理由3"],
  "effects": ["導入効果1（数字・成果・理由を含めて50字程度）","導入効果2","導入効果3"]
}
各項目は必ず3点にし、具体的な文体・粒度でまとめてください。`;

  const res = await fetch("/api/claude", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1200,
      messages: [{
        role: "user",
        content: [
          {
            type: "document",
            source: {
              type: "base64",
              media_type: "application/pdf",
              data: base64,
            },
          },
          {
            type: "text",
            text: instruction,
          },
        ],
      }],
      action: "analyze_case",
    }),
  });
  const data = await res.json();
  const raw = data.content?.find((b: { type: string; text?: string }) => b.type === "text")?.text || "{}";
  try {
    return JSON.parse(raw.replace(/```json|```/g, "").trim());
  } catch {
    throw new Error("PDFから事例情報を抽出できませんでした。導入事例PDFを指定してください");
  }
}

async function analyzeCommon(cases: CaseItem[]) {
  const caseNames = cases.map(c=>c.title).join("、");
  const summaries = cases.map((c,i) =>
    `【事例${i+1}: ${c.title}】\n背景: ${c.analysis!.background.join(" / ")}\n課題: ${c.analysis!.challenges.join(" / ")}\n選定理由: ${c.analysis!.reasons.join(" / ")}\n効果: ${c.analysis!.effects.join(" / ")}`
  ).join("\n\n");

  const prompt = `以下の${cases.length}つの事例（${caseNames}）を横断比較し、訴求に使える共通点と固有点を3つの軸で整理してください。

${summaries}

【3つの軸の定義】
① 訴求すべき課題：「検討の背景」と「当時の課題」を統合して整理する。背景は「なぜ今この課題が放置できないか」を補強する文脈として使い、課題の重要性・深刻さが伝わるようにまとめる。
② 製品の強み（選ばれる理由）：「選定の理由」から、競合に勝てる自社製品ならではの価値を整理する。
③ 導入の価値（効果）：「導入効果」から、投資対効果として顧客に伝えられる成果を整理する。

【固有点のルール】
- "company" には必ず事例名（${caseNames}）のいずれかをそのまま記載する
- "point" は抽象的な表現を避け、その企業ならではの具体的なエピソード・状況・数字を含めて生々しく書く
  例：「FAXでの注文が全体の6割を占めており、デジタル化の余地が特に大きかった」
  例：「創業150年で営業日報すら存在しない文化だったが、DX推進室主導で全社導入を断行」
  例：「ベテラン退職による属人ノウハウ消失リスクが直接の導入トリガーになった」
- 各事例から最低1つは固有点を抽出すること

以下のJSON形式のみで回答してください:
{
  "issues": {
    "common": ["訴求すべき課題の共通点1（背景と課題を統合したストーリーで）","共通点2","共通点3"],
    "unique": [{"company":"事例の会社名","point":"その企業ならではの具体的・生々しい課題エピソード"}]
  },
  "strengths": {
    "common": ["製品の強みの共通点1","共通点2","共通点3"],
    "unique": [{"company":"事例の会社名","point":"その企業ならではの選定理由・評価ポイント"}]
  },
  "values": {
    "common": ["導入効果の共通点1（数字入り）","共通点2","共通点3"],
    "unique": [{"company":"事例の会社名","point":"その企業ならではの具体的な成果・数字"}]
  }
}`;

  const res = await fetch("/api/claude", {
    method:"POST", headers:{"Content-Type":"application/json"},
    body: JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:2500, messages:[{role:"user",content:prompt}], action:"analyze_common" })
  });
  const data = await res.json();
  const raw = data.content?.find((b: { type: string; text?: string }) => b.type==="text")?.text || "{}";
  return JSON.parse(raw.replace(/```json|```/g,"").trim());
}

async function analyzeScenario(commonData: CommonData, productInfo: string, productName: string) {
  const productCtx = productInfo
    ? `\n\n【製品名】${productName}\n【製品情報】\n${productInfo}`
    : productName ? `\n\n【製品名】${productName}` : "";

  const prompt = `あなたは課題啓蒙型営業のエキスパートです。以下の情報をもとに、顧客への営業シナリオを3つ作成してください。${productCtx}

【事例分析結果】
訴求すべき共通課題: ${commonData.issues?.common?.join(" / ")||""}
製品の共通の強み: ${commonData.strengths?.common?.join(" / ")||""}
共通の導入効果: ${commonData.values?.common?.join(" / ")||""}

各シナリオは以下の4要素で構成してください：
① 訴求すべき課題：以下のルールで経営課題として言語化する
   - 読んだ経営者が「これ、うちのことだ」と感じる描写にする
   - 課題の状況・深刻さ・「打ち手がなかった」という焦燥感まで含める
   - 例：「属人化が進んでおり、営業間での成果の差が激しく、提案品質のばらつきやその底上げにも大きな工数が発生していたが、なかなか効果的な打ち手がなかった」
   - 説明文ではなく、当事者が自分ごととして読める言語化にする（2〜3文）
② 課題を裏付ける外部動向：IPA・経済産業省・マッキンゼー・ガートナー・IDC等の権威ある機関の調査・レポートを引用し、課題の深刻さを示す。機関名・発表年・具体的な数字を必ず含めて2文で書く
③ 検討する価値：上記「共通の導入効果」をもとに、導入後の成果を数字を含めて2〜3文で示す
④ 訴求すべき自社製品の強み：以下の2パートで構成する
   パート1（文章）：上記「製品の共通の強み」をもとに、①〜③で描いた課題・背景・価値に対して自社製品がどう応えられるかを、営業トークとして2〜3文で書く
   パート2（4カテゴリ分類）：パート1の強みを以下の4つの要件カテゴリに分けて具体的に列挙する
   - 機能要件：システムが「何をするか」（例：営業プロセス標準化機能、テンプレート管理機能）
   - 非機能要件：システムが「どのように動作するか」（性能・信頼性・セキュリティ等）
   - 運用要件：システムが「どのように運用されるか」（学習環境・操作性・サポート体制等）
   - 環境要件：システムが「どのような環境で動作するか」（対応IT環境・ユーザースキル・導入体制等）

以下のJSON形式のみで回答してください（他のテキスト不要）:
[
  {
    "issue": "①訴求すべき課題（経営者が自分ごととして読める2〜3文）",
    "externalTrend": "②外部動向（機関名・発表年・数字を含む2文）",
    "value": "③検討する価値（数字入り2〜3文）",
    "strength": "④自社製品の強み・営業トーク（2〜3文）",
    "requirements": {
      "functional": ["機能要件①","機能要件②"],
      "nonFunctional": ["非機能要件①","非機能要件②"],
      "operational": ["運用要件①","運用要件②"],
      "environmental": ["環境要件①","環境要件②"]
    }
  }
]
3つのシナリオを作成してください。`;

  const res = await fetch("/api/claude", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514", max_tokens: 4000,
      messages: [{ role: "user", content: prompt }],
      action: "analyze_scenario"
    })
  });
  const data = await res.json();
  const raw = data.content?.find((b: { type: string; text?: string }) => b.type === "text")?.text || "[]";
  const match = raw.match(/\[[\s\S]*\]/);
  if (!match) throw new Error("シナリオのJSON取得に失敗しました");
  return JSON.parse(match[0]);
}

// ─── SHARED UI ───────────────────────────────────────────────────────────────
function Tag({ color, children }: { color: string; children: React.ReactNode }) {
  const map: Record<string, { bg: string; text: string; border: string }> = {
    blue:   {bg:"#EFF6FF",text:"#1A56DB",border:"#BFDBFE"},
    purple: {bg:"#F5F3FF",text:"#7C3AED",border:"#DDD6FE"},
    green:  {bg:"#ECFDF5",text:"#059669",border:"#A7F3D0"},
    amber:  {bg:"#FFFBEB",text:"#D97706",border:"#FDE68A"},
  };
  const c = map[color]||map.blue;
  return <span style={{background:c.bg,color:c.text,border:`1px solid ${c.border}`,borderRadius:6,padding:"2px 10px",fontSize:12,fontWeight:700,letterSpacing:0.5}}>{children}</span>;
}

function AnalysisCard({ analysis }: { analysis: Analysis }) {
  const sections = [
    {key:"background" as keyof Analysis,label:"①検討の背景",color:"blue"},
    {key:"challenges" as keyof Analysis,label:"②当時の課題",color:"purple"},
    {key:"reasons"    as keyof Analysis,label:"③選定の理由",color:"green"},
    {key:"effects"    as keyof Analysis,label:"④導入効果",  color:"amber"},
  ];
  return (
    <div style={{marginTop:16}}>
      {analysis.companySize && (
        <div style={{fontSize:13,color:"#64748B",fontWeight:600,marginBottom:12,padding:"6px 12px",background:"#F1F5F9",borderRadius:8,display:"inline-block"}}>
          従業員規模：{analysis.companySize}
        </div>
      )}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        {sections.map(sec => (
          <div key={sec.key} style={{background:"#fff",borderRadius:10,padding:"14px 16px",border:"1px solid #E2E8F0",boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
            <Tag color={sec.color}>{sec.label}</Tag>
            <div style={{marginTop:10,display:"flex",flexDirection:"column",gap:6}}>
              {((analysis[sec.key] as string[])||[]).map((item,i) => (
                <div key={i} style={{display:"flex",gap:6,alignItems:"flex-start"}}>
                  <span style={{fontSize:13,fontWeight:800,color:ACCENT,minWidth:20,flexShrink:0}}>{NUMS[i]}</span>
                  <span style={{fontSize:13,color:"#374151",lineHeight:1.7}}>{item}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function InputArea({ value, onChange, inputType, onTypeChange }: {
  value: string;
  onChange: (v: string) => void;
  inputType: string;
  onTypeChange: (v: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState("");

  const processFile = (file: File | undefined) => {
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    if (file.type === "application/pdf") {
      // PDFはArrayBufferで読み込んでbase64に変換
      reader.onload = ev => {
        const arrayBuffer = ev.target?.result as ArrayBuffer;
        const bytes = new Uint8Array(arrayBuffer);
        let binary = "";
        const chunkSize = 8192;
        for (let offset = 0; offset < bytes.length; offset += chunkSize) {
          const chunk = bytes.subarray(offset, offset + chunkSize);
          binary += String.fromCharCode(...chunk);
        }
        const base64 = btoa(binary);
        onChange(`data:application/pdf;base64,${base64}`);
      };
      reader.readAsArrayBuffer(file);
    } else {
      // テキスト・Markdownはそのまま読み込み
      reader.onload = ev => onChange(ev.target?.result as string);
      reader.readAsText(file);
    }
  };
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => processFile(e.target.files?.[0]);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    processFile(e.dataTransfer.files[0]);
  };
  return (
    <div>
      <div style={{display:"flex",gap:8,marginBottom:12}}>
        {[{v:"text",label:"📝 テキスト"},{v:"url",label:"🔗 URL"},{v:"file",label:"📄 ファイル"}].map(opt=>(
          <button key={opt.v} onClick={()=>onTypeChange(opt.v)} style={{padding:"6px 14px",borderRadius:20,fontSize:13,fontWeight:600,cursor:"pointer",background:inputType===opt.v?ACCENT:"#F1F5F9",color:inputType===opt.v?"#fff":"#475569",border:inputType===opt.v?`2px solid ${ACCENT}`:"2px solid transparent",transition:"all 0.15s"}}>{opt.label}</button>
        ))}
      </div>
      {inputType==="file"?(
        <div
          onClick={()=>fileRef.current?.click()}
          onDragOver={e=>{e.preventDefault();setDragging(true);}}
          onDragLeave={()=>setDragging(false)}
          onDrop={handleDrop}
          style={{border:`2px dashed ${dragging?"#1A56DB":"#CBD5E1"}`,borderRadius:10,padding:"36px",textAlign:"center",cursor:"pointer",background:dragging?"#EFF6FF":"#F8FAFF",color:"#64748B",fontSize:14,transition:"all 0.15s"}}>
          <div style={{fontSize:32,marginBottom:8}}>{fileName?"✅":"📄"}</div>
          {fileName
            ? <><div style={{fontWeight:700,color:"#1E293B",marginBottom:4}}>{fileName}</div><div style={{fontSize:12,color:"#94A3B8"}}>クリックまたはドロップで変更</div></>
            : <><div>クリックまたはここにファイルをドロップ</div><div style={{fontSize:12,color:"#94A3B8",marginTop:4}}>PDF・テキスト・Markdownファイル対応</div></>
          }
          <input ref={fileRef} type="file" accept=".pdf,.txt,.md" hidden onChange={handleFile}/>
        </div>
      ):(
        <textarea value={value} onChange={e=>onChange(e.target.value)}
          placeholder={inputType==="url"?"事例記事のURLを入力してください（例: https://...）":"事例のインタビュー記事や事例リーフレットのテキストを貼り付けてください..."}
          style={{width:"100%",minHeight:160,padding:"12px 14px",border:"1.5px solid #CBD5E1",borderRadius:10,fontSize:14,color:"#1E293B",background:"#fff",resize:"vertical",fontFamily:"inherit",lineHeight:1.6,outline:"none",boxSizing:"border-box"}}/>
      )}
    </div>
  );
}

// ─── STEP 0 ──────────────────────────────────────────────────────────────────
function Step0({ productInfo, setProductInfo, onNext }: {
  productInfo: ProductInfo;
  setProductInfo: (p: ProductInfo) => void;
  onNext: () => void;
}) {
  const [companyName, setCompanyName] = useState(productInfo.companyName||"");
  const [name,        setName]        = useState(productInfo.name||"");
  const [url,         setUrl]         = useState(productInfo.url||"");
  const [note,        setNote]        = useState(productInfo.note||"");
  const [loading,     setLoading]     = useState(false);
  const [fetched,     setFetched]     = useState(!!productInfo.fetched);

  const fullName = [companyName, name].filter(Boolean).join(" / ");

  const handleFetch = async () => {
    if (!url.trim()) return;
    setLoading(true);
    try {
      const result = await fetchProductInfo(companyName, name, url);
      setProductInfo({companyName,name,url,note,fetched:result});
      setFetched(true);
    } catch(e) { alert("取得失敗: "+(e as Error).message); }
    setLoading(false);
  };

  const handleSave = async () => {
    // 社名か製品名があれば学習済み知識から自動取得（URL有無問わず）
    if ((companyName.trim() || name.trim()) && !productInfo.fetched) {
      setLoading(true);
      try {
        const result = await fetchProductInfo(companyName, name, url);
        setProductInfo({companyName,name,url,note,fetched:result});
        setFetched(true);
      } catch { /* 取得失敗しても進む */ }
      setLoading(false);
    } else {
      setProductInfo({companyName,name,url,note,fetched:productInfo.fetched||""});
    }
    onNext();
  };

  return (
    <div>
      <div style={{marginBottom:24}}>
        <h2 style={{fontSize:20,fontWeight:800,color:"#1E293B",margin:0}}>Step 0 ｜ 製品情報を設定する</h2>
        <p style={{fontSize:14,color:"#64748B",marginTop:6}}>
          分析対象の自社製品を登録します。ここで登録した製品情報は、Step 1〜3のAI分析すべてに文脈として渡されます。
        </p>
      </div>

      <div style={{background:"#fff",border:"1.5px solid #E2E8F0",borderRadius:14,padding:24,display:"flex",flexDirection:"column",gap:20}}>

        {/* Company + Product name row */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
          <div>
            <label style={{fontSize:13,fontWeight:700,color:"#374151",display:"block",marginBottom:8}}>
              社名 <span style={{color:"#94A3B8",fontWeight:400,fontSize:12}}>（入力すると分析精度が上がります）</span>
            </label>
            <input value={companyName} onChange={e=>setCompanyName(e.target.value)} placeholder="例：Salesforce、HubSpot、Microsoft..."
              style={{width:"100%",padding:"10px 14px",border:"1.5px solid #CBD5E1",borderRadius:10,fontSize:14,color:"#1E293B",outline:"none",boxSizing:"border-box"}}/>
          </div>
          <div>
            <label style={{fontSize:13,fontWeight:700,color:"#374151",display:"block",marginBottom:8}}>
              製品名 <span style={{color:"#94A3B8",fontWeight:400,fontSize:12}}>（入力すると分析精度が上がります）</span>
            </label>
            <input value={name} onChange={e=>setName(e.target.value)} placeholder="例：Sales Cloud、HubSpot CRM、Dynamics 365 Sales..."
              style={{width:"100%",padding:"10px 14px",border:"1.5px solid #CBD5E1",borderRadius:10,fontSize:14,color:"#1E293B",outline:"none",boxSizing:"border-box"}}/>
          </div>
        </div>

        {/* Preview */}
        {fullName && (
          <div style={{padding:"8px 14px",background:ACCENT_LIGHT,borderRadius:8,border:`1px solid #BFDBFE`,fontSize:13,color:ACCENT,fontWeight:600}}>
            📦 登録名：{fullName}
          </div>
        )}

        <div>
          <label style={{fontSize:13,fontWeight:700,color:"#374151",display:"block",marginBottom:8}}>製品ドキュメントURL <span style={{color:"#94A3B8",fontWeight:400}}>（任意）</span></label>
          <div style={{display:"flex",gap:10}}>
            <input value={url} onChange={e=>{setUrl(e.target.value);setFetched(false);}} placeholder="https://..."
              style={{flex:1,padding:"10px 14px",border:"1.5px solid #CBD5E1",borderRadius:10,fontSize:14,color:"#1E293B",outline:"none"}}/>
            <button onClick={handleFetch} disabled={loading||!url.trim()} style={{padding:"10px 20px",borderRadius:10,fontSize:13,fontWeight:700,background:loading||!url.trim()?"#CBD5E1":ACCENT,color:"#fff",border:"none",cursor:loading||!url.trim()?"not-allowed":"pointer",whiteSpace:"nowrap"}}>
              {loading?"🔄 取得中...":"🌐 URLから取得"}
            </button>
          </div>
          <p style={{fontSize:12,color:"#94A3B8",marginTop:6}}>URLを入力すると製品情報の補足として取り込まれます（任意）</p>
        </div>

        {fetched && productInfo.fetched && (
          <div style={{background:"#F0FDF4",border:"1.5px solid #A7F3D0",borderRadius:10,padding:16}}>
            <div style={{fontSize:12,fontWeight:800,color:SUCCESS,marginBottom:8}}>✓ 製品情報を取得しました</div>
            <div style={{fontSize:12,color:"#374151",lineHeight:1.7,maxHeight:120,overflow:"auto",whiteSpace:"pre-wrap"}}>
              {productInfo.fetched.slice(0,600)}{productInfo.fetched.length>600?"...":""}
            </div>
          </div>
        )}

        <div>
          <label style={{fontSize:13,fontWeight:700,color:"#374151",display:"block",marginBottom:8}}>製品の補足メモ <span style={{color:"#94A3B8",fontWeight:400}}>（任意）</span></label>
          <textarea value={note} onChange={e=>setNote(e.target.value)}
            placeholder="製品の特徴・強み・競合との差別化ポイントなど、AIに伝えておきたい情報を自由に記入してください..."
            style={{width:"100%",minHeight:100,padding:"12px 14px",border:"1.5px solid #CBD5E1",borderRadius:10,fontSize:14,color:"#1E293B",background:"#fff",resize:"vertical",fontFamily:"inherit",lineHeight:1.6,outline:"none",boxSizing:"border-box"}}/>
        </div>
      </div>

      <div style={{display:"flex",justifyContent:"flex-end",marginTop:20}}>
        <button onClick={handleSave} disabled={loading} style={{padding:"12px 36px",borderRadius:10,fontSize:15,fontWeight:800,background:loading?"#CBD5E1":ACCENT_DARK,color:"#fff",border:"none",cursor:loading?"not-allowed":"pointer"}}>
          {loading?"🔄 製品情報を取得中...":"Step 1へ進む →"}
        </button>
      </div>
    </div>
  );
}

// ─── STEP 1 ──────────────────────────────────────────────────────────────────
function Step1({ cases, setCases, productInfo, onNext }: {
  cases: CaseItem[];
  setCases: React.Dispatch<React.SetStateAction<CaseItem[]>>;
  productInfo: ProductInfo;
  onNext: () => void;
}) {
  const updateCase = (i: number, patch: Partial<CaseItem>) => setCases(prev=>prev.map((c,idx)=>idx===i?{...c,...patch}:c));
  const addCase    = () => { if(cases.length<MAX_CASES) setCases(prev=>[...prev,{...EMPTY_CASE}]); };
  const removeCase = (i: number) => setCases(prev=>prev.filter((_,idx)=>idx!==i));

  const runAnalysis = async (i: number) => {
    const c = cases[i];
    updateCase(i, { loading: true });
    try {
      const ctx = [productInfo.fetched, productInfo.note].filter(Boolean).join("\n");

      if (c.inputType === "url") {
        // サーバー側でURLをフェッチしてテキスト抽出
        const res = await fetch("/api/fetch-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: c.input.trim() }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "URLの取得に失敗しました");
        const analysis = await analyzeCase(data.text, ctx);
        if (!analysis || !analysis.background) throw new Error("URLのページから事例情報を抽出できませんでした。有効な事例記事のURLをご確認ください");
        updateCase(i, { analysis, loading: false });
      } else if (c.inputType === "file" && c.input.startsWith("data:application/pdf;base64,")) {
        // PDFはAnthropicのdocumentタイプで直接解析
        const base64 = c.input.replace("data:application/pdf;base64,", "");
        const analysis = await analyzeCasePDF(base64, ctx);
        if (!analysis || !analysis.background) throw new Error("PDFから事例情報を抽出できませんでした。有効な事例PDFをご確認ください");
        updateCase(i, { analysis, loading: false });
      } else {
        // テキスト入力またはテキストファイル
        const analysis = await analyzeCase(c.input, ctx);
        if (!analysis || !analysis.background) throw new Error("テキストから事例情報を抽出できませんでした");
        updateCase(i, { analysis, loading: false });
      }
    } catch(e) {
      updateCase(i, { loading: false });
      alert("分析に失敗しました: " + (e as Error).message);
    }
  };

  const downloadSlide = async (i: number) => {
    try {
      await downloadSlideFile(cases[i]);
    } catch(e) { alert("PPT出力失敗: " + (e as Error).message); }
  };

  const doneCases = cases.filter(c=>c.analysis).length;

  return (
    <div>
      <div style={{marginBottom:20}}>
        <h2 style={{fontSize:20,fontWeight:800,color:"#1E293B",margin:0}}>Step 1 ｜ 事例を4つの軸で分析する</h2>
        <p style={{fontSize:14,color:"#64748B",marginTop:6}}>事例のテキスト・URL・ファイルを投入し、AIが自動分析します。最大{MAX_CASES}件まで登録できます。</p>
        <div style={{marginTop:10,padding:"10px 14px",background:"#F0FDF4",borderRadius:8,border:"1px solid #A7F3D0",fontSize:13,color:"#065F46"}}>
          📥 分析完了後「PPTに出力」ボタンで、分析結果をPowerPointファイルとしてダウンロードできます
        </div>
        {productInfo.name && (
          <div style={{display:"inline-flex",alignItems:"center",gap:8,marginTop:10,padding:"8px 14px",background:ACCENT_LIGHT,borderRadius:8,border:`1px solid #BFDBFE`}}>
            <span style={{fontSize:12,color:ACCENT,fontWeight:700}}>📦 分析対象製品：{[productInfo.companyName,productInfo.name].filter(Boolean).join(" / ")}</span>
          </div>
        )}
      </div>

      <div style={{display:"flex",flexDirection:"column",gap:20}}>
        {cases.map((c,i)=>(
          <div key={i} style={{background:"#fff",border:"1.5px solid #E2E8F0",borderRadius:14,padding:20,boxShadow:"0 2px 8px rgba(0,0,0,0.05)"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <div style={{width:28,height:28,borderRadius:"50%",background:ACCENT,color:"#fff",fontWeight:800,fontSize:14,display:"flex",alignItems:"center",justifyContent:"center"}}>{i+1}</div>
                <input value={c.title} onChange={e=>updateCase(i,{title:e.target.value})} placeholder="企業名・事例タイトル"
                  style={{border:"1.5px solid #E2E8F0",borderRadius:8,padding:"6px 12px",fontSize:14,fontWeight:700,color:"#1E293B",outline:"none",width:220}}/>
                {c.analysis&&<span style={{fontSize:12,color:SUCCESS,fontWeight:700}}>✓ 分析完了</span>}
              </div>
              <div style={{display:"flex",gap:8}}>
                {c.analysis&&<button onClick={()=>downloadSlide(i)} style={{padding:"7px 16px",borderRadius:8,fontSize:13,fontWeight:700,background:"#0F9D58",color:"#fff",border:"none",cursor:"pointer"}}>📥 PPTに出力</button>}
                {cases.length>1&&<button onClick={()=>removeCase(i)} style={{padding:"7px 12px",borderRadius:8,fontSize:13,background:"#FEF2F2",color:"#DC2626",border:"1px solid #FECACA",cursor:"pointer"}}>削除</button>}
              </div>
            </div>
            <InputArea value={c.input} onChange={v=>updateCase(i,{input:v})} inputType={c.inputType} onTypeChange={v=>updateCase(i,{inputType:v})}/>
            <button onClick={()=>runAnalysis(i)} disabled={c.loading||!c.input.trim()} style={{marginTop:14,padding:"10px 24px",borderRadius:10,fontSize:14,fontWeight:700,cursor:c.loading||!c.input.trim()?"not-allowed":"pointer",background:c.loading||!c.input.trim()?"#CBD5E1":ACCENT,color:"#fff",border:"none",width:"100%"}}>
              {c.loading?"🔄 AI分析中...":"✨ AIで分析する"}
            </button>
            {c.analysis&&<AnalysisCard analysis={c.analysis}/>}
          </div>
        ))}
      </div>

      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:20}}>
        {cases.length<MAX_CASES?<button onClick={addCase} style={{padding:"10px 20px",borderRadius:10,fontSize:14,fontWeight:700,background:"#F1F5F9",color:"#475569",border:"2px dashed #CBD5E1",cursor:"pointer"}}>+ 事例を追加する（最大{MAX_CASES}件）</button>:<div/>}
        {doneCases>=2&&<button onClick={onNext} style={{padding:"12px 32px",borderRadius:10,fontSize:15,fontWeight:800,background:ACCENT_DARK,color:"#fff",border:"none",cursor:"pointer"}}>Step 2へ進む →</button>}
      </div>
    </div>
  );
}

// ─── STEP 2 ──────────────────────────────────────────────────────────────────
function Step2({ cases, commonData, setCommonData, onNext }: {
  cases: CaseItem[];
  commonData: CommonData | null;
  setCommonData: (d: CommonData) => void;
  onNext: () => void;
}) {
  const [loading,setLoading]=useState(false);
  const run=async()=>{setLoading(true);try{setCommonData(await analyzeCommon(cases));}catch(e){alert("比較分析に失敗: "+(e as Error).message);}setLoading(false);};
  const axes=[
    {key:"issues"    as keyof CommonData,label:"①訴求すべき課題",       color:"purple", desc:"背景＋課題を統合 ─ 「なぜ今この課題が深刻か」のストーリー"},
    {key:"strengths" as keyof CommonData,label:"②製品の強み",            color:"green",  desc:"選定理由から ─ 競合に勝てる自社ならではの価値"},
    {key:"values"    as keyof CommonData,label:"③導入の価値（効果）",    color:"amber",  desc:"導入効果から ─ 投資対効果として伝えられる成果"},
  ];
  return (
    <div>
      <div style={{marginBottom:20}}>
        <h2 style={{fontSize:20,fontWeight:800,color:"#1E293B",margin:0}}>Step 2 ｜ 訴求軸を抽出する</h2>
        <p style={{fontSize:14,color:"#64748B",marginTop:6}}>{cases.length}件の事例を横断比較し、訴求に使える3つの軸で共通点・固有点を整理します。</p>
      </div>
      <button onClick={run} disabled={loading} style={{width:"100%",padding:"14px",borderRadius:12,fontSize:15,fontWeight:800,background:loading?"#CBD5E1":ACCENT,color:"#fff",border:"none",cursor:loading?"not-allowed":"pointer",marginBottom:24}}>
        {loading?"🔄 分析中...":"✨ AIで訴求軸を抽出する"}
      </button>
      {commonData&&(
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          {axes.map(ax=>(
            <div key={ax.key} style={{background:"#fff",border:"1.5px solid #E2E8F0",borderRadius:14,padding:20}}>
              <div style={{display:"flex",alignItems:"baseline",gap:10,marginBottom:14}}>
                <Tag color={ax.color}>{ax.label}</Tag>
                <span style={{fontSize:12,color:"#94A3B8"}}>{ax.desc}</span>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
                {/* 共通点 */}
                <div>
                  <div style={{fontSize:12,fontWeight:800,color:"#64748B",marginBottom:8,letterSpacing:1}}>共 通 点 ─ 訴求の核</div>
                  {(commonData[ax.key]?.common||[]).map((item,i)=>(
                    <div key={i} style={{display:"flex",gap:6,alignItems:"flex-start",padding:"10px 12px",background:"#F0F9FF",borderRadius:8,fontSize:13,color:"#1E293B",marginBottom:6,borderLeft:`3px solid ${ACCENT}`}}>
                      <span style={{fontWeight:800,color:ACCENT,minWidth:20,flexShrink:0}}>{NUMS[i]}</span>
                      <span style={{lineHeight:1.7}}>{item}</span>
                    </div>
                  ))}
                </div>
                {/* 固有点 */}
                <div>
                  <div style={{fontSize:12,fontWeight:800,color:"#64748B",marginBottom:8,letterSpacing:1}}>固 有 点</div>
                  {(commonData[ax.key]?.unique||[]).map((item,i)=>(
                    <div key={i} style={{padding:"10px 14px",background:"#FFFBF0",borderRadius:8,fontSize:13,color:"#1E293B",marginBottom:8,borderLeft:`3px solid ${WARN}`,boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
                      <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:5}}>
                        <span style={{fontSize:11,fontWeight:800,color:"#fff",background:WARN,borderRadius:4,padding:"1px 7px"}}>{item.company}</span>
                      </div>
                      <div style={{lineHeight:1.75,color:"#374151"}}>{item.point}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
          <button onClick={onNext} style={{alignSelf:"flex-end",padding:"12px 32px",borderRadius:10,fontSize:15,fontWeight:800,background:ACCENT_DARK,color:"#fff",border:"none",cursor:"pointer",marginTop:4}}>Step 3へ進む →</button>
        </div>
      )}
    </div>
  );
}

// ─── STEP 3 ──────────────────────────────────────────────────────────────────
function Step3({ cases, commonData, productInfo }: {
  cases: CaseItem[];
  commonData: CommonData;
  productInfo: ProductInfo;
}) {
  const [loading,setLoading]=useState(false);
  const [scenarios,setScenarios]=useState<Scenario[]|null>(null);

  const run=async()=>{
    setLoading(true);
    try {
      const ctx=[productInfo.fetched,productInfo.note].filter(Boolean).join("\n");
      setScenarios(await analyzeScenario(commonData,ctx,[productInfo.companyName,productInfo.name].filter(Boolean).join(" / ")));
    } catch(e){alert("シナリオ生成に失敗: "+(e as Error).message);}
    setLoading(false);
  };

  // Suppress unused variable warning
  void cases;

  const colors=[
    {bg:"#EFF6FF",border:ACCENT,   num:ACCENT},
    {bg:"#F5F3FF",border:"#7C3AED",num:"#7C3AED"},
    {bg:"#ECFDF5",border:SUCCESS,  num:SUCCESS},
  ];
  const labels=[
    {key:"issue"        as keyof Scenario,icon:"①",label:"訴求すべき課題",           desc:"背景・課題から抽出"},
    {key:"externalTrend"as keyof Scenario,icon:"②",label:"課題を裏付ける外部動向",   desc:"権威機関の調査・発表を引用"},
    {key:"value"        as keyof Scenario,icon:"③",label:"検討する価値",             desc:"導入効果から抽出"},
    {key:"strength"     as keyof Scenario,icon:"④",label:"訴求すべき自社製品の強み", desc:"選定理由から抽出"},
  ];

  return (
    <div>
      <div style={{marginBottom:20}}>
        <h2 style={{fontSize:20,fontWeight:800,color:"#1E293B",margin:0}}>Step 3 ｜ 啓蒙シナリオを組み立てる</h2>
        <p style={{fontSize:14,color:"#64748B",marginTop:6}}>Step 2で抽出した訴求軸をもとに、顧客への課題啓蒙シナリオを3パターン生成します。</p>
        {productInfo.name&&(
          <div style={{display:"inline-flex",alignItems:"center",gap:8,marginTop:10,padding:"8px 14px",background:ACCENT_LIGHT,borderRadius:8,border:`1px solid #BFDBFE`}}>
            <span style={{fontSize:12,color:ACCENT,fontWeight:700}}>📦 対象製品：{[productInfo.companyName,productInfo.name].filter(Boolean).join(" / ")}</span>
          </div>
        )}
      </div>

      {/* Structure guide */}
      <div style={{background:"#F8FAFF",border:"1.5px solid #BFDBFE",borderRadius:12,padding:16,marginBottom:20}}>
        <div style={{fontSize:12,fontWeight:800,color:ACCENT,marginBottom:10}}>シナリオの構成</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
          {labels.map(lab=>(
            <div key={lab.key} style={{background:"#fff",borderRadius:8,padding:"10px 12px",border:"1px solid #BFDBFE"}}>
              <div style={{fontSize:16,fontWeight:900,color:ACCENT}}>{lab.icon}</div>
              <div style={{fontSize:12,fontWeight:700,color:"#1E293B",marginTop:2}}>{lab.label}</div>
              <div style={{fontSize:11,color:"#94A3B8",marginTop:2}}>{lab.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <button onClick={run} disabled={loading} style={{width:"100%",padding:"14px",borderRadius:12,fontSize:15,fontWeight:800,background:loading?"#CBD5E1":ACCENT,color:"#fff",border:"none",cursor:loading?"not-allowed":"pointer",marginBottom:24}}>
        {loading?"🔄 シナリオ生成中...":"✨ AIで啓蒙シナリオを生成する"}
      </button>

      {scenarios&&(
        <div style={{display:"flex",flexDirection:"column",gap:24}}>
          {scenarios.map((sc,i)=>{
            const c=colors[i%colors.length];
            return (
              <div key={i} style={{background:c.bg,border:`2px solid ${c.border}`,borderRadius:14,padding:24}}>
                <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:18}}>
                  <div style={{width:36,height:36,borderRadius:"50%",background:c.num,color:"#fff",fontWeight:900,fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"}}>{i+1}</div>
                  <div style={{fontSize:16,fontWeight:800,color:"#1E293B"}}>課題啓蒙シナリオ {i+1}</div>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:10}}>
                  {labels.map(lab=>(
                    <div key={lab.key} style={{background:"#fff",borderRadius:10,padding:"16px 18px",border:"1px solid #E2E8F0"}}>
                      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                        <span style={{fontSize:18,fontWeight:900,color:c.num}}>{lab.icon}</span>
                        <span style={{fontSize:13,fontWeight:800,color:"#1E293B"}}>{lab.label}</span>
                        <span style={{fontSize:11,color:"#94A3B8",marginLeft:4}}>— {lab.desc}</span>
                      </div>
                      <div style={{fontSize:14,color:"#1E293B",lineHeight:1.8}}>{sc[lab.key] as string}</div>
                      {lab.key==="strength" && sc.requirements && (
                        <div style={{marginTop:12,paddingTop:12,borderTop:"1px solid #E2E8F0"}}>
                          <div style={{fontSize:11,fontWeight:800,color:"#64748B",marginBottom:10,letterSpacing:1}}>この課題に対応できる理由</div>
                          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                            {[
                              {key:"functional"    as keyof Requirements,label:"機能要件",   desc:"何をするか",             color:"#1A56DB", bg:"#EFF6FF"},
                              {key:"nonFunctional" as keyof Requirements,label:"非機能要件", desc:"どのように動作するか",   color:"#7C3AED", bg:"#F5F3FF"},
                              {key:"operational"   as keyof Requirements,label:"運用要件",   desc:"どのように運用されるか", color:"#059669", bg:"#ECFDF5"},
                              {key:"environmental" as keyof Requirements,label:"環境要件",   desc:"どのような環境で動作するか", color:"#D97706", bg:"#FFFBEB"},
                            ].map(cat=>(
                              <div key={cat.key} style={{background:cat.bg,borderRadius:8,padding:"10px 12px",border:`1px solid ${cat.color}22`}}>
                                <div style={{fontSize:11,fontWeight:800,color:cat.color,marginBottom:6}}>{cat.label} <span style={{fontWeight:400,color:"#94A3B8"}}>— {cat.desc}</span></div>
                                {(sc.requirements[cat.key]||[]).map((pt,pi)=>(
                                  <div key={pi} style={{display:"flex",alignItems:"flex-start",gap:5,marginBottom:4}}>
                                    <span style={{color:cat.color,fontWeight:800,fontSize:11,marginTop:1,flexShrink:0}}>・</span>
                                    <span style={{fontSize:12,color:"#374151",lineHeight:1.6}}>{pt}</span>
                                  </div>
                                ))}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          <div style={{background:"#F8FAFF",border:"1.5px solid #BFDBFE",borderRadius:12,padding:16,fontSize:13,color:"#1e3a8a"}}>
            <strong>💡 活用ヒント：</strong>各シナリオの①〜④の流れで顧客に語りかけることで、課題への気づきを促し、自社製品の検討につなげることができます。
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MAIN APP ────────────────────────────────────────────────────────────────
export default function CaseAnalysisTool({ isAdmin = false }: { isAdmin?: boolean }) {
  const [activeTab,   setActiveTab]   = useState(0);
  const [productInfo, setProductInfo] = useState<ProductInfo>({companyName:"",name:"",url:"",note:"",fetched:""});
  const [cases,       setCases]       = useState<CaseItem[]>([{...EMPTY_CASE}]);
  const [commonData,  setCommonData]  = useState<CommonData|null>(null);

  useEffect(()=>{ loadPptxGenJS().catch(()=>{}); },[]);

  const doneCases = cases.filter(c=>c.analysis);

  const tabs=[
    {label:"Step 0",sub:"製品設定",  icon:"📦",locked:false},
    {label:"Step 1",sub:"事例分析",  icon:"📊",locked:false},
    {label:"Step 2",sub:"訴求軸抽出", icon:"🔍",locked:doneCases.length<2},
    {label:"Step 3",sub:"シナリオ",  icon:"🚀",locked:!commonData},
  ];

  return (
    <div style={{minHeight:"100vh",background:"linear-gradient(135deg,#F0F4FF 0%,#F8FAFF 50%,#EFF6FF 100%)",fontFamily:"'Noto Sans JP','Hiragino Kaku Gothic Pro',sans-serif"}}>

      <div style={{background:ACCENT_DARK,padding:"18px 32px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div>
          <div style={{color:"#93C5FD",fontSize:12,fontWeight:700,letterSpacing:2}}>SALES SCHOOL</div>
          <div style={{color:"#fff",fontSize:20,fontWeight:900,marginTop:2}}>事例分析ツール</div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:16}}>
          <div style={{color:"#93C5FD",fontSize:13}}>課題啓蒙型営業 / 要件啓蒙 シナリオ構築</div>
          {isAdmin&&(
            <a href="/admin" style={{padding:"6px 16px",borderRadius:8,background:"rgba(255,255,255,0.15)",color:"#fff",border:"1px solid rgba(255,255,255,0.3)",fontSize:12,fontWeight:700,textDecoration:"none",letterSpacing:0.5}}>
              ⚙️ 管理画面
            </a>
          )}
        </div>
      </div>

      <div style={{background:"#fff",borderBottom:"2px solid #E2E8F0",display:"flex",padding:"0 32px"}}>
        {tabs.map((t,i)=>{
          const isActive=activeTab===i;
          return (
            <button key={i} onClick={()=>!t.locked&&setActiveTab(i)} style={{padding:"16px 22px",border:"none",background:"none",cursor:t.locked?"not-allowed":"pointer",borderBottom:isActive?`3px solid ${ACCENT}`:"3px solid transparent",marginBottom:-2,transition:"all 0.15s"}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:18}}>{t.icon}</span>
                <div>
                  <div style={{fontSize:13,fontWeight:800,color:isActive?ACCENT:t.locked?"#CBD5E1":"#64748B"}}>{t.label}</div>
                  <div style={{fontSize:11,color:isActive?ACCENT:t.locked?"#CBD5E1":"#94A3B8"}}>{t.sub}</div>
                </div>
                {t.locked&&<span style={{fontSize:11,color:"#CBD5E1"}}>🔒</span>}
              </div>
            </button>
          );
        })}
        <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:10,padding:"0 8px"}}>
          {(productInfo.companyName||productInfo.name)&&<span style={{background:ACCENT_LIGHT,color:ACCENT,borderRadius:20,padding:"4px 12px",fontSize:12,fontWeight:700}}>📦 {[productInfo.companyName,productInfo.name].filter(Boolean).join(" / ")}</span>}
          {doneCases.length>0&&<span style={{background:"#F0FDF4",color:SUCCESS,borderRadius:20,padding:"4px 12px",fontSize:12,fontWeight:700}}>{doneCases.length}件分析済み</span>}
        </div>
      </div>

      <div style={{maxWidth:940,margin:"0 auto",padding:"28px 24px"}}>
        {activeTab===0&&<Step0 productInfo={productInfo} setProductInfo={setProductInfo} onNext={()=>setActiveTab(1)}/>}
        {activeTab===1&&<Step1 cases={cases} setCases={setCases} productInfo={productInfo} onNext={()=>setActiveTab(2)}/>}
        {activeTab===2&&<Step2 cases={doneCases} commonData={commonData} setCommonData={setCommonData} onNext={()=>setActiveTab(3)}/>}
        {activeTab===3&&commonData&&<Step3 cases={doneCases} commonData={commonData} productInfo={productInfo}/>}
      </div>
    </div>
  );
}
