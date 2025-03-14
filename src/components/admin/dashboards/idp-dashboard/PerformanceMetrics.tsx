'use client';
import { useEffect, useState } from 'react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts';

// Sample data for the chart
const performanceData = [
  { name: 'Jan', accuracy: 94, volume: 1200, sla: 97 },
  { name: 'Feb', accuracy: 95, volume: 1350, sla: 97 },
  { name: 'Mar', accuracy: 96, volume: 1500, sla: 98 },
  { name: 'Apr', accuracy: 95.5, volume: 1650, sla: 98 },
  { name: 'May', accuracy: 96.2, volume: 1800, sla: 99 },
  { name: 'Jun', accuracy: 97.0, volume: 1950, sla: 99 },
  { name: 'Jul', accuracy: 97.2, volume: 2100, sla: 99 },
];

type MetricCardProps = {
  title: string;
  value: string | number;
  change: number;
  color: string;
  secondary?: string;
};

/**
 * Display a single performance metric with title, value and trend
 */
const MetricCard = ({ title, value, change, color, secondary }: MetricCardProps) => {
  return (
    <div className="bg-white dark:bg-navy-800 rounded-xl p-4 shadow-sm">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
          <h3 className="text-2xl font-bold mt-1">{value}</h3>
          {secondary && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{secondary}</p>
          )}
        </div>
        <div className={`px-2 py-1 rounded-md text-xs font-medium ${
          change >= 0 ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 
          'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
        }`}>
          {change >= 0 ? '+' : ''}{change}%
        </div>
      </div>
    </div>
  );
};

/**
 * Component to display IDP performance metrics and trends
 */
const PerformanceMetrics = () => {
  const [chartData, setChartData] = useState(performanceData);
  const [activeMetric, setActiveMetric] = useState<'accuracy' | 'volume' | 'sla'>('accuracy');

  return (
    <div className="w-full bg-white dark:bg-navy-800 rounded-xl border border-gray-200 dark:border-navy-700 p-4 sm:p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h2 className="text-lg font-bold mb-2 md:mb-0">Performance Overview</h2>
        <div className="flex space-x-2">
          <button 
            onClick={() => setActiveMetric('accuracy')}
            className={`px-3 py-1 text-sm rounded-full ${
              activeMetric === 'accuracy' ? 
              'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 
              'bg-gray-100 text-gray-600 dark:bg-navy-700 dark:text-gray-400'
            }`}
          >
            Accuracy
          </button>
          <button 
            onClick={() => setActiveMetric('volume')}
            className={`px-3 py-1 text-sm rounded-full ${
              activeMetric === 'volume' ? 
              'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' : 
              'bg-gray-100 text-gray-600 dark:bg-navy-700 dark:text-gray-400'
            }`}
          >
            Volume
          </button>
          <button 
            onClick={() => setActiveMetric('sla')}
            className={`px-3 py-1 text-sm rounded-full ${
              activeMetric === 'sla' ? 
              'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 
              'bg-gray-100 text-gray-600 dark:bg-navy-700 dark:text-gray-400'
            }`}
          >
            SLA
          </button>
        </div>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <MetricCard 
          title="Overall Accuracy" 
          value="97.2%" 
          change={1.5} 
          color="blue"
          secondary="vs. 95.7% last month"
        />
        <MetricCard 
          title="Documents Processed" 
          value="14,328" 
          change={12.3} 
          color="purple"
          secondary="2,100 this month"
        />
        <MetricCard 
          title="SLA Compliance" 
          value="99%" 
          change={0.8} 
          color="green"
          secondary="Target: 98%"
        />
      </div>

      {/* Chart */}
      <div className="h-64 mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorAccuracy" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#A855F7" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#A855F7" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorSLA" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22C55E" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="name" tickLine={false} axisLine={false} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.8)', 
                borderRadius: '8px',
                border: '1px solid #e2e8f0'
              }} 
            />
            {activeMetric === 'accuracy' && (
              <Area
                type="monotone"
                dataKey="accuracy"
                stroke="#3B82F6"
                fillOpacity={1}
                fill="url(#colorAccuracy)"
              />
            )}
            {activeMetric === 'volume' && (
              <Area
                type="monotone"
                dataKey="volume"
                stroke="#A855F7"
                fillOpacity={1}
                fill="url(#colorVolume)"
              />
            )}
            {activeMetric === 'sla' && (
              <Area
                type="monotone"
                dataKey="sla"
                stroke="#22C55E"
                fillOpacity={1}
                fill="url(#colorSLA)"
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default PerformanceMetrics; 