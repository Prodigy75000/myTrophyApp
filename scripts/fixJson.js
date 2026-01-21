const fs = require("fs");
const path = require("path");

const RAW_FILE = path.join(process.cwd(), "data", "raw_master_db.json");

function fixJson() {
  if (!fs.existsSync(RAW_FILE)) {
    console.log("❌ No raw DB found.");
    return;
  }

  console.log("🩹 Reading raw DB...");
  let rawData = fs.readFileSync(RAW_FILE, "utf8").trim();

  // 1. Check if it's already valid
  try {
    JSON.parse(rawData);
    console.log("✅ JSON is already valid! No fix needed.");
    return;
  } catch (e) {
    console.log("⚠️ JSON is broken. Attempting repair...");
  }

  // 2. Remove the trailing comma if present
  if (rawData.endsWith(",")) {
    rawData = rawData.slice(0, -1);
  }

  // 3. Check if it ends with a closing bracket
  if (!rawData.endsWith("]")) {
    // If it cut off in the middle of an object (e.g. "... "title": "Elden Ri"),
    // we need to find the last complete object closing brace '}'
    const lastObjectEnd = rawData.lastIndexOf("}");

    if (lastObjectEnd === -1) {
      console.error(
        "❌ Could not find a single valid object. File might be too corrupted."
      );
      return;
    }

    // Keep everything up to the last '}' and add the closing ']'
    console.log(`✂️ Trimming partial data after character ${lastObjectEnd}...`);
    rawData = rawData.substring(0, lastObjectEnd + 1) + "]";
  }

  // 4. Verify and Save
  try {
    const parsed = JSON.parse(rawData);
    console.log(`✅ Repair successful! Recovered ${parsed.length} entries.`);
    fs.writeFileSync(RAW_FILE, JSON.stringify(parsed, null, 2));
    console.log(`💾 Saved fixed file to: ${RAW_FILE}`);
  } catch (e) {
    console.error("❌ Repair failed. The file structure is too damaged.");
    console.error(e.message);
  }
}

fixJson();
