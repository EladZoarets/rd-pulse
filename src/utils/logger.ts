const HEADER = `
██████╗ ██████╗       ██████╗ ██╗   ██╗██╗     ███████╗███████╗
██╔══██╗██╔══██╗      ██╔══██╗██║   ██║██║     ██╔════╝██╔════╝
██████╔╝██║  ██║█████╗██████╔╝██║   ██║██║     ███████╗█████╗
██╔══██╗██║  ██║╚════╝██╔═══╝ ██║   ██║██║     ╚════██║██╔══╝
██║  ██║██████╔╝      ██║     ╚██████╔╝███████╗███████║███████╗
╚═╝  ╚═╝╚═════╝       ╚═╝      ╚═════╝ ╚══════╝╚══════╝╚══════╝
`.trim();

export function printHeader(): void {
  console.log(`\n${HEADER}\n`);
}

export function log(message: string): void {
  const ts = new Date().toISOString().slice(11, 19); // HH:MM:SS
  console.log(`[${ts}] ${message}`);
}

export function handleFatalError(err: unknown, context: string): never {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(`\n[FATAL] ${context}: ${msg}\n`);
  process.exit(1);
}
