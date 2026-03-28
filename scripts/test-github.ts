import * as dotenv from 'dotenv';
import { GitHubService } from '../src/services/GitHubService';

dotenv.config();

const token = process.env.GITHUB_TOKEN;
if (!token) {
  console.error('Missing GITHUB_TOKEN in .env');
  process.exit(1);
}

// Change these to any public (or private) repo you have access to
const OWNER = process.argv[2] ?? 'microsoft';
const REPO = process.argv[3] ?? 'vscode';
const DAYS = Number(process.argv[4] ?? 1);

async function main() {
  console.log(`\nFetching ${DAYS}d of activity for ${OWNER}/${REPO}...\n`);

  const service = new GitHubService(token!);
  const ctx = await service.fetchActivity(OWNER, REPO, DAYS);

  console.log(`Default branch : ${ctx.defaultBranch}`);
  console.log(`Window         : ${ctx.windowStart.toISOString()} → ${ctx.windowEnd.toISOString()}`);
  console.log(`PRs fetched    : ${ctx.pullRequests.length}`);
  console.log(`Commits fetched: ${ctx.commits.length}`);
  console.log(`Heated PRs     : ${ctx.heatedPRs.length}`);
  console.log(`Stale PRs      : ${ctx.stalePRs.length}`);
  console.log(`Direct commits : ${ctx.directCommits.length}`);

  if (ctx.pullRequests.length > 0) {
    console.log('\nSample PR:');
    const pr = ctx.pullRequests[0];
    console.log(`  #${pr.number} [${pr.state}] ${pr.title} — @${pr.author}`);
  }

  if (ctx.commits.length > 0) {
    console.log('\nSample commit:');
    const c = ctx.commits[0];
    console.log(`  ${c.sha.slice(0, 7)} ${c.message} — ${c.author} (direct: ${c.isDirectToMain})`);
  }
}

main().catch(err => {
  console.error('\nError:', err.message);
  process.exit(1);
});
