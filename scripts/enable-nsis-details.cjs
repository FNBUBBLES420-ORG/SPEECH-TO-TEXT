const fs = require("node:fs")
const path = require("node:path")

const templatePath = path.join(
  process.cwd(),
  "node_modules",
  "app-builder-lib",
  "templates",
  "nsis",
  "installSection.nsh"
)

if (!fs.existsSync(templatePath)) {
  throw new Error(`NSIS install section template was not found: ${templatePath}`)
}

const original = fs.readFileSync(templatePath, "utf8")
const updated = original.replace(
  "  SetDetailsPrint none",
  '  SetDetailsPrint both\r\n  DetailPrint "Preparing Speech-to-Text Application installation..."'
)

if (updated === original) {
  if (original.includes("SetDetailsPrint both")) {
    console.log("NSIS install details are already enabled.")
    process.exit(0)
  }

  throw new Error("Could not find the NSIS SetDetailsPrint line to patch.")
}

fs.writeFileSync(templatePath, updated)
console.log("Enabled NSIS live install details for electron-builder.")
