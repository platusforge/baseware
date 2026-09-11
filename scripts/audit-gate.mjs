// Security gate: fails on high/critical PRODUCTION advisories, minus
// documented exceptions in audit-exceptions.json (each with reason + expiry).
// Usage: node scripts/audit-gate.mjs   (also wired into .github/workflows/ci.yml)
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

const SEVERITIES = new Set(["high", "critical"]);

function loadExceptions() {
  try {
    return JSON.parse(readFileSync(new URL("../audit-exceptions.json", import.meta.url), "utf8"));
  } catch {
    return [];
  }
}

function auditJson() {
  // npm audit exits non-zero when findings exist — the JSON is still on stdout.
  // execSync uses a shell, so `npm` resolves on Windows (.cmd) and POSIX alike.
  try {
    const raw = execSync("npm audit --omit=dev --json", { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
    return JSON.parse(raw);
  } catch (err) {
    if (err && typeof err.stdout === "string" && err.stdout.trim().startsWith("{")) {
      return JSON.parse(err.stdout);
    }
    throw err;
  }
}

function main() {
  const exceptions = loadExceptions();
  const today = new Date().toISOString().slice(0, 10);
  for (const e of exceptions) {
    if (e.expires && e.expires < today) {
      console.error(`EXPIRED exception: ${e.advisory} (${e.package}) expired on ${e.expires} — re-evaluate and update audit-exceptions.json`);
      process.exit(1);
    }
  }

  const data = auditJson();
  const vulns = data.vulnerabilities ?? {};

  // Follow the `via` chain transitively: e.g. prisma → @prisma/config → deepmerge-ts.
  function reaches(name, pkg, seen = new Set()) {
    if (name === pkg) return true;
    if (seen.has(name)) return false;
    seen.add(name);
    const v = vulns[name];
    const vias = v && Array.isArray(v.via) ? v.via : [];
    return vias.some((x) => {
      const n = typeof x === "string" ? x : x?.name;
      return n ? reaches(n, pkg, seen) : false;
    });
  }

  const failures = [];
  for (const [name, v] of Object.entries(vulns)) {
    const vuln = v;
    if (!SEVERITIES.has(vuln.severity)) continue;
    const blob = JSON.stringify(vuln);
    const excused = exceptions.some((e) => blob.includes(e.advisory) || reaches(name, e.package));
    if (!excused) {
      failures.push(`${vuln.severity.toUpperCase()} ${name} ${vuln.range ?? ""} ${firstUrl(vuln)}`.trim());
    }
  }

  if (failures.length > 0) {
    console.error("audit-gate: unhandled high/critical advisories in production dependencies:");
    for (const f of failures) console.error(`  - ${f}`);
    console.error("Fix the dependency or document an exception in audit-exceptions.json (reason + expiry required).");
    process.exit(1);
  }
  console.log(`audit-gate: clean (${Object.keys(vulns).length} advisories checked, ${exceptions.length} documented exception(s)).`);
}

function firstUrl(vuln) {
  const via = Array.isArray(vuln.via) ? vuln.via : [];
  const obj = via.find((x) => x && typeof x === "object" && x.url);
  return obj ? obj.url : "";
}

main();
