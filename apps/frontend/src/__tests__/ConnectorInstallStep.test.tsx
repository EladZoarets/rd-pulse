import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react'
import { ConnectorInstallStep } from '../components/setup/ConnectorInstallStep'
import type { WorkspaceCreateResponse, WorkspaceStatusResponse } from '@rdpulse/types'

vi.mock('../hooks/useWorkspace', () => ({
  useWorkspaceStatus: vi.fn(),
}))

import { useWorkspaceStatus } from '../hooks/useWorkspace'

const mockWorkspace: WorkspaceCreateResponse = {
  workspaceId: 'ws-123',
  name: 'Acme Backend',
  status: 'pending_connection',
  licenseJwt: 'jwt-abc',
}

const pendingStatus: WorkspaceStatusResponse = {
  workspaceId: 'ws-123',
  status: 'pending_connection',
  lastHeartbeatAt: null,
}

const activeStatus: WorkspaceStatusResponse = {
  workspaceId: 'ws-123',
  status: 'active',
  lastHeartbeatAt: '2026-04-13T09:00:00Z',
}

function mockPending() {
  vi.mocked(useWorkspaceStatus).mockReturnValue({ data: pendingStatus } as ReturnType<typeof useWorkspaceStatus>)
}

function mockActive() {
  vi.mocked(useWorkspaceStatus).mockReturnValue({ data: activeStatus } as ReturnType<typeof useWorkspaceStatus>)
}

// Mock clipboard on the Navigator prototype — works across jsdom versions
const clipboardWriteText = vi.fn().mockResolvedValue(undefined)
Object.defineProperty(window.Navigator.prototype, 'clipboard', {
  value: { writeText: clipboardWriteText },
  configurable: true,
  writable: true,
})

describe('ConnectorInstallStep', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    clipboardWriteText.mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders install command containing workspaceId and licenseJwt', () => {
    mockPending()
    render(<ConnectorInstallStep workspace={mockWorkspace} onActive={vi.fn()} />)
    const cmd = screen.getByTestId('install-command')
    expect(cmd).toHaveTextContent('ws-123')
    expect(cmd).toHaveTextContent('jwt-abc')
  })

  it('renders polling-status with waiting message while pending', () => {
    mockPending()
    render(<ConnectorInstallStep workspace={mockWorkspace} onActive={vi.fn()} />)
    expect(screen.getByTestId('polling-status')).toHaveTextContent('Waiting for connector')
  })

  it('shows connected message when status is active', () => {
    mockActive()
    render(<ConnectorInstallStep workspace={mockWorkspace} onActive={vi.fn()} />)
    expect(screen.getByTestId('polling-status')).toHaveTextContent('Connector connected')
  })

  it('calls onActive when status transitions to active', () => {
    mockActive()
    const onActive = vi.fn()
    render(<ConnectorInstallStep workspace={mockWorkspace} onActive={onActive} />)
    expect(onActive).toHaveBeenCalledOnce()
  })

  it('does not call onActive when status is pending', () => {
    mockPending()
    const onActive = vi.fn()
    render(<ConnectorInstallStep workspace={mockWorkspace} onActive={onActive} />)
    expect(onActive).not.toHaveBeenCalled()
  })

  it('calls navigator.clipboard.writeText with the full command on copy', async () => {
    mockPending()
    render(<ConnectorInstallStep workspace={mockWorkspace} onActive={vi.fn()} />)

    fireEvent.click(screen.getByTestId('copy-button'))

    await waitFor(() =>
      expect(clipboardWriteText).toHaveBeenCalledWith(
        `npx rdpulse-connector pulse --owner your-org --repo your-repo --board 42`
      )
    )
  })

  it('shows "Copied!" after clicking copy then reverts after 2s', async () => {
    vi.useFakeTimers()
    mockPending()
    render(<ConnectorInstallStep workspace={mockWorkspace} onActive={vi.fn()} />)

    fireEvent.click(screen.getByTestId('copy-button'))
    // flush the async clipboard promise so setCopied(true) fires
    await act(async () => {})

    expect(screen.getByTestId('copy-button')).toHaveTextContent('Copied!')

    // advance past the 2s revert timeout
    act(() => { vi.advanceTimersByTime(2000) })
    await act(async () => {})

    expect(screen.getByTestId('copy-button')).toHaveTextContent('Copy')
  })
})
