#!/usr/bin/env node

import { runCli } from "../src/cli.js";

runCli().catch((error) => {
  console.error(`\n${error.message}`);
  process.exit(1);
});
