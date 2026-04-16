import { jsx as _jsx } from "react/jsx-runtime";
import { render, screen } from '@testing-library/react';
import { HealthBadge } from '../components/ui/HealthBadge';
describe('HealthBadge', () => {
    it('renders "On Track" for good health', () => {
        render(_jsx(HealthBadge, { health: "good" }));
        expect(screen.getByTestId('health-badge')).toHaveTextContent('On Track');
        expect(screen.getByTestId('health-badge')).toHaveAttribute('data-health', 'good');
    });
    it('renders "At Risk" for at_risk health', () => {
        render(_jsx(HealthBadge, { health: "at_risk" }));
        expect(screen.getByTestId('health-badge')).toHaveTextContent('At Risk');
    });
    it('renders "Critical" for critical health', () => {
        render(_jsx(HealthBadge, { health: "critical" }));
        expect(screen.getByTestId('health-badge')).toHaveTextContent('Critical');
    });
    it('applies green classes for good health', () => {
        render(_jsx(HealthBadge, { health: "good" }));
        expect(screen.getByTestId('health-badge').className).toContain('green');
    });
    it('applies amber classes for at_risk health', () => {
        render(_jsx(HealthBadge, { health: "at_risk" }));
        expect(screen.getByTestId('health-badge').className).toContain('amber');
    });
    it('applies red classes for critical health', () => {
        render(_jsx(HealthBadge, { health: "critical" }));
        expect(screen.getByTestId('health-badge').className).toContain('red');
    });
});
