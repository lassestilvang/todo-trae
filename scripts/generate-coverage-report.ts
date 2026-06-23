import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { resolve } from "path";

type FileCoverage = {
  file: string;
  linesFound: number;
  linesHit: number;
  funcsFound: number;
  funcsHit: number;
  branchesFound: number;
  branchesHit: number;
};

function parseLCOV(lcovPath: string): FileCoverage[] {
  const text = readFileSync(lcovPath, "utf-8");
  const lines = text.split(/\r?\n/);
  const result: FileCoverage[] = [];

  let current: FileCoverage | null = null;
  for (const line of lines) {
    if (line.startsWith("SF:")) {
      if (current) result.push(current);
      current = {
        file: line.slice(3).trim(),
        linesFound: 0,
        linesHit: 0,
        funcsFound: 0,
        funcsHit: 0,
        branchesFound: 0,
        branchesHit: 0,
      };
    } else if (line.startsWith("LF:")) {
      current && (current.linesFound = parseInt(line.slice(3).trim(), 10) || 0);
    } else if (line.startsWith("LH:")) {
      current && (current.linesHit = parseInt(line.slice(3).trim(), 10) || 0);
    } else if (line.startsWith("FNF:")) {
      current && (current.funcsFound = parseInt(line.slice(4).trim(), 10) || 0);
    } else if (line.startsWith("FNH:")) {
      current && (current.funcsHit = parseInt(line.slice(4).trim(), 10) || 0);
    } else if (line.startsWith("BRF:")) {
      current && (current.branchesFound = parseInt(line.slice(4).trim(), 10) || 0);
    } else if (line.startsWith("BRH:")) {
      current && (current.branchesHit = parseInt(line.slice(4).trim(), 10) || 0);
    } else if (line.startsWith("end_of_record")) {
      if (current) {
        result.push(current);
        current = null;
      }
    }
  }
  if (current) result.push(current);
  return result;
}

function sumCoverage(files: FileCoverage[]) {
  return files.reduce(
    (acc, f) => {
      acc.linesFound += f.linesFound;
      acc.linesHit += f.linesHit;
      acc.funcsFound += f.funcsFound;
      acc.funcsHit += f.funcsHit;
      acc.branchesFound += f.branchesFound;
      acc.branchesHit += f.branchesHit;
      return acc;
    },
    { linesFound: 0, linesHit: 0, funcsFound: 0, funcsHit: 0, branchesFound: 0, branchesHit: 0 }
  );
}

function pct(hit: number, found: number) {
  if (found === 0) return 0;
  return Math.round((hit / found) * 10000) / 100; // two decimals
}

function colorForPct(value: number) {
  if (value >= 90) return "#2e7d32";
  if (value >= 80) return "#558b2f";
  if (value >= 70) return "#f9a825";
  if (value >= 50) return "#f57c00";
  return "#c62828";
}

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function generateTable(title: string, files: FileCoverage[]) {
  const rows = files
    .map((f) => {
      const lp = pct(f.linesHit, f.linesFound);
      const fp = pct(f.funcsHit, f.funcsFound);
      const bp = f.branchesFound > 0 ? pct(f.branchesHit, f.branchesFound) : NaN;
      const lineColor = colorForPct(lp);
      const funcColor = colorForPct(fp);
      const branchCell = isNaN(bp)
        ? `<span class="badge badge-na">N/A</span>`
        : `<div class="bar" style="--p:${bp};background:${colorForPct(bp)}"></div><span class="pct">${bp}%</span>`;

      return `<tr>
        <td class="file">${escapeHtml(f.file)}</td>
        <td><div class="bar" style="--p:${lp};background:${lineColor}"></div><span class="pct">${lp}%</span></td>
        <td><div class="bar" style="--p:${fp};background:${funcColor}"></div><span class="pct">${fp}%</span></td>
        <td>${branchCell}</td>
      </tr>`;
    })
    .join("\n");

  return `<h3>${escapeHtml(title)}</h3>
  <table class="coverage">
    <thead>
      <tr><th>File</th><th>Lines</th><th>Functions</th><th>Branches</th></tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>`;
}

