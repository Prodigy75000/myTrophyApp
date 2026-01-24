// export_ps_legacy_names.js
// Reads master_games.json and outputs displayName for entries that:
// - have NO PS5 versions
// - do NOT have the "shovelware" tag

const fs = require("fs");
const path = require("path");

const INPUT_JSON = path.join(process.cwd(), "master_games.json");
const OUTPUT_TXT = path.join(process.cwd(), "PSLegacyShovelwarePass.txt");

function platformHasPS5(platformValue) {
  if (!platformValue) return false;

  const parts = String(platformValue)
    .split(",")
    .map((p) => p.trim().toUpperCase())
    .filter(Boolean);

  return parts.includes("PS5");
}

function entryHasAnyPS5(entry) {
  const linked = Array.isArray(entry?.linkedVersions) ? entry.linkedVersions : [];
  return linked.some((lv) => platformHasPS5(lv?.platform));
}

function entryHasShovelwareTag(entry) {
  const tags = Array.isArray(entry?.tags) ? entry.tags : [];
  return tags.some((t) => String(t).trim().toLowerCase() === "shovelware");
}

function main() {
  if (!fs.existsSync(INPUT_JSON)) {
    console.error(`Input file not found: ${INPUT_JSON}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(INPUT_JSON, "utf8");

  let data;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    console.error("Failed to parse JSON. Make sure master_games.json is valid JSON.");
    console.error(e.message);
    process.exit(1);
  }

  if (!Array.isArray(data)) {
    console.error("Expected master_games.json to be a JSON array of entries.");
    process.exit(1);
  }

  const names = [];
  for (const entry of data) {
    if (entryHasAnyPS5(entry)) continue; // exclude anything with PS5
    if (entryHasShovelwareTag(entry)) continue; // exclude shovelware-tagged

    const name = entry?.displayName;
    if (typeof name === "string" && name.trim().length > 0) {
      names.push(name.trim());
    }
  }

  // Optional: de-dupe + sort (comment out if you want raw order)
  const uniqueSorted = Array.from(new Set(names)).sort((a, b) =>
    a.localeCompare(b, "en", { sensitivity: "base" })
  );

  fs.writeFileSync(OUTPUT_TXT, uniqueSorted.join("\n") + "\n", "utf8");

  console.log(`Done.`);
  console.log(`Input entries: ${data.length}`);
  console.log(`Output (no PS5, not shovelware) unique names: ${uniqueSorted.length}`);
  console.log(`Wrote: ${OUTPUT_TXT}`);
}

main();
