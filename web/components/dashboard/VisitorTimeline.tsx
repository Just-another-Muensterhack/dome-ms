import { useDateTimeFormat } from '@helpwave/hightide'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useLocale } from '@/i18n/useDomeTranslation'

type VisitorTimelinePoint = {
  date: Date,
  count: number,
}

type VisitorTimelineProps = {
  points: VisitorTimelinePoint[],
  end: Date,
  spanMs: number,
  color?: string,
  label: string,
}

export const VisitorTimeline = ({
  points,
  end,
  spanMs,
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
  const start = new Date(end.getTime() - spanMs)
  const ticks = [start.getTime(), start.getTime() + spanMs / 2, end.getTime()]
  const data = points.map((point) => ({
    time: point.date.getTime(),
    count: point.count,
  }))

  return (
    <div className="h-52 w-full text-description" role="img" aria-label={label}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <CartesianGrid stroke="currentColor" strokeOpacity={0.35} vertical={false} />
          <XAxis
            dataKey="time"
            type="number"
            scale="time"
            domain={[start.getTime(), end.getTime()]}
            ticks={ticks}
            tickFormatter={(value: number) => formatHour(new Date(value))}
            tick={{ fill: 'currentColor', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            width={36}
            tick={{ fill: 'currentColor', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            labelFormatter={(value) => formatHour(new Date(Number(value)))}
          />
          <Area
            type="monotone"
            dataKey="count"
            stroke={color}
            fill={color}
            fillOpacity={0.2}
            strokeWidth={2.5}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
