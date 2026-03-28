export interface CaseItem {
  companyName: string;
  caseTitle: string;
  input: string;
  inputType: string;
  analysis: Analysis | null;
  loading: boolean;
}

export interface Analysis {
  companyName?: string;
  caseTitle?: string;
  companySize?: string;
  background: string[];
  challenges: string[];
  reasons: string[];
  effects: string[];
}

export interface ProductInfo {
  companyName: string;
  name: string;
  url: string;
  note: string;
  fetched: string;
}

export interface UniquePoint {
  company: string;
  point: string;
}

export interface AxisData {
  common: string[];
  unique: UniquePoint[];
}

export interface CommonData {
  issues: AxisData;
  strengths: AxisData;
  values: AxisData;
}

export interface Requirements {
  functional: string[];
  nonFunctional: string[];
  operational: string[];
  environmental: string[];
}

export interface Scenario {
  title: string;
  issue: string;
  externalTrend: string;
  value: string;
  strength: string;
  requirements: Requirements;
}

export const EMPTY_CASE: CaseItem = {
  companyName: "",
  caseTitle: "",
  input: "",
  inputType: "text",
  analysis: null,
  loading: false,
};

export const MAX_CASES = 5;

export const ACCENT = "#1A56DB";
export const ACCENT_LIGHT = "#EFF6FF";
export const ACCENT_DARK = "#1e3a8a";
export const SUCCESS = "#059669";
export const WARN = "#D97706";
export const NUMS = ["①", "②", "③", "④"];
