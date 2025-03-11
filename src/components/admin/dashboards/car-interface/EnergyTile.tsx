import React from 'react';
import Card from '@/components/card';
import dynamic from 'next/dynamic';

// Dynamically import the chart to avoid SSR issues
const LineChart = dynamic(() => import('@/components/charts/LineAreaChart'), {
  ssr: false,
});

const EnergyTile = () => {
  // Sample data for energy consumption
  const lineChartData = [
    {
      name: 'Energy',
      data: [28, 25, 32, 30, 35, 40, 38, 37, 42, 35, 30, 28],
    },
  ];

  // Chart options
  const lineChartOptions = {
    chart: {
      toolbar: {
        show: false,
      },
      dropShadow: {
        enabled: true,
        top: 13,
        left: 0,
        blur: 10,
        opacity: 0.1,
        color: '#4318FF',
      },
    },
    colors: ['#4318FF'],
    markers: {
      size: 0,
      colors: 'white',
      strokeColors: '#4318FF',
      strokeWidth: 3,
      strokeOpacity: 0.9,
      strokeDashArray: 0,
      fillOpacity: 1,
      discrete: [],
      shape: 'circle',
      radius: 2,
      offsetX: 0,
      offsetY: 0,
      showNullDataPoints: true,
    },
    tooltip: {
      theme: 'dark',
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      curve: 'smooth',
      type: 'line',
    },
    xaxis: {
      type: 'numeric',
      categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      labels: {
        show: false,
        style: {
          colors: '#A3AED0',
          fontSize: '10px',
          fontWeight: '500',
        },
      },
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
    yaxis: {
      show: false,
    },
    legend: {
      show: false,
    },
    grid: {
      show: false,
      column: {
        opacity: 0.5,
      },
    },
  };

  return (
    <Card extra="p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-white">
            Energy Consumption
          </p>
          <h4 className="text-xl font-bold text-navy-700 dark:text-white">
            32 kWh/100mi
          </h4>
        </div>
        <div className="flex items-center">
          <span className="flex items-center text-sm text-green-500 font-medium">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 4.16667V15.8333" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M15.8333 10L10 15.8333L4.16667 10" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="ml-1">-8.2%</span>
          </span>
        </div>
      </div>
      
      <div className="h-32 w-full">
        <LineChart 
          chartData={lineChartData} 
          chartOptions={lineChartOptions} 
        />
      </div>
    </Card>
  );
};

export default EnergyTile; 