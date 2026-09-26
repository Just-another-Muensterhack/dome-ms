import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import type { VisitorCountrySegment } from '@/utils/dashboardVisitors'

const segmentColors = ['#3b6cff', '#1f9d6a', '#e39b12', '#e5484d', '#8b8d98']

type VisitorRingProps = {
  segments: VisitorCountrySegment[],
  label: string,
}

export const VisitorRing = ({
  segments,
  label,
}: VisitorRingProps) => {
  const data = segments.map((segment, index) => ({
    ...segment,
    fill: segmentColors[index] ?? segmentColors[segmentColors.length - 1] ?? '#8b8d98',
  }))

  return (
    <div className="h-56 w-full" role="img" aria-label={label}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="label"
            innerRadius="58%"
            outerRadius="78%"
            paddingAngle={data.length > 1 ? 2 : 0}
            stroke="none"
          >
            {data.map((segment) => (
              <Cell key={segment.id} fill={segment.fill} />
            ))}
          </Pie>
          <Tooltip />
          <Legend
            layout="vertical"
            align="right"
            verticalAlign="middle"
            formatter={(value: string, entry) => {
              const count = entry.payload && 'value' in entry.payload ? entry.payload.value : undefined
              return count === undefined ? value : `${value} (${count})`
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
