const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001';
async function apiFetch(path, init) {
    const res = await fetch(`${BASE_URL}${path}`, {
        headers: { 'Content-Type': 'application/json', ...init?.headers },
        ...init,
    });
    if (!res.ok) {
        const text = await res.text().catch(() => res.statusText);
        throw new Error(`API error ${res.status}: ${text}`);
    }
    return res.json();
}
export const realApi = {
    createWorkspace(req) {
        return apiFetch('/api/v1/workspaces', {
            method: 'POST',
            body: JSON.stringify(req),
        });
    },
    getWorkspaceStatus(workspaceId) {
        return apiFetch(`/api/v1/workspaces/${workspaceId}/status`);
    },
    getReports(workspaceId) {
        return apiFetch(`/api/v1/reports?workspaceId=${encodeURIComponent(workspaceId)}`);
    },
    getReport(id) {
        return apiFetch(`/api/v1/reports/${encodeURIComponent(id)}`);
    },
};