function generateSummaryBlock(label: string, totals: { linesFound: number; linesHit: number; funcsFound: number; funcsHit: number; branchesFound: number; branchesHit: number }, benchmarks: { lines: number; funcs: number; branches: number }) {
  const lp = pct(totals.linesHit, totals.linesFound);
  const fp = pct(totals.funcsHit, totals.funcsFound);
  const bp = totals.branchesFound > 0 ? pct(totals.branchesHit, totals.branchesFound) : NaN;
  const ok = (val: number, bench: number) => !isNaN(val) && val >= bench;
  const lineOK = ok(lp, benchmarks.lines);
  const funcOK = ok(fp, benchmarks.funcs);
  const branchOK = isNaN(bp) ? false : ok(bp, benchmarks.branches);
  return `<div class="summary">
    <div class="summary-item">
      <div class="label">${escapeHtml(label)} — Lines</div>
      <div class="value" style="color:${colorForPct(lp)}">${lp}%</div>
      <div class="bench ${lineOK ? "ok" : "bad"}">Benchmark ${benchmarks.lines}%</div>
    </div>
    <div class="summary-item">
      <div class="label">${escapeHtml(label)} — Functions</div>
      <div class="value" style="color:${colorForPct(fp)}">${fp}%</div>
      <div class="bench ${funcOK ? "ok" : "bad"}">Benchmark ${benchmarks.funcs}%</div>
    </div>
    <div class="summary-item">
      <div class="label">${escapeHtml(label)} — Branches</div>
      <div class="value">${isNaN(bp) ? "N/A" : bp + "%"}</div>
      <div class="bench ${branchOK ? "ok" : "bad"}">Benchmark ${benchmarks.branches}%</div>
    </div>
  </div>`;
}

