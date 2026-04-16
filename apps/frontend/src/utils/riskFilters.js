const SEVERITY_WEIGHT = {
    high: 3,
    medium: 2,
    low: 1,
};
export function sortBySeverity(risks) {
    return [...risks].sort((a, b) => (SEVERITY_WEIGHT[b.severity] ?? 0) - (SEVERITY_WEIGHT[a.severity] ?? 0));
}
export function filterByTypes(risks, types) {
    return risks.filter((r) => types.includes(r.type));
}
export function topRisks(risks, limit = 5) {
    return sortBySeverity(risks).slice(0, limit);
}
export function jiraRisks(risks) {
    return filterByTypes(risks, ['stall', 'sprint_jeopardy', 'unassigned_risk']);
}
export function teamSignalRisks(risks) {
    return filterByTypes(risks, ['overload', 'unassigned_risk', 'ghost_work']);
}
export function githubSignalRisks(risks) {
    return filterByTypes(risks, ['review_bottleneck', 'ghost_work']);
}
export function collectAllLinks(risks, _insights) {
    return risks.flatMap((r) => r.links);
}
