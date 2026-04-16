import fs from 'fs';
import os from 'os';
import path from 'path';
import { LicenseService, TrialStatus } from '../services/LicenseService';

jest.mock('fs');
jest.mock('os');

const mockFs = fs as jest.Mocked<typeof fs>;
const mockOs = os as jest.Mocked<typeof os>;

const FAKE_HOME = '/fake/home';
const TRIAL_DIR = path.join(FAKE_HOME, '.rdpulse');
const TRIAL_FILE = path.join(TRIAL_DIR, 'trial.json');

beforeEach(() => {
  jest.clearAllMocks();
  mockOs.homedir.mockReturnValue(FAKE_HOME);
  mockFs.existsSync.mockReturnValue(false);
  mockFs.mkdirSync.mockImplementation(() => undefined as never);
  mockFs.writeFileSync.mockImplementation(() => undefined);
});

function makeTrialJson(daysAgo: number, runs = 5): string {
  const startedAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();
  return JSON.stringify({ startedAt, runs });
}

describe('LicenseService', () => {
  describe('getStatus()', () => {
    it('returns active trial with days remaining on first run', () => {
      mockFs.existsSync.mockReturnValue(false);

      const svc = new LicenseService();
      const status = svc.getStatus();

      expect(status.active).toBe(true);
      expect(status.expired).toBe(false);
      expect(status.daysRemaining).toBe(14);
      expect(status.runs).toBe(0);
    });

    it('creates trial file on first run', () => {
      mockFs.existsSync.mockReturnValue(false);

      const svc = new LicenseService();
      svc.getStatus();

      expect(mockFs.mkdirSync).toHaveBeenCalledWith(TRIAL_DIR, { recursive: true });
      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        TRIAL_FILE,
        expect.stringContaining('"runs":0'),
        'utf8',
      );
    });

    it('returns active trial midway through trial period', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(makeTrialJson(7, 12) as never);

      const svc = new LicenseService();
      const status = svc.getStatus();

      expect(status.active).toBe(true);
      expect(status.expired).toBe(false);
      expect(status.daysRemaining).toBe(7);
      expect(status.runs).toBe(12);
    });

    it('returns expired after 14 days', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(makeTrialJson(15, 30) as never);

      const svc = new LicenseService();
      const status = svc.getStatus();

      expect(status.active).toBe(false);
      expect(status.expired).toBe(true);
      expect(status.daysRemaining).toBe(0);
    });

    it('returns expired on exactly day 14', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(makeTrialJson(14, 14) as never);

      const svc = new LicenseService();
      const status = svc.getStatus();

      expect(status.expired).toBe(true);
    });

    it('handles corrupted trial file gracefully by resetting', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue('not valid json' as never);

      const svc = new LicenseService();
      const status = svc.getStatus();

      expect(status.active).toBe(true);
      expect(status.daysRemaining).toBe(14);
    });
  });

  describe('recordRun()', () => {
    it('increments run count and writes back', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(makeTrialJson(3, 4) as never);

      const svc = new LicenseService();
      svc.getStatus(); // load state
      svc.recordRun();

      const written = (mockFs.writeFileSync as jest.Mock).mock.calls.at(-1)?.[1] as string;
      const parsed = JSON.parse(written);
      expect(parsed.runs).toBe(5);
    });
  });

  describe('formatBanner()', () => {
    it('shows days remaining when trial is active', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(makeTrialJson(3, 4) as never);

      const svc = new LicenseService();
      svc.getStatus();
      const banner = svc.formatBanner();

      expect(banner).toContain('11');
      expect(banner).toContain('day');
    });

    it('shows upgrade message when expired', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(makeTrialJson(20, 40) as never);

      const svc = new LicenseService();
      svc.getStatus();
      const banner = svc.formatBanner();

      expect(banner).toContain('expired');
      expect(banner).toMatch(/rdpulse|license|purchase/i);
    });
  });
});
