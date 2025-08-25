import { linter } from "./linter";
import type { LintRule, Severity } from "./linter.js";
import { loadText, parseCSV } from "./utils";

export type Axis = {
  tag: string; // Axis tag, e.g. 'wght'
  min: number; // Minimum value for the axis
  max: number; // Maximum value for the axis
  displayValue?: number; // Current value for the axis, optional
};

export type Location = Record<string, number>; // {"wght": 400, "wdth": 100} for example

export class Tag {
  name: string;
  description: string;
  superShortDescription: string;
  related: string[]; // Array of related tag names
  lowestScore: number; // Lowest score for the tag, optional
  highestScore: number; // Highest score for the tag, optional
  _exemplars?: Exemplars; // Optional exemplars, not used in constructor

  constructor(
    name: string,
    description: string,
    superShortDescription: string,
    related: string[],
    lowestScore: number,
    highestScore: number
  ) {
    this.name = name;
    this.description = description;
    this.superShortDescription = superShortDescription;
    this.related = related;
    this.lowestScore = lowestScore;
    this.highestScore = highestScore;
  }
  get friendlyName() {
    const [_, area, category] = this.name.split("/");
    if (area == "Sans" || area == "Serif" || area == "Script") {
      return `${category} ${area.toLowerCase()}`;
    }
    if (area == "Theme" || area == "Expressive" || area == "Purpose") {
      return category.toLowerCase();
    }
    if (area == "Quality") {
      return `High-Quality ${category.toLowerCase()}`;
    }
    if (area == "Seasonal" || area == "Special use") {
      return `${category} (${area.toLowerCase()})`;
    }

    return this.name;
  }
  exemplars(gf: GF): Exemplars {
    if (this._exemplars) {
      return this._exemplars; // Return cached exemplars if available
    }
    const exemplars: Exemplars = {
      high: [],
      low: [],
      medium: [],
    };
    for (const tagging of gf.allTaggings) {
      if (tagging.tag.name !== this.name) {
        continue;
      }
      // Only consider static tags for now
      if ("scores" in tagging) {
        // Variable tagging, we can skip it for now
        continue;
      }
      if (tagging.score > 80) {
        exemplars.high.push(tagging);
      } else if (tagging.score <= 20) {
        exemplars.low.push(tagging);
      } else if (
        tagging.score > 33 &&
        tagging.score < 66 &&
        exemplars.medium.length < 3
      ) {
        exemplars.medium.push(tagging);
      }
    }
    // Choose top three high
    exemplars.high.sort((a, b) => b.score - a.score);
    exemplars.high = exemplars.high.slice(0, 3);
    // Choose lowest three low
    exemplars.low.sort((a, b) => a.score - b.score);
    exemplars.low = exemplars.low.slice(0, 3);
    console.log(`Exemplars for ${this.name}:`, exemplars);
    // Cache the exemplars
    this._exemplars = exemplars;
    return exemplars;
  }
}

// An association between a tag and a font which applies to all parts of the designspace
export class StaticTagging {
  // The font family this tagging applies to.
  // This may seem superfluous, but sometimes it's useful to pass a list of tag objects
  // and know which family they belong to.
  font: Font;
  tag: Tag;
  score: number;
  constructor(font: Font, tag: Tag, score: number) {
    this.font = font;
    this.tag = tag;
    this.score = score;
  }
  toCSV(): string {
    return `${this.font.name},,${this.tag.name},${this.score}\n`;
  }
};

// A tagging which has different scores for different locations in the designspace
export class VariableTagging {
  font: Font; // Optional, can be undefined if not applicable
  tag: Tag;
  scores: { location: Location; score: number }[];

  constructor(
    font: Font,
    tag: Tag,
    scores: { location: Location; score: number }[]
  ) {
    this.font = font;
    this.tag = tag;
    this.scores = scores;
  }
  // Get the score for a specific location
  scoreAt(location: Location): number | undefined {
    const scoreEntry = this.scores.find((s) => {
      // ({"wght": 400}) != ({"wght": 400}) because it's not the same object
      // EVEN THOUGH WE DID NOT ASK FOR STRICT EQUALITY WITH !==
      // JAVASCRIPT WHAT IS WRONG WITH YOU
      return JSON.stringify(s.location) == JSON.stringify(location);
    });
    return scoreEntry ? scoreEntry.score : undefined;
  }
  // Just get a score, I don't care
  get score(): number {
    console.warn(
      `Using VariableTagging.score for tag ${this.tag.name}, this is not recommended. Use scoreAt(location) instead.`
    );
    if (this.scores.length === 0) {
      return 0; // No scores available
    }
    // Return the average score for simplicity
    const totalScore = this.scores.reduce((sum, s) => sum + s.score, 0);
    return totalScore / this.scores.length;
  }

