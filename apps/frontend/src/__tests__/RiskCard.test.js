import { jsx as _jsx } from "react/jsx-runtime";
import { render, screen } from '@testing-library/react';
import { RiskCard } from '../components/report/RiskCard';
const makeRisk = (overrides = {}) => ({
    type: 'review_bottleneck',
    severity: 'high',
    title: 'Test risk title',
    description: 'Test risk description',
    links: [{ label: 'PR #42', url: 'https://github.com/org/repo/pull/42' }],
    ...overrides,
});
describe('RiskCard', () => {
    it('renders the risk title', () => {
        render(_jsx(RiskCard, { risk: makeRisk() }));
        expect(screen.getByText('Test risk title')).toBeInTheDocument();
    });
    it('renders the severity badge', () => {
        render(_jsx(RiskCard, { risk: makeRisk({ severity: 'high' }) }));
        expect(screen.getByTestId('severity-badge')).toHaveAttribute('data-severity', 'high');
    });
    it('renders links with target=_blank', () => {
        render(_jsx(RiskCard, { risk: makeRisk() }));
        const link = screen.getByTestId('risk-link');
        expect(link).toHaveAttribute('target', '_blank');
        expect(link).toHaveAttribute('rel', 'noreferrer');
        expect(link).toHaveAttribute('href', 'https://github.com/org/repo/pull/42');
    });
    it('renders no links section when links array is empty', () => {
        render(_jsx(RiskCard, { risk: makeRisk({ links: [] }) }));
        expect(screen.queryByTestId('risk-link')).not.toBeInTheDocument();
    });
    it('applies red border for high severity', () => {
        render(_jsx(RiskCard, { risk: makeRisk({ severity: 'high' }) }));
        expect(screen.getByTestId('risk-card').className).toContain('border-red-500');
    });
    it('applies amber border for medium severity', () => {
        render(_jsx(RiskCard, { risk: makeRisk({ severity: 'medium' }) }));
        expect(screen.getByTestId('risk-card').className).toContain('border-amber-500');
    });
    it('applies blue border for low severity', () => {
        render(_jsx(RiskCard, { risk: makeRisk({ severity: 'low' }) }));
        expect(screen.getByTestId('risk-card').className).toContain('border-blue-500');
    });
    it('renders the risk description', () => {
        render(_jsx(RiskCard, { risk: makeRisk() }));
        expect(screen.getByText('Test risk description')).toBeInTheDocument();
    });
    it('renders multiple links', () => {
        const risk = makeRisk({
            links: [
                { label: 'PR #42', url: 'https://github.com/org/repo/pull/42' },
                { label: 'PR #43', url: 'https://github.com/org/repo/pull/43' },
            ],
        });
        render(_jsx(RiskCard, { risk: risk }));
        const links = screen.getAllByTestId('risk-link');
        expect(links).toHaveLength(2);
        links.forEach((link) => {
            expect(link).toHaveAttribute('target', '_blank');
            expect(link).toHaveAttribute('rel', 'noreferrer');
        });
    });
});
