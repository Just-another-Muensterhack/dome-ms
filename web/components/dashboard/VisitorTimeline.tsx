import { useDateTimeFormat } from '@helpwave/hightide'
import { useLocale } from '@/i18n/useDomeTranslation'
import { dayMs } from '@/utils/dashboardVisitors'

type VisitorTimelinePoint = {
  date: Date,
  count: number,
}

type VisitorTimelineProps = {
  points: VisitorTimelinePoint[],
  end: Date,
  color?: string,
  label: string,
}

const width = 640
const height = 220
const padding = {
  top: 16,
  right: 48,
  bottom: 32,
  left: 48,
}

export const VisitorTimeline = ({
  points,
  end,
  color = '#3b6cff',
  label,
}: VisitorTimelineProps) => {
  const { locale } = useLocale()
  const { is24HourFormat } = useDateTimeFormat()
  const formatHour = (date: Date) => date.toLocaleString(locale, {
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: is24HourFormat ? 'h23' : 'h12',
  })
  if (points.length === 0) return null

  const start = new Date(end.getTime() - dayMs)
  const innerWidth = width - padding.left - padding.right
  const innerHeight = height - padding.top - padding.bottom
  const maxCount = Math.max(...points.map((point) => point.count), 1)
  const span = end.getTime() - start.getTime()
  const xFor = (date: Date) => padding.left + ((date.getTime() - start.getTime()) / span) * innerWidth
  const yFor = (count: number) => padding.top + (1 - count / maxCount) * innerHeight
  const baseline = padding.top + innerHeight
  const line = points.map((point) => `${xFor(point.date)},${yFor(point.count)}`).join(' ')
  const first = points[0]
  const last = points[points.length - 1]
  const area = first && last
    ? `M ${xFor(first.date)} ${baseline} L ${line.replaceAll(' ', ' L ')} L ${xFor(last.date)} ${baseline} Z`
    : ''
  const ticks = [start, new Date(start.getTime() + dayMs / 2), end]

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full h-52"
      role="img"
      aria-label={label}
    >
      <line
        x1={padding.left}
        y1={baseline}
        x2={width - padding.right}
        y2={baseline}
        className="stroke-neutral"
      />
      {area && <path d={area} fill={color} opacity="0.2" />}
      <polyline
        points={line}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {points.map((point) => (
        <circle
          key={point.date.toISOString()}
          cx={xFor(point.date)}
          cy={yFor(point.count)}
          r="3.5"
          fill={color}
        />
      ))}
      {ticks.map((tick) => (
        <text
          key={tick.toISOString()}
          x={xFor(tick)}
          y={height - 8}
          textAnchor="middle"
          fontSize="12"
          className="fill-description"
        >
          {formatHour(tick)}
        </text>
      ))}
    </svg>
  )
}
