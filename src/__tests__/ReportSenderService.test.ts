import { ReportSenderService, ReportPayload } from '../services/ReportSenderService';

const MOCK_PAYLOAD: ReportPayload = {
  workspaceId: 'ws-001',
  reportType: 'unified_sprint',
  windowStart: '2026-04-06T00:00:00.000Z',
  windowEnd: '2026-04-12T23:59:59.000Z',
  generatedAt: '2026-04-13T10:00:00.000Z',
  summary: { health: 'good', headline: 'Sprint on track.' },
  risks: [
    {
      type: 'review_bottleneck',
      severity: 'low',
      title: 'One PR awaiting review',
      description: 'PR #42 has been open for 2 days.',
      links: [{ label: 'PR #42', url: 'https://github.com/acme/backend/pull/42' }],
    },
  ],
  insights: [{ type: 'throughput', description: 'Team merged 8 PRs this week.' }],
};

function makeSender() {
  return new ReportSenderService('https://api.rdpulse.io', 'ws-001', 'jwt-token');
}

function mockFetchOk(body: object = {}) {
  return jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: () => Promise.resolve(body),
  });
}

function mockFetchError(status: number) {
  return jest.fn().mockResolvedValue({
    ok: false,
    status,
    json: () => Promise.resolve({ error: 'Unauthorized' }),
  });
}

function mockFetchNetworkFailure(message: string) {
  return jest.fn().mockRejectedValue(new Error(message));
}

describe('ReportSenderService', () => {
  let globalFetch: typeof fetch;

  beforeEach(() => {
    globalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = globalFetch;
  });

  // ── sendHeartbeat ─────────────────────────────────────────────────────────

  describe('sendHeartbeat()', () => {
    it('POSTs to /workspaces/:id/heartbeat with Authorization header', async () => {
      global.fetch = mockFetchOk();
      await makeSender().sendHeartbeat();

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.rdpulse.io/workspaces/ws-001/heartbeat',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer jwt-token',
          }),
        })
      );
    });

    it('strips trailing slash from serverUrl', async () => {
      global.fetch = mockFetchOk();
      const sender = new ReportSenderService('https://api.rdpulse.io/', 'ws-001', 'jwt');
      await sender.sendHeartbeat();

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.rdpulse.io/workspaces/ws-001/heartbeat',
        expect.anything()
      );
    });

    it('throws with status code on non-2xx response', async () => {
      global.fetch = mockFetchError(401);
      await expect(makeSender().sendHeartbeat()).rejects.toThrow('401');
    });

    it('throws with human-readable message on network failure', async () => {
      global.fetch = mockFetchNetworkFailure('ECONNREFUSED');
      await expect(makeSender().sendHeartbeat()).rejects.toThrow('ECONNREFUSED');
    });

    it('resolves without error on 2xx response', async () => {
      global.fetch = mockFetchOk();
      await expect(makeSender().sendHeartbeat()).resolves.toBeUndefined();
    });
  });

  // ── sendReport ────────────────────────────────────────────────────────────

  describe('sendReport()', () => {
    it('POSTs to /ingest/report with Authorization header and JSON body', async () => {
      global.fetch = mockFetchOk();
      await makeSender().sendReport(MOCK_PAYLOAD);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.rdpulse.io/ingest/report',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer jwt-token',
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify(MOCK_PAYLOAD),
        })
      );
    });

    it('throws with status code on non-2xx response', async () => {
      global.fetch = mockFetchError(422);
      await expect(makeSender().sendReport(MOCK_PAYLOAD)).rejects.toThrow('422');
    });

    it('throws with human-readable message on network failure', async () => {
      global.fetch = mockFetchNetworkFailure('Network unreachable');
      await expect(makeSender().sendReport(MOCK_PAYLOAD)).rejects.toThrow('Network unreachable');
    });

    it('resolves without error on 2xx response', async () => {
      global.fetch = mockFetchOk({ reportId: 'r-1', url: '/report/r-1' });
      await expect(makeSender().sendReport(MOCK_PAYLOAD)).resolves.toBeUndefined();
    });

    it('serialises the full payload in the request body', async () => {
      global.fetch = mockFetchOk();
      await makeSender().sendReport(MOCK_PAYLOAD);

      const call = (global.fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(call[1].body as string) as ReportPayload;
      expect(body.workspaceId).toBe('ws-001');
      expect(body.summary.health).toBe('good');
      expect(body.risks).toHaveLength(1);
      expect(body.insights).toHaveLength(1);
    });
  });
});
