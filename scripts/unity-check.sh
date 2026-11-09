#!/usr/bin/env bash
# The C# edit loop in one command: make the running Unity Editor notice file edits, recompile,
# fail on compile errors, then run the EditMode tests and print a short summary.
#
#   scripts/unity-check.sh              refresh, recompile, EditMode tests
#   scripts/unity-check.sh --no-tests   refresh and recompile only
#
# Exit code 0 means it compiled and every test passed. See
# documentation/agents/driving-unity-editor.md for the commands behind each step.
set -u

U="${UNITY_CLI:-$HOME/.unity/bin/unity}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
P="$ROOT/Vibe-Space-Mining-Fleet"
F=(--caller plugin --skill unity-cli --project-path "$P" --no-banner)

run_tests=1
[ "${1:-}" = "--no-tests" ] && run_tests=0

if [ ! -x "$U" ]; then
  echo "unity-check: no Unity CLI at $U (set UNITY_CLI, or install it: see driving-unity-editor.md)" >&2
  exit 2
fi

ready() { "$U" status --until-ready --project-path "$P" --no-banner >/dev/null 2>&1; }

if ! ready; then
  echo "unity-check: the Editor is not running or not ready for $P" >&2
  "$U" status --no-banner >&2
  exit 2
fi

# An unfocused Editor does not notice edits made from the shell; Refresh starts the compile and
# the domain reload, so wait for it before and after the explicit recompile.
"$U" command script eval --code 'UnityEditor.AssetDatabase.Refresh(); return "ok";' "${F[@]}" >/dev/null 2>&1
ready
compile_output="$("$U" recompile --project-path "$P" 2>&1)"
ready

# "up_to_date" does not prove the code compiled: ask the console for the ground truth.
truth="$("$U" command console get --level error --tail 1 "${F[@]}" 2>&1 | grep -o 'groundTruth.*')"
if ! echo "$truth" | grep -q '"compilationFailed":false'; then
  echo "unity-check: COMPILE FAILED"
  echo "$compile_output" | grep -v '^$'
  "$U" status --no-banner 2>&1 | grep -i 'error' | head -20
  exit 1
fi
echo "unity-check: compiled"

[ "$run_tests" = 1 ] || exit 0

"$U" command test run --mode EditMode --timeout 600 "${F[@]}" --result-only 2>&1 | node -e '
  let text = "";
  process.stdin.on("data", (d) => (text += d)).on("end", () => {
    // The CLI prints one JSON object and may add lines after it: parse the longest valid prefix.
    const start = text.indexOf("{");
    let data = null;
    for (let end = text.lastIndexOf("}"); start >= 0 && end > start; end = text.lastIndexOf("}", end - 1)) {
      try { data = JSON.parse(text.slice(start, end + 1)); break; } catch {}
    }
    if (!data) { console.log("unity-check: could not read the test result:\n" + text.slice(0, 2000)); process.exit(2); }
    const tests = [];
    (function walk(o) {
      if (Array.isArray(o)) o.forEach(walk);
      else if (o && typeof o === "object") {
        if (typeof o.FullName === "string" && typeof o.Status === "string") tests.push(o);
        Object.values(o).forEach(walk);
      }
    })(data);
    const bad = tests.filter((t) => t.Status !== "Passed");
    for (const t of bad)
      console.log(`  ${t.Status}  ${t.FullName}\n      ${String(t.Message ?? "").trim().replace(/\s+/g, " ").slice(0, 300)}`);
    console.log(`unity-check: EditMode ${tests.length - bad.length} of ${tests.length} passed` + (bad.length ? `, ${bad.length} not passed` : ""));
    process.exit(tests.length === 0 || bad.length ? 1 : 0);
  });
'