  toCSV(): string {
    let csv = "";
    for (let scoreEntry of this.scores) {
      let gfStyleLocation = Object.keys(scoreEntry.location).join(",") + "@" + Object.values(scoreEntry.location).join(",");
      csv += `${this.font.name},"${gfStyleLocation}",${this.tag.name},${scoreEntry.score}\n`;
    }
    return csv;
  }
}
export type Tagging = StaticTagging | VariableTagging;

export type Exemplars = {
  // For now we keep these static
  high: StaticTagging[];
  low: StaticTagging[];
  medium: StaticTagging[];
};

export class Font {
  name: string;
  axes: Axis[]; // Array of axis objects
  taggings: Tagging[]; // Array to hold taggings

  constructor(name: string, axes: Axis[], taggings: Tagging[] = []) {
    this.name = name;
    this.axes = axes;
    this.taggings = taggings;
  }

  get isVF() {
    return this.axes.length > 0;
  }

  cssStyle(fontSize = 32) {
    if (!this.isVF) {
      return `font-family: '${this.name}'; font-size: ${fontSize}pt;`;
    }
    let res = `font-family: '${this.name}'; font-size: ${fontSize}pt; font-variation-settings:`;
    this.axes.forEach((axis) => {
      res += ` '${axis.tag}' ${axis.min}..${axis.max},`;
    });
    return res.slice(0, -1) + ";"; // Remove trailing comma and add semicolon
  }

  hasTagging(tagName: string): boolean {
    return this.taggings.some((tagging) => {
      return tagging.tag.name === tagName;
    });
  }

  addTagging(tagging: Tagging) {
    if (this.hasTagging(tagging.tag.name)) {
      console.warn(
        `Tagging for tag ${tagging.tag.name} already exists in family ${this.name}.`
      );
      return;
    }
    this.taggings.push(tagging);
  }

  removeTagging(tagging: Tagging) {
    this.taggings = this.taggings.filter((t) => t !== tagging);
  }

  get url() {
    let path = `https://fonts.googleapis.com/css2?family=${this.name.replace(
      / /g,
      "+"
    )}`;
    // GF api wants the axes in sorted alphabetical order. However, axes with
    // caps are last
    const sortedUpperCaseAxes = [];
    const sortedLowerCaseAxes = [];
    for (let a of this.axes) {
      if (a.tag.toUpperCase() === a.tag) {
        sortedUpperCaseAxes.push(a);
      } else {
        sortedLowerCaseAxes.push(a);
      }
    }
    sortedLowerCaseAxes.sort((a, b) => a.tag.localeCompare(b.tag));
    sortedUpperCaseAxes.sort((a, b) => a.tag.localeCompare(b.tag));
    const sortedAxes = [...sortedLowerCaseAxes, ...sortedUpperCaseAxes];
    if (this.axes.length > 0) {
      path +=
        ":" +
        sortedAxes
          .map((a) => {
            return a.tag;
          })
          .join(",");
      path += "@";
      path += sortedAxes
        .map((axis) => {
          return `${Number(axis.min)}..${Number(axis.max)}`;
        })
        .join(",");
    }
    return path;
  }
}

export class GF {
  familyData: { [key: string]: any }; // Object to hold family metadata
  families: Font[]; // Array to hold Font objects
  loadedFamilies: Font[]; // We add families to the CSS on demand to speed up loading
  tags: { [key: string]: Tag }; // Object to hold tag definitions
  lintRules: LintRule[]; // Array to hold lint rules
  linter: any; // Linter instance

