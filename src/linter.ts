import { parse } from "./lint_grammar.js";
import type { Font, Tagging } from "./models.js";

export type Severity = "ERROR" | "WARN" | "FAIL" | "INFO";
interface LintRule {
  rule: string; // The rule to be applied
  description: string; // Description of the rule
  severity: Severity; // Severity of the rule
}

interface LintWarning {
  description: string; // Description of the warning
  severity: Severity; // Severity of the warning
}
export type { LintRule, LintWarning };

export function linter(rules: LintRule[], font: Font): LintWarning[] {
  const tagDict: Record<string, number> = font.taggings.reduce(
    (acc, tagging) => {
      if ("score" in tagging) {
        // Only handle static taggings for now
        acc[tagging.tag.name] = tagging.score;
      }
      return acc;
    },
    {} as Record<string, number>
  );
  const errors: LintWarning[] = [];
  for (const rule of rules) {
    try {
      const result = parse(rule.rule, { tags: tagDict, family: font.name });
      if (result) {
        errors.push({
          description: rule.description,
          severity: rule.severity,
        });
      }
    } catch (error) {
      console.error("Error parsing rule:", rule.rule, error);
      errors.push({
        description: "Rule could not be parsed: " + rule.rule,
        severity: "ERROR",
      });
      continue;
    }
  }
  return errors;
}
