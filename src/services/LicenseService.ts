import fs from 'fs';
import os from 'os';
import path from 'path';

const TRIAL_DAYS = 14;

export interface TrialStatus {
  active: boolean;
  expired: boolean;
  daysRemaining: number;
  runs: number;
}

interface TrialFile {
  startedAt: string;
  runs: number;
}

export class LicenseService {
  private readonly trialPath: string;
  private state: TrialFile | null = null;

  constructor(trialPath?: string) {
    this.trialPath = trialPath ?? this.resolveTrialPath();
  }

  private resolveTrialPath(): string {
    // In Docker, persist to the reports volume so it survives container restarts
    const reportsDir = '/reports';
    if (fs.existsSync(reportsDir)) {
      return path.join(reportsDir, '.rdpulse-trial.json');
    }
    return path.join(os.homedir(), '.rdpulse', 'trial.json');
  }

  private load(): TrialFile {
    if (this.state) return this.state;

    if (fs.existsSync(this.trialPath)) {
      try {
        const raw = fs.readFileSync(this.trialPath, 'utf8') as string;
        const parsed = JSON.parse(raw) as TrialFile;
        if (parsed.startedAt && typeof parsed.runs === 'number') {
          this.state = parsed;
          return this.state;
        }
      } catch {
        // corrupted — fall through to reset
      }
    }

    // First run or corrupted: create a fresh trial
    this.state = { startedAt: new Date().toISOString(), runs: 0 };
    this.persist();
    return this.state;
  }

  private persist(): void {
    const dir = path.dirname(this.trialPath);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(this.trialPath, JSON.stringify(this.state), 'utf8');
  }

  getStatus(): TrialStatus {
    const trial = this.load();
    const startedAt = new Date(trial.startedAt);
    const now = new Date();
    const elapsedDays = Math.floor((now.getTime() - startedAt.getTime()) / (1000 * 60 * 60 * 24));
    const daysRemaining = Math.max(0, TRIAL_DAYS - elapsedDays);
    const expired = elapsedDays >= TRIAL_DAYS;

    return {
      active: !expired,
      expired,
      daysRemaining,
      runs: trial.runs,
    };
  }

  recordRun(): void {
    const trial = this.load();
    trial.runs += 1;
    this.persist();
  }

  formatBanner(): string {
    const status = this.getStatus();
    if (status.expired) {
      return [
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '  ⚠️  Your rd-pulse trial has expired.',
        '  Purchase a license to continue generating full reports.',
        '  👉  https://rdpulse.io/license',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      ].join('\n');
    }
    const dayWord = status.daysRemaining === 1 ? 'day' : 'days';
    return `  🟢 rd-pulse trial — ${status.daysRemaining} ${dayWord} remaining (run ${status.runs + 1})`;
  }

  htmlWatermark(): string {
    const status = this.getStatus();
    if (!status.expired) return '';
    return `<div style="position:sticky;top:0;z-index:999;background:#1e293b;color:#f8fafc;text-align:center;padding:.75rem 1rem;font-size:.85rem;font-weight:600;letter-spacing:.01em">
      ⚠️ Trial expired — <a href="https://rdpulse.io/license" target="_blank" rel="noreferrer" style="color:#38bdf8;text-decoration:underline">Purchase a license</a> to remove this banner
    </div>`;
  }
}
