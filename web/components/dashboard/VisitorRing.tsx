import type { VisitorCountrySegment } from '@/utils/dashboardVisitors'

const segmentColors = ['#3b6cff', '#1f9d6a', '#e39b12', '#e5484d', '#8b8d98']

type VisitorRingProps = {
  segments: VisitorCountrySegment[],
  total: number,
  label: string,
}

export const VisitorRing = ({
  segments,
  total,
  label,
}: VisitorRingProps) => {
  const size = 168
  const stroke = 22
  const center = size / 2
  const radius = center - stroke
  const circumference = 2 * Math.PI * radius
  const segmentTotal = segments.reduce((sum, segment) => sum + segment.value, 0)
  let offset = 0

  return (
    <div className="flex-row-4 items-center flex-wrap">
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="size-40 shrink-0"
        role="img"
        aria-label={label}
      >
        <g transform={`rotate(-90 ${center} ${center})`}>
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            className="stroke-neutral"
            strokeWidth={stroke}
          />
          {segments.map((segment, index) => {
            const length = segmentTotal === 0 ? 0 : (segment.value / segmentTotal) * circumference
            const dash = `${length} ${circumference - length}`
            const dashOffset = -offset
            offset += length
            const color = segmentColors[index] ?? segmentColors[segmentColors.length - 1] ?? '#8b8d98'
            return (
              <circle
                key={segment.id}
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={color}
                strokeWidth={stroke}
                strokeDasharray={dash}
                strokeDashoffset={dashOffset}
              />
            )
          })}
        </g>
        <text
          x={center}
          y={center}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize="22"
          fontWeight="600"
          fill="currentColor"
        >
          {total}
        </text>
      </svg>
      <ul className="flex-col-2 min-w-40 grow">
        {segments.map((segment, index) => {
          const color = segmentColors[index] ?? segmentColors[segmentColors.length - 1] ?? '#8b8d98'
          return (
            <li key={segment.id} className="flex-row-2 items-center justify-between gap-4">
              <span className="flex-row-2 items-center">
                <span
                  className="size-3 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span className="typography-body">{segment.label}</span>
              </span>
              <span className="typography-body">{segment.value}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
