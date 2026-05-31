interface DifferentialTagsProps {
  tags: string[]
  max?: number
  size?: 'sm' | 'md'
}

export default function DifferentialTags({ tags, max = 3, size = 'sm' }: DifferentialTagsProps) {
  if (tags.length === 0) return null

  const visible = tags.slice(0, max)
  const isMd = size === 'md'

  return (
    <div className="flex flex-wrap gap-1">
      {visible.map((tag, i) => (
        <span
          key={i}
          className={`bg-amber-50 text-amber-700 border border-amber-200 rounded ${isMd ? 'text-[10px] px-2 py-0.5 rounded-md' : 'text-[9px] px-1.5 py-0.5 rounded'}`}
        >
          {tag.length > (isMd ? 40 : 30) ? tag.slice(0, isMd ? 40 : 30) + '…' : tag}
        </span>
      ))}
    </div>
  )
}
