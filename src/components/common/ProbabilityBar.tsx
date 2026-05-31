interface ProbabilityBarProps {
  probability: number
  size?: 'sm' | 'md'
}

function getProbColor(prob: number) {
  if (prob >= 80) return 'from-green-500 to-green-600'
  if (prob >= 60) return 'from-emerald-500 to-emerald-600'
  if (prob >= 40) return 'from-yellow-500 to-yellow-600'
  if (prob >= 20) return 'from-orange-500 to-orange-600'
  return 'from-red-500 to-red-600'
}

export default function ProbabilityBar({ probability, size = 'sm' }: ProbabilityBarProps) {
  return (
    <div className={`w-full bg-gray-100 rounded-full overflow-hidden ${size === 'sm' ? 'h-1' : 'h-1.5'}`}>
      <div
        className={`h-full rounded-full bg-gradient-to-r ${getProbColor(probability)} transition-all duration-500`}
        style={{ width: `${probability}%` }}
      />
    </div>
  )
}
