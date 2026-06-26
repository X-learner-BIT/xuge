import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface DataItem {
  domain: string;
  current: number;
  previous?: number;
}

interface Props {
  data: DataItem[];
  showPrevious?: boolean;
  height?: number;
}

export function RadarChartComponent({ data, showPrevious = false, height = 320 }: Props) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
        <PolarGrid stroke="rgba(0,0,0,0.06)" />
        <PolarAngleAxis
          dataKey="domain"
          tick={{ fontSize: 12, fontWeight: 500, fill: '#1e293b' }}
        />
        <PolarRadiusAxis
          angle={30}
          domain={[0, 100]}
          tick={{ fontSize: 10, fill: '#94a3b8' }}
          tickCount={6}
          axisLine={false}
        />
        <Radar
          name="当前掌握度"
          dataKey="current"
          stroke="#6366f1"
          strokeWidth={2}
          fill="#6366f1"
          fillOpacity={0.12}
          dot={{ r: 5, fill: '#6366f1', stroke: '#fff', strokeWidth: 2 }}
        />
        {showPrevious && (
          <Radar
            name="一周前"
            dataKey="previous"
            stroke="#14b8a6"
            strokeWidth={1.5}
            strokeDasharray="5 5"
            fill="#14b8a6"
            fillOpacity={0.08}
            dot={{ r: 3, fill: '#14b8a6', stroke: '#fff', strokeWidth: 1.5 }}
          />
        )}
        <Legend
          wrapperStyle={{ fontSize: 12, fontFamily: 'Inter, sans-serif', paddingTop: 8 }}
          iconType="circle"
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