  constructor() {
    this.familyData = {};
    this.families = [];
    this.tags = {};
    this.lintRules = [];
    this.linter = linter;
    this.loadedFamilies = [];
  }
  async getFamilyData() {
    let data = await loadText("family_data.json");
    let parsedData: any = JSON.parse(data);
    let familyMeta = parsedData["familyMetadataList"];
    let styleEmbeddingsData = await loadText("embeddings.json");
    let styleEmbeddings = JSON.parse(styleEmbeddingsData);
    familyMeta.forEach((family: any) => {
      this.familyData[family.family] = family;
      if (family.family in styleEmbeddings) {
        this.familyData[family.family].style = styleEmbeddings[family.family];
      }
    });
  }
  async getLintRules() {
    let data = await loadText("tag_rules.csv");
    let csvData = parseCSV(data, "rule", "severity", "description");

    for (let item of csvData) {
      this.lintRules.push({
        rule: item.rule.trim(),
        description: item.description.trim(),
        severity: item.severity.trim() as Severity,
      });
    }
  }
  async getTagDefinitions() {
    let data = await loadText("tag_definitions.json");
    this.tags = JSON.parse(data);

    let tagScoreData = await loadText("tags_metadata.csv");
    let csvData = parseCSV(
      tagScoreData,
      "name",
      "lowScore",
      "highScore",
      "description"
    );

    for (let category of csvData) {
      const tagDef = this.tags[category.name];
      // TODO all categories should be listed in the .json file
      if (!category.name || !this.tags[category.name]) {
        this.tags[category.name] = new Tag(
          category.name.trim(),
          "",
          "",
          [],
          0,
          100
        );
      } else {
        this.tags[category.name] = new Tag(
          category.name.trim(),
          tagDef.description || "",
          tagDef.superShortDescription || "",
          tagDef.related || [],
          Number(category.lowScore),
          Number(category.highScore)
        );
      }
    }
  }
  get sortedTagNames(): string[] {
    return Object.keys(this.tags).sort((a, b) => {
      return a.localeCompare(b);
    });
  }
  get allTaggings(): Tagging[] {
    let taggings: Tagging[] = [];
    for (let family of this.families) {
      taggings.push(...family.taggings);
    }
    return taggings;
  }
  loadFamilies() {
    for (let familyName in this.familyData) {
      const axes = [];
      for (let axis of this.familyData[familyName].axes) {
        axes.push({
          tag: axis.tag,
          min: axis.min,
          max: axis.max,
          displayValue: axis.defaultValue, // Default to midpoint
        });
      }
      const family = new Font(familyName, axes);
      this.families.push(family);
    }
  }
  family(name: string) {
    return this.families.find((family) => family.name === name);
  }
  similarFamilies(name: string, count = 10): string[] {
    const family = this.familyData[name];
    if (!family || !family.style) {
      console.warn(`Family not found (in similar): ${name}`);
      return [];
    }
    let distances: [string, number][] = Object.values(this.familyData)
      .filter(
        (f) => f.style // New fonts may not have style embeddings
      )
      .map((f) => {
        // Compute norm between the style embeddings
        let distance = family.style
          .map((value: number, index: number) => {
            return (value - (f.style[index] || 0)) ** 2;
          })
          .reduce((a: number, b: number) => a + b, 0);
        return [f.family, Math.sqrt(distance)];
      });
    distances.sort((a, b) => a[1] - b[1]);
    return distances
      .slice(0, count)
      .map((item) => item[0])
      .filter((familyName) => familyName !== name);
  }
  ensureLoaded(family: string) {
    // We could use a Set for this but Vue can't diff them
    let font = this.families.find((f) => f.name === family);
    if (font && !this.loadedFamilies.includes(font)) {
      this.loadedFamilies.push(font);
    }
  }

  uniqueTagNames(): string[] {
    return Object.keys(this.tags).sort();
  }

  loadTaggings(commit?: string) {
    if (commit === undefined) {
      commit = "refs/head/main"; // Default to main branch if no commit is specified
    }
    // TODO send this back to urls once testing is done
    loadText("families_new.csv").then((csvText) => {
      const lines = csvText.split("\n");
      for (let line of lines) {
        const [familyName, axes, tagName, scoreStr] = line.split(",");
        let score: number = parseFloat(scoreStr);
        if (!familyName || !tagName) {
          console.warn(
            "Skipping line due to missing family name or tag name:",
            line
          );
          continue;
        }
        const family = this.family(familyName);
        if (family === undefined || family.name === undefined) {
          // console.warn("Family not found (loading tags):", familyName);
          continue;
        }
        family.taggings.push(new StaticTagging(family, this.tags[tagName], score));
      }
    });
  }

  exportTaggings(): string {
    let csv = "";
    for (let family of this.families.sort((a, b) => a.name.localeCompare(b.name))) {
      for (let tagging of family.taggings.sort((a, b) => a.tag.name.localeCompare(b.tag.name))) {
        csv += tagging.toCSV();
      }
    }
    return csv
  }
}
