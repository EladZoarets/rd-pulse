import { jsx as _jsx } from "react/jsx-runtime";
const CHIP_STYLES = {
    jira: 'bg-blue-50 text-blue-700 border-blue-200',
    github: 'bg-slate-100 text-slate-700 border-slate-200',
    team: 'bg-purple-50 text-purple-700 border-purple-200',
};
const CHIP_LABEL = {
    jira: 'Jira',
    github: 'GitHub',
    team: 'Team',
};
export function SourceChip({ source }) {
    return (_jsx("span", { className: `inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${CHIP_STYLES[source]}`, children: CHIP_LABEL[source] }));
}
