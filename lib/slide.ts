import type { CaseItem } from "./types";

/* eslint-disable @typescript-eslint/no-explicit-any */

export function loadPptxGenJS(): Promise<any> {
  return new Promise((resolve, reject) => {
    if ((window as any).PptxGenJS) {
      resolve((window as any).PptxGenJS);
      return;
    }
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/pptxgenjs/3.12.0/pptxgen.bundle.js";
    s.onload = () => resolve((window as any).PptxGenJS);
    s.onerror = () => reject(new Error("PptxGenJS の読み込みに失敗しました"));
    document.head.appendChild(s);
  });
}

/**
 * Generate slide — faithful reproduction of the original case-analysis-tool.jsx layout.
 */
async function generateSlide(caseData: CaseItem) {
  const PptxGenJS = await loadPptxGenJS();
  const pres = new PptxGenJS();
  pres.layout = "LAYOUT_16x9";
  const slide = pres.addSlide();
  const { caseTitle: title, analysis } = caseData;

  const bg = analysis?.background || [];
  const ch = analysis?.challenges || [];
  const re = analysis?.reasons || [];
  const ef = analysis?.effects || [];

  // ── 背景：白
  slide.background = { color: "FFFFFF" };

  // ── 左カラム背景（紺）
  const LX = 0, LW = 2.7, SH = 5.625;
  slide.addShape(pres.shapes.RECTANGLE, {
    x: LX, y: 0, w: LW, h: SH,
    fill: { color: "1e3a8a" }, line: { color: "1e3a8a" },
  });

  // ── ロゴ枠
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.18, y: 0.18, w: 2.34, h: 0.9,
    fill: { color: "FFFFFF" }, line: { color: "CCCCCC", width: 1 },
  });
  slide.addText("お客様のロゴ", {
    x: 0.18, y: 0.18, w: 2.34, h: 0.9,
    fontSize: 10, color: "999999", align: "center", valign: "middle",
  });

  // ── キーメッセージ枠
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.18, y: 1.3, w: 2.34, h: 1.3,
    fill: { color: "FFFFFF" }, line: { color: "CCCCCC", width: 1 },
  });
  slide.addText(title || "事例のキーメッセージ", {
    x: 0.18, y: 1.3, w: 2.34, h: 1.3,
    fontSize: 10, color: "1e3a8a", align: "center", valign: "middle", wrap: true,
  });

  // ── 選定の理由①②③（左下3枠）
  const reasons3 = re.slice(0, 3);
  const boxH = 0.72, boxY0 = 2.85, gap = 0.08;
  reasons3.forEach((r: string, i: number) => {
    const y = boxY0 + i * (boxH + gap);
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0.18, y, w: 2.34, h: boxH,
      fill: { color: "FFFFFF" }, line: { color: "CCCCCC", width: 1 },
    });
    slide.addText(r, {
      x: 0.22, y, w: 2.26, h: boxH,
      fontSize: 8.5, color: "1e3a8a", align: "center", valign: "middle", wrap: true,
    });
  });

  // ── 右エリア
  const RX = LX + LW + 0.18;
  const RW = 10 - RX - 0.18;

  // タイトルバー
  slide.addShape(pres.shapes.RECTANGLE, {
    x: RX, y: 0.15, w: RW, h: 0.5,
    fill: { color: "F0F0F0" }, line: { color: "CCCCCC", width: 0.5 },
  });
  slide.addText(title || "お客様の取り組みサマリ（タイトル）", {
    x: RX + 0.1, y: 0.15, w: RW - 0.2, h: 0.5,
    fontSize: 12, bold: false, color: "333333", valign: "middle",
  });

  // 4セクション
  const sections = [
    { label: "ご検討の背景", items: bg, color: "1A56DB" },
    { label: "当時の課題",   items: ch, color: "1A56DB" },
    { label: "製品選定理由", items: re, color: "1A56DB" },
    { label: "導入の効果",   items: ef, color: "1A56DB" },
  ];

  let curY = 0.82;
  const secGap = 0.06;
  const labelH = 0.24;
  const itemH = 0.22;

  sections.forEach((sec) => {
    // セクションラベル
    slide.addText(sec.label, {
      x: RX, y: curY, w: RW, h: labelH,
      fontSize: 11, bold: false, color: sec.color, valign: "middle",
    });
    curY += labelH;

    // 箇条書き3点
    sec.items.slice(0, 3).forEach((item: string) => {
      slide.addText([
        { text: "●  ", options: { color: sec.color, fontSize: 8 } },
        { text: item,   options: { color: "333333",   fontSize: 9 } },
      ], {
        x: RX + 0.1, y: curY, w: RW - 0.1, h: itemH,
        valign: "middle", wrap: true,
      });
      curY += itemH;
    });
    curY += secGap;
  });

  return pres;
}

export async function downloadSlideFile(caseData: CaseItem) {
  const pres = await generateSlide(caseData);
  const fileName = `${caseData.caseTitle || caseData.companyName || "事例分析"}.pptx`;
  await pres.writeFile({ fileName });
}