function buildReport() {
  const root = process.cwd();
  const covDir = resolve(root, "coverage");
  const unitPath = resolve(covDir, "unit.lcov.info");
  const intPath = resolve(covDir, "integration.lcov.info");
  const allPath = resolve(covDir, "all.lcov.info");

  const unitFiles = existsSync(unitPath) ? parseLCOV(unitPath) : [];
  const intFiles = existsSync(intPath) ? parseLCOV(intPath) : [];
  const allFiles = existsSync(allPath) ? parseLCOV(allPath) : [];

  const unitTotals = sumCoverage(unitFiles);
  const intTotals = sumCoverage(intFiles);
  const allTotals = sumCoverage(allFiles);

  const e2eTotals = { linesFound: 0, linesHit: 0, funcsFound: 0, funcsHit: 0, branchesFound: 0, branchesHit: 0 };

  const unitBench = { lines: 80, funcs: 80, branches: 80 };
  const intBench = { lines: 70, funcs: 70, branches: 70 };
  const e2eBench = { lines: 50, funcs: 50, branches: 50 };

  const criticalPatterns = ["src/lib/api.ts", "src/lib/database.ts", "src/stores/taskStore.ts", "src/stores/themeStore.ts", "src/components/"];
  const criticalFiles = allFiles.filter((f) => criticalPatterns.some((p) => f.file.includes(p)));
  const insufficient = criticalFiles.filter((f) => pct(f.linesHit, f.linesFound) < 80);

  const html = `<!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <title>Test Coverage Report</title>
      <style>
        body { font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; margin: 24px; color: #111; }
        h1 { margin-bottom: 4px; }
        .subtitle { color: #555; margin-bottom: 16px; }
        .summary { display: grid; grid-template-columns: repeat(3, minmax(220px, 1fr)); gap: 12px; margin: 12px 0 24px; }
        .summary-item { border: 1px solid #e0e0e0; border-radius: 8px; padding: 12px; background: #fafafa; }
        .summary-item .label { font-size: 12px; color: #666; }
        .summary-item .value { font-size: 20px; font-weight: 600; }
        .summary-item .bench { font-size: 12px; margin-top: 4px; }
        .bench.ok { color: #2e7d32; }
        .bench.bad { color: #c62828; }
        table.coverage { width: 100%; border-collapse: collapse; margin: 8px 0 24px; }
        table.coverage th, table.coverage td { border: 1px solid #e0e0e0; padding: 8px; text-align: left; font-size: 13px; }
        table.coverage th { background: #f5f5f5; }
        td.file { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
        .bar { display: inline-block; height: 10px; width: calc(var(--p) * 1%); border-radius: 4px; margin-right: 6px; background: #999; vertical-align: middle; }
        .pct { font-size: 12px; color: #444; vertical-align: middle; }
        .badge-na { display: inline-block; padding: 2px 6px; border-radius: 6px; background: #eee; color: #666; font-size: 12px; }
        .section { margin-bottom: 24px; }
        .callout { border-left: 4px solid #c62828; background: #fff3e0; padding: 12px; margin: 16px 0; }
        ul { margin: 6px 0 12px 20px; }
        li { margin: 4px 0; }
      </style>
    </head>
    <body>
      <h1>Comprehensive Test Coverage Report</h1>
      <div class="subtitle">Generated ${new Date().toISOString()}</div>

      <div class="section">
        <h2>Coverage Summary</h2>
        ${generateSummaryBlock("Unit", unitTotals, unitBench)}
        ${generateSummaryBlock("Integration", intTotals, intBench)}
        ${generateSummaryBlock("End-to-End", e2eTotals, e2eBench)}
        ${generateSummaryBlock("Overall", allTotals, { lines: 80, funcs: 80, branches: 80 })}
      </div>

      <div class="section">
        <h2>Unit Files</h2>
        ${generateTable("Per-file Unit Coverage", unitFiles)}
      </div>

      <div class="section">
        <h2>Integration Files</h2>
        ${generateTable("Per-file Integration Coverage", intFiles)}
      </div>

      <div class="section">
        <h2>Overall Heat Map</h2>
        ${generateTable("All Covered Files", allFiles)}
      </div>

      <div class="section">
        <h2>Critical Modules With Insufficient Coverage</h2>
        ${insufficient.length === 0 ? "<p>All critical modules meet coverage benchmarks.</p>" : ""}
        ${insufficient.length > 0 ? generateTable("Needs Attention", insufficient) : ""}
        <div class="callout">
          Branch coverage is not available from Bun's built-in reporter; consider adding an additional coverage tool if branch metrics are required.
        </div>
      </div>

      <div class="section">
        <h2>Recommendations</h2>
        <ul>
          <li>Increase tests for <code>src/lib/api.ts</code> covering error paths, invalid IDs, empty input, and boundary values.</li>
          <li>Expand <code>src/stores/taskStore.ts</code> tests to assert state mutations for add/update/delete, toggle completion, and search filters across edge cases.</li>
          <li>Add tests for list/label management flows and attachment handling where applicable.</li>
          <li>Introduce component-level tests using Bun with happy-dom to validate rendering, interactions, and accessibility states for key UI components.</li>
          <li>Adopt coverage thresholds via <code>bunfig.toml</code> to enforce minimum coverage in CI.</li>
          <li>If branch metrics are required, integrate LCOV + an external analyzer, or adopt Jest/Vitest with Istanbul to collect branch data.</li>
        </ul>
      </div>
    </body>
  </html>`;

  const reportsDir = resolve(root, "reports");
  if (!existsSync(reportsDir)) mkdirSync(reportsDir, { recursive: true });
  const outPath = resolve(reportsDir, "coverage-report.html");
  writeFileSync(outPath, html, "utf-8");
  console.log(`Coverage report generated at ${outPath}`);

  const jsonSummary = {
    unit: {
      linesPct: pct(unitTotals.linesHit, unitTotals.linesFound),
      funcsPct: pct(unitTotals.funcsHit, unitTotals.funcsFound),
      branchesPct: unitTotals.branchesFound > 0 ? pct(unitTotals.branchesHit, unitTotals.branchesFound) : null,
      lines: unitTotals,
    },
    integration: {
      linesPct: pct(intTotals.linesHit, intTotals.linesFound),
      funcsPct: pct(intTotals.funcsHit, intTotals.funcsFound),
      branchesPct: intTotals.branchesFound > 0 ? pct(intTotals.branchesHit, intTotals.branchesFound) : null,
      lines: intTotals,
    },
    e2e: {
      linesPct: 0,
      funcsPct: 0,
      branchesPct: null,
      lines: e2eTotals,
    },
    overall: {
      linesPct: pct(allTotals.linesHit, allTotals.linesFound),
      funcsPct: pct(allTotals.funcsHit, allTotals.funcsFound),
      branchesPct: allTotals.branchesFound > 0 ? pct(allTotals.branchesHit, allTotals.branchesFound) : null,
      lines: allTotals,
    },
  };
  writeFileSync(resolve(reportsDir, "coverage-report.json"), JSON.stringify(jsonSummary, null, 2), "utf-8");
}

buildReport();