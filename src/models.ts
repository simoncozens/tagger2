import { linter } from "./linter";
import type { LintRule, Severity } from "./linter.js";
import { loadText } from "./utils";

export type Axis = {
  tag: string; // Axis tag, e.g. 'wght'
  min: number; // Minimum value for the axis
  max: number; // Maximum value for the axis
  value?: number; // Current value for the axis, optional
};
export type Location = {
  value: number; // Value for the axis
  tagName: string; // Name of the tag, e.g. 'Weight'
};

export type Exemplars = {
  high: FontTag[];
  low: FontTag[];
  medium: FontTag[];
};

export class FontTag {
  tagName: string;
  family: Font;
  location: Location[];
  score: number; // Score for the tag

  constructor(
    tagName: string,
    family: Font,
    location: Location[],
    score: number
  ) {
    this.tagName = tagName;
    this.family = family;
    this.location = location;
    this.score = score; // Score for the tag
  }
  toCSV() {
    const locationCSV = this.location
      .map((axis) => `${axis.tagName}:${axis.value}`)
      .join(";");
    return `${this.tagName},${this.family.name},${locationCSV},${this.score}`;
  }
  cssStyle(fontSize = 32) {
    if (this.location.length === 0) {
      return `font-family: ${this.family.name}; font-size: ${fontSize}pt;`;
    }
    let style = `font-family: "${this.family.name}", "Adobe NotDef"; font-size: ${fontSize}pt; font-variation-settings:`;
    for (let axis of this.location) {
      style += ` '${axis.tagName}' ${axis.value},`;
    }
    return style.slice(0, -1) + ";"; // Remove trailing comma and add semicolon
  }
}

export class FontTagGroup {
  tags: FontTag[]; // Array of FontTag objects

  constructor() {
    this.tags = [];
  }
  addTag(tag: FontTag) {
    this.tags.push(tag);
  }
}

export class TagDefinition {
  name: string;
  description: string;
  superShortDescription: string;
  related: string[]; // Array of related tag names

  constructor(
    name: string,
    description: string,
    superShortDescription: string,
    related: string[]
  ) {
    this.name = name;
    this.description = description;
    this.superShortDescription = superShortDescription;
    this.related = related;
  }
  exemplars(tags: Tags): Exemplars {
    const exemplars: Exemplars = {
      high: [],
      low: [],
      medium: [],
    };
    for (const tag of tags.items) {
      if (tag.tagName !== this.name) {
        continue;
      }
      if (tag.score > 80) {
        exemplars.high.push(tag);
      } else if (tag.score <= 20) {
        exemplars.low.push(tag);
      } else if (exemplars.medium.length < 3) {
        exemplars.medium.push(tag);
      }
    }
    // Choose top three high
    exemplars.high.sort((a, b) => b.score - a.score);
    exemplars.high = exemplars.high.slice(0, 3);
    // Choose lowest three low
    exemplars.low.sort((a, b) => a.score - b.score);
    exemplars.low = exemplars.low.slice(0, 3);
    console.log(`Exemplars for ${this.name}:`, exemplars);
    return exemplars;
  }
}

export class Font {
  name: string;
  axes: Axis[]; // Array of axis objects

  constructor(name: string, axes: Axis[]) {
    this.name = name;
    this.axes = axes; // Array of axis objects
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
  tagDefinitions: { [key: string]: TagDefinition }; // Object to hold tag definitions
  lintRules: LintRule[]; // Array to hold lint rules
  linter: any; // Linter instance

  constructor() {
    this.familyData = {};
    this.families = [];
    this.tagDefinitions = {};
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
    const lines = data.split("\n");
    for (let line of lines) {
      if (line.startsWith("#") || line.trim() === "") {
        continue;
      }
      let [rule, severity, description] = line.split(",");
      description = description.replace(/^"(.*)"$/, "$1");
      if (!rule || !description || !severity) {
        console.warn("Skipping line due to missing fields:", line);
        continue;
      }
      this.lintRules.push({
        rule: rule.trim(),
        description: description.trim(),
        severity: severity.trim() as Severity,
      });
    }
  }
  async getTagDefinitions() {
    let data = await loadText("tag_definitions.json");
    this.tagDefinitions = JSON.parse(data);
    for (let tagName in this.tagDefinitions) {
      const tagDef = this.tagDefinitions[tagName];
      this.tagDefinitions[tagName] = new TagDefinition(
        tagName,
        tagDef.description,
        tagDef.superShortDescription,
        tagDef.related || []
      );
    }
  }

  loadFamilies() {
    for (let familyName in this.familyData) {
      const axes = [];
      for (let axis of this.familyData[familyName].axes) {
        axes.push({
          tag: axis.tag,
          min: axis.min,
          max: axis.max,
        });
      }
      const family = new Font(familyName, axes);
      this.families.push(family);
    }
  }
  family(name: string) {
    return this.families.find((family) => family.name === name);
  }
  similarFamilies(name: string, count = 10) {
    const family = this.familyData[name];
    if (!family || !family.style) {
      console.warn(`Family not found (in similar): ${name}`);
      return [];
    }
    let distances = Object.values(this.familyData)
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
}

export class Tags {
  gf: GF; // Reference to the GF instance
  items: FontTag[]; // Array to hold FontTag objects
  categories: string[]; // Array to hold unique tag names (categories)

  constructor(gf: GF) {
    this.gf = gf;
    this.items = [];
    this.loadTags();
    this.categories = [];
  }
  toCSV() {
    return this.items.map((tag) => tag.toCSV()).join("\n");
  }
  addTag(tagName: string, fontName: string, axes: any[], score: number) {
    let family = this.gf.family(fontName);
    if (family === undefined || family.name === undefined) {
      console.warn("Family not found (adding tag):", fontName);
      return;
    }
    if (this.has(tagName, fontName)) {
      console.warn(
        `Tag ${tagName} for font ${fontName} already exists. Skipping addition.`
      );
      return;
    }
    const tag = new FontTag(tagName, family, axes, score);
    this.items.push(tag);

  }
  has(tagName: string, fontName: string): boolean {
    return this.items.some((tag) => {
      return tag.tagName === tagName && tag.family.name === fontName;
    });
  }
  sort() {
    this.items.sort((a, b) => a.tagName.localeCompare(b.tagName));
  }
  sortCategories() {
    this.categories.sort((a, b) => a.localeCompare(b));
  }
  loadTags(commit?: string) {
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
        const family = this.gf.family(familyName);
        if (family === undefined || family.name === undefined) {
          // console.warn("Family not found (loading tags):", familyName);
          continue;
        }
        const tag = new FontTag(tagName, family, [], score);
        this.items.push(tag);
        if (!this.categories.includes(tag.tagName)) {
          this.categories.push(tag.tagName);
        }
      }
    });
  }
}
