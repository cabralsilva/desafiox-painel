import { IQualifiedRule, IQualifiedsSlots } from "@/types/championship-phase";
// import type { QualifiedRule, QualifiedSlot } from "@/types/championship";

function positionLabel(position: number): string {
  return `${position}º`;
}

export function getSlotCountForRule(
  rule: IQualifiedRule,
  groups: Array<{ name: string }>
): number {
  if (rule.mode === "POSITION_GENERAL") return rule.limit;
  return groups.length;
}

function getAutoLabelsForRule(rule: IQualifiedRule, groups: Array<{ name: string }>): string[] {
  if (rule.mode === "POSITION_GENERAL") {
    return Array.from({ length: rule.limit }, (_, j) => `${j + 1}º Colocado GERAL`);
  }
  return groups.map((g) => `${positionLabel(rule.position)} colocado do ${g.name}`);
}

export function getLabelsForRule(rule: IQualifiedRule, groups: Array<{ name: string }>): string[] {
  const custom = rule.label?.trim();
  if (custom) {
    const n = rule.mode === "POSITION_INTO_GROUP" ? groups.length : rule.limit;
    return Array.from({ length: n }, (_, j) =>
      n === 1
        ? custom
        : rule.mode === "POSITION_INTO_GROUP"
          ? `${custom} - ${groups[j].name}`
          : `${custom} (${j + 1})`
    );
  }
  return getAutoLabelsForRule(rule, groups);
}

export function buildQualifiedsSlots(
  qualifiedRules: IQualifiedRule[],
  groups: Array<{ name: string }>
): IQualifiedsSlots[] {
  if (groups.length === 0) return [];
  const sortedRules = [...qualifiedRules].sort((a, b) => a.priority - b.priority);
  const result: IQualifiedsSlots[] = [];
  for (const rule of sortedRules) {
    const customLabel = rule.label?.trim();
    if (customLabel) {
      const n = rule.mode === "POSITION_INTO_GROUP" ? groups.length : rule.limit;
      for (let j = 0; j < n; j++) {
        const group = rule.mode === "POSITION_INTO_GROUP" ? groups[j].name : "";
        const label =
          n === 1
            ? customLabel
            : rule.mode === "POSITION_INTO_GROUP"
              ? `${customLabel} - ${groups[j].name}`
              : `${customLabel} (${j + 1})`;
        result.push({
          _id: "",
          label,
          team: null,
          priority: rule.priority,
          position: rule.position,
          group,
        });
      }
      continue;
    }
    if (rule.mode === "POSITION_GENERAL") {
      for (let j = 0; j < rule.limit; j++) {
        result.push({
          _id: "",
          label: `${j + 1}º Colocado GERAL`,
          team: null,
          priority: rule.priority,
          position: rule.position,
          group: "",
        });
      }
    } else {
      for (const group of groups) {
        result.push({
          _id: "",
          label: `${positionLabel(rule.position)} colocado do ${group.name}`,
          team: null,
          priority: rule.priority,
          position: rule.position,
          group: group.name,
        });
      }
    }
  }
  return result;
}
