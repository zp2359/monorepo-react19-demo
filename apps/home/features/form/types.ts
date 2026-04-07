export type FieldOption = { value: string; label: string };

export type FieldDef = {
  id: string;
  type: string;
  label: string;
  required?: boolean;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  options?: FieldOption[];
  checkboxLabel?: string;
};

export type SectionDef = {
  id: string;
  label: string;
  multiplier: number;
  fields: FieldDef[];
};

export type GroupDef = {
  id: string;
  label: string;
  weight: number;
  sections: SectionDef[];
};

export type FormSchema = {
  version: number;
  title: string;
  groups: GroupDef[];
};

export type FieldValue = string | number | boolean;
export type FormValues = Record<string, FieldValue>;
export type FormResult = { ok: true; message: string; at: number };

export type ScoreSnapshot = {
  sectionScores: Record<string, number>;
  groupScores: Record<string, number>;
  total: number;
  filled: number;
};
