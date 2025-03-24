import React, { useEffect } from 'react';
import * as echarts from 'echarts';
import type { EChartsOption } from 'echarts';
import { useMediaQuery } from 'usehooks-ts';

interface ForecastData {
    courseId: string;
    name: string;
    providerDate: string;
    EarlyMorning: number | null;
    MidMorning: number | null;
    EarlyAfternoon: number | null;
    Afternoon: number | null;
    Twilight: number | null;
}
interface HeatmapChartProps {
    data: ForecastData[];
    fullData: ForecastData[];
}

const HeatmapChart = ({ data ,fullData }: HeatmapChartProps) => {
    const isMobile = useMediaQuery("(max-width: 768px)");

    useEffect(() => {
        const chartDom = document.getElementById('heatmapChart')!;
        const myChart = echarts.init(chartDom);

        const timeSlots = [
            'EarlyMorning', 'MidMorning', 'EarlyAfternoon', 'Afternoon', 'Twilight'
        ];

        const days = data.map(item => item.providerDate);

        const allValues: number[] = fullData.flatMap((item: ForecastData) =>
        timeSlots.map((timeSlot: string) => {
            const value = item[timeSlot];
            return value != null && value !== '-' ? (value as number) : 0;
        })
    );

        const maxValue = Math.ceil(Math.max(...allValues) / 10) * 10;

        const formattedData: [string, string, number | string][] = data.flatMap((item: ForecastData) =>
            timeSlots.map((timeSlot, index) => {
                const value = item[timeSlot];
                return [item.providerDate, timeSlots[index], value || '-'] as [string, string, number | string];
            })
        );

        const option: EChartsOption = {
            tooltip: {
                position: 'top'
            },
            grid: {
                height: isMobile ? '58%' :'48%' ,
                width: isMobile ? "50%" : '75%',
                top: '15%',
                left:isMobile ? "28%" : '13%'
            },
            xAxis: {
                type: 'category',
                data: days,
                splitArea: {
                    show: true
                },
                axisLabel: {
                    rotate: 45,
                    interval: 0,
                    formatter: (value) => {
                        return value.substring(0, 10);
                    },
                    margin: 15,
                },
                name: 'Date',
                nameLocation: 'end',
                nameTextStyle: {
                    fontSize: 16,
                    fontWeight: 'bold',
                    color: '#333'
                },
                position: 'bottom'
            },
            yAxis: {
                type: 'category',
                data: timeSlots,
                splitArea: {
                    show: true
                },
                name: 'Time Slot',
                nameLocation: 'end',
                nameTextStyle: {
                    fontSize: 16,
                    fontWeight: 'bold',
                    color: '#333'
                },
                position: 'left',
                offset: 10
            },
            visualMap: isMobile ? {
                min: 0,
                max: maxValue,
                calculable: true,
                orient: 'horizontal',
                left: '20%',
                color: ['#0B311A', '#F7FcF5'],
                bottom: '-3%',
                width:"70%"
            } : {
                min: 0,
                max: maxValue,
                calculable: true,
                orient: 'vertical',
                right: '0',
                top: "5%",
                color: ['#0B311A', '#F7FcF5'],
                itemHeight: 250,
                height: '70%',
            },
            series: [
                {
                    name: 'Price Forecast',
                    type: 'heatmap',
                    data: formattedData,
                    label: {
                        show: true
                    },
                    emphasis: {
                        itemStyle: {
                            shadowBlur: 10,
                            shadowColor: 'rgba(0, 0, 0, 0.5)'
                        }
                    }
                }
            ]
        };

        myChart.setOption(option);
        return () => {
            myChart.dispose();
        };
    }, [data]);

    return <div style={{ width: isMobile ? '350px' : '100%', height: '420px',margin: '0 auto' }}>
        <div id="heatmapChart" style={{ width: '100%', height: '420px' }} />
    </div>
};

export default HeatmapChart;
