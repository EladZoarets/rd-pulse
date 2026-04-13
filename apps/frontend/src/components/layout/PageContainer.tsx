interface Props {
  children: React.ReactNode
  className?: string
}

export function PageContainer({ children, className = '' }: Props) {
  return (
    <div className={`mx-auto max-w-5xl px-6 py-10 ${className}`}>
      {children}
    </div>
  )
}
