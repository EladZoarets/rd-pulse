interface Props {
  children: React.ReactNode
  icon?: React.ReactNode
}

export function SectionHeading({ children, icon }: Props) {
  return (
    <div className="mb-4 flex items-center gap-2">
      {icon && <span className="text-slate-500">{icon}</span>}
      <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">{children}</h2>
      <div className="h-px flex-1 bg-slate-200" />
    </div>
  )
}
