interface BadgeRowProps {
  code: string
  type: 'diagnostico' | 'procedimiento'
  certainty: string
  probability: number
  size?: 'sm' | 'md'
}

const certaintyStyles: Record<string, string> = {
  Alta: 'bg-green-100 text-green-800 border-green-300',
  Media: 'bg-amber-100 text-amber-800 border-amber-300',
  Baja: 'bg-red-100 text-red-800 border-red-300',
}

const defaultCertainty = 'bg-gray-100 text-gray-800 border-gray-300'

export default function BadgeRow({ code, type, certainty, probability, size = 'md' }: BadgeRowProps) {
  const isMd = size === 'md'

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <span className={`font-mono font-bold rounded ${type === 'procedimiento' ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-600'} ${isMd ? 'text-xs px-2 py-0.5 rounded-md' : 'text-[10px] px-1.5 py-0.5 rounded'}`}>
        {code}
      </span>
      <span className={`font-semibold rounded-full border ${certaintyStyles[certainty] || defaultCertainty} ${isMd ? 'text-[10px] px-2 py-0.5' : 'text-[9px] px-1.5 py-0.5'}`}>
        {certainty}
      </span>
      <span className={`font-semibold bg-gray-100 text-gray-600 rounded-full ${isMd ? 'text-[10px] px-2 py-0.5' : 'text-[9px] px-1.5 py-0.5'}`}>
        {probability}%
      </span>
    </div>
  )
}
