// @ts-nocheck

export async function loadText(path: string): Promise<string> {
  if (typeof window !== "undefined" && window.fetch) {
    // Browser environment
    const response = await fetch(path);
    return await response.text();
  } else if (typeof require !== "undefined") {
    // Node.js environment
    const fs = require("fs");
    const pathModule = require("path");
    const filePath = pathModule.join(__dirname, path);
    return fs.readFileSync(filePath, "utf8");
  } else if (typeof process !== "undefined") {
    // Node, but ESM module
    const fs = await import("fs");
    const pathModule = await import("path");
    const filePath = pathModule.join(process.cwd(), path);
    return fs.readFileSync(filePath, "utf8");
  } else {
    throw new Error("Unknown environment");
  }
}


export function parseCSV(data: string, ...keys: string[]): any {
  const lines = data.split("\n").map(line => line.trim()).filter(line => line);
  const result: Object[][] = [];
  for (const line of lines) {
    if (line.startsWith("#") || line.trim() === "") {
      continue;
    }
    const values = line.split(",");
    const obj: any = {};
    keys.forEach((key, index) => {
      obj[key] = values[index] || null;
    });
    result.push(obj);
  }
  return result;
}