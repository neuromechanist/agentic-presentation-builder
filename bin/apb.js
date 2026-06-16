#!/usr/bin/env node
/**
 * apb -- Agentic Presentation Builder command-line entry point.
 *
 * Dispatches to the validate / present / export subcommands so the engine can be
 * run via `bunx`/`npx` pointing at this repo, without an npm publish:
 *
 *   bunx github:neuromechanist/agentic-presentation-builder#v0.1.6 validate deck.json
 *   bunx github:neuromechanist/agentic-presentation-builder#v0.1.6 present deck.json --open
 *   bunx github:neuromechanist/agentic-presentation-builder#v0.1.6 export deck.json --format pdf
 *
 * Each subcommand reuses the same module the `bun run <name>` scripts use, so
 * behaviour and flags stay identical between the two invocation styles.
 */

const USAGE = [
  "Usage: apb <command> [options]",
  "",
  "Commands:",
  "  validate <deck.json> [--json]              Check a deck against the JSON schema",
  "  present  <deck.json> [--open] [--port N]   Serve the deck on a local presentation server",
  "  export   <deck.json> [--format ...] [...]  Export the deck (pdf/pptx)",
  "  shoot    <deck.json> [--out dir] [...]     Screenshot every slide at full HD for QC",
  "",
  "Run a command with --help for its full option list.",
].join("\n");

async function dispatch() {
  const [, , command, ...rest] = process.argv;

  switch (command) {
    case "validate": {
      const { main } = await import("../scripts/validate.js");
      return main(rest);
    }
    case "present": {
      const { main } = await import("../scripts/present.js");
      return main(rest);
    }
    case "export": {
      const { main } = await import("../scripts/export.js");
      return main(rest);
    }
    case "shoot": {
      const { main } = await import("../scripts/shoot.js");
      return main(rest);
    }
    case "--help":
    case "-h":
    case undefined:
      console.log(USAGE);
      return;
    default:
      console.error(`Unknown command: ${command}\n`);
      console.error(USAGE);
      process.exit(1);
  }
}

dispatch().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
