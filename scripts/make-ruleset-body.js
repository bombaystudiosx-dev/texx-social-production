const fs = require("fs");
const path = require("path");
const rulesPath = path.join(__dirname, "..", "firestore.rules");
const content = fs.readFileSync(rulesPath, "utf8");
const body = { source: { files: [{ name: "firestore.rules", content }] } };
process.stdout.write(JSON.stringify(body));
