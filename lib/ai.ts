import type { CommonData } from "./types";

// ─── SSE Stream Helper ───────────────────────────────────────────────────────
type OnProgress = (text: string) => void;

interface StreamRequestBody {
  model: string;
  max_tokens: number;
  messages: unknown[];
  action: string;
}

function parseErrorResponse(text: string, status: number): string {
  try {
    const data = JSON.parse(text);
    if (data.error) return data.error;
  } catch { /* not JSON */ }
  if (status === 429) return "⏳ リクエスト上限に達しました。しばらくしてから再度お試しください。";
  if (status === 401) {
    // Token expired or invalid — redirect to top
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
    return "アクセストークンが無効です。Noteの限定記事内のリンクから再度アクセスしてください。";
  }
  return `APIエラーが発生しました (${status})。時間をおいて再度お試しください。`;
}

async function streamClaude(
  body: StreamRequestBody,
  onProgress?: OnProgress
): Promise<string> {
  // If no progress callback, use the non-streaming endpoint for simplicity
  if (!onProgress) {
    const res = await fetch("/api/claude", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(parseErrorResponse(errText, res.status));
    }
    const data = await res.json();
    return (
      data.content?.find((b: { type: string; text?: string }) => b.type === "text")?.text || ""
    );
  }

  const res = await fetch("/api/claude/stream", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(parseErrorResponse(errText, res.status));
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let accumulated = "";
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const jsonStr = line.slice(6);
      if (jsonStr === "[DONE]") continue;

      try {
        const event = JSON.parse(jsonStr);
        if (event.type === "content_block_delta" && event.delta?.text) {
          accumulated += event.delta.text;
          onProgress(accumulated);
        }
      } catch {
        // Skip non-JSON SSE lines
      }
    }
  }

  return accumulated;
}

// ─── AI Functions ────────────────────────────────────────────────────────────

export async function fetchProductInfo(
  companyName: string,
  productName: string,
  url: string,
  onProgress?: OnProgress
): Promise<string> {
  const subject = [companyName, productName].filter(Boolean).join(" / ");
  const urlLine = url
    ? `\n参考URL（補足情報として参照）: ${url}`
    : "";

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

  return streamClaude(
    {
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
      action: "fetch_product",
    },
    onProgress
  );
}

export async function analyzeCase(
  text: string,
  productInfo: string,
  onProgress?: OnProgress
) {
  const productCtx = productInfo
    ? `\n\n【分析対象製品の情報】\n${productInfo}`
    : "";
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
  "companyName": "企業名（例：東海電子部品株式会社）",
  "caseTitle": "この事例を一言で表すタイトル（例：製造業の営業プロセス標準化でリードタイム50%短縮）",
  "companySize": "従業員規模と業種（例：約15,000名（電子部品メーカー））",
  "background": ["背景の要点1（40字程度）","背景の要点2","背景の要点3"],
  "challenges": ["課題の要点1（具体的な困りごとを40字程度）","課題の要点2","課題の要点3"],
  "reasons": ["選定理由1（なぜ評価されたかを40字程度）","選定理由2","選定理由3"],
  "effects": ["導入効果1（数字・成果・理由を含めて50字程度）","導入効果2","導入効果3"]
}
各項目は必ず3点にし、出力例と同様の文体・粒度でまとめてください。`;

  const raw = await streamClaude(
    {
      model: "claude-sonnet-4-20250514",
      max_tokens: 1200,
      messages: [{ role: "user", content: prompt }],
      action: "analyze_case",
    },
    onProgress
  );
  try {
    return JSON.parse(raw.replace(/```json|```/g, "").trim());
  } catch {
    throw new Error("parse_failed");
  }
}

export async function analyzeCasePDF(
  base64: string,
  productInfo: string,
  onProgress?: OnProgress
) {
  const productCtx = productInfo
    ? `\n\n【分析対象製品の情報】\n${productInfo}`
    : "";
  const instruction = `あなたは営業コンサルタントです。添付のPDF（事例資料）を分析し、4つの軸で整理してください。${productCtx}

以下のJSON形式のみで回答してください:
{
  "companyName": "企業名（例：東海電子部品株式会社）",
  "caseTitle": "この事例を一言で表すタイトル（例：製造業の営業プロセス標準化でリードタイム50%短縮）",
  "companySize": "従業員規模と業種（例：約15,000名（電子部品メーカー））",
  "background": ["背景の要点1（40字程度）","背景の要点2","背景の要点3"],
  "challenges": ["課題の要点1（具体的な困りごとを40字程度）","課題の要点2","課題の要点3"],
  "reasons": ["選定理由1（なぜ評価されたかを40字程度）","選定理由2","選定理由3"],
  "effects": ["導入効果1（数字・成果・理由を含めて50字程度）","導入効果2","導入効果3"]
}
各項目は必ず3点にし、具体的な文体・粒度でまとめてください。`;

  const raw = await streamClaude(
    {
      model: "claude-sonnet-4-20250514",
      max_tokens: 1200,
      messages: [
        {
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
        },
      ],
      action: "analyze_case",
    },
    onProgress
  );
  try {
    return JSON.parse(raw.replace(/```json|```/g, "").trim());
  } catch {
    throw new Error(
      "PDFから事例情報を抽出できませんでした。導入事例PDFを指定してください"
    );
  }
}

export async function analyzeCommon(
  cases: { companyName: string; caseTitle: string; analysis: NonNullable<import("./types").CaseItem["analysis"]> }[],
  onProgress?: OnProgress
) {
  const caseNames = cases
    .map((c) => [c.companyName, c.caseTitle].filter(Boolean).join(" / ") || "事例")
    .join("、");
  const summaries = cases
    .map(
      (c, i) =>
        `【事例${i + 1}: ${[c.companyName, c.caseTitle].filter(Boolean).join(" / ") || `事例${i + 1}`}】\n背景: ${c.analysis.background.join(" / ")}\n課題: ${c.analysis.challenges.join(" / ")}\n選定理由: ${c.analysis.reasons.join(" / ")}\n効果: ${c.analysis.effects.join(" / ")}`
    )
    .join("\n\n");

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

  const raw = await streamClaude(
    {
      model: "claude-sonnet-4-20250514",
      max_tokens: 2500,
      messages: [{ role: "user", content: prompt }],
      action: "analyze_common",
    },
    onProgress
  );
  return JSON.parse(raw.replace(/```json|```/g, "").trim());
}

export async function analyzeScenario(
  commonData: CommonData,
  productInfo: string,
  productName: string,
  onProgress?: OnProgress
) {
  const productCtx = productInfo
    ? `\n\n【製品名】${productName}\n【製品情報】\n${productInfo}`
    : productName
      ? `\n\n【製品名】${productName}`
      : "";

  const prompt = `あなたは課題啓蒙型営業のエキスパートです。以下の情報をもとに、顧客への営業シナリオを3つ作成してください。${productCtx}

【事例分析結果】
訴求すべき共通課題: ${commonData.issues?.common?.join(" / ") || ""}
製品の共通の強み: ${commonData.strengths?.common?.join(" / ") || ""}
共通の導入効果: ${commonData.values?.common?.join(" / ") || ""}

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

  const raw = await streamClaude(
    {
      model: "claude-sonnet-4-20250514",
      max_tokens: 4000,
      messages: [{ role: "user", content: prompt }],
      action: "analyze_scenario",
    },
    onProgress
  );
  const match = raw.match(/\[[\s\S]*\]/);
  if (!match) throw new Error("シナリオのJSON取得に失敗しました");
  return JSON.parse(match[0]);
}
