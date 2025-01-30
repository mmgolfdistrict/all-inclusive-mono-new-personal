const fs = require("fs");
const { execSync } = require("child_process");
const path = require("path");

const revisionFilePath = path.join(__dirname, "../revision.json");
const buildUTCDate = new Date()
  .toISOString()
  .replace("T", " ")
  .replace(/\..+/, "");
let commitHash = "";

try {
  commitHash = execSync("git rev-parse HEAD").toString().trim();
} catch (error) {
  console.error("Failed to get commit hash:", error);
}

const revisionData = {
  buildUTCDate: buildUTCDate,
  commitHash: commitHash,
};

fs.writeFileSync(revisionFilePath, JSON.stringify(revisionData, null, 2));
console.log("Revision file created successfully.");
