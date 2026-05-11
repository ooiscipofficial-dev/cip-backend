import { useState, useMemo, useEffect, useRef } from 'react';
import { Maximize2, X } from 'lucide-react';

const PALETTE = [
  { from: "#667eea", to: "#764ba2" },
  { from: "#f093fb", to: "#f5576c" },
  { from: "#4facfe", to: "#00f2fe" },
  { from: "#43e97b", to: "#38f9d7" },
  { from: "#fa709a", to: "#fee140" },
  { from: "#a78bfa", to: "#818cf8" },
  { from: "#fb923c", to: "#f97316" },
  { from: "#34d399", to: "#059669" },
  { from: "#f472b6", to: "#ec4899" },
  { from: "#facc15", to: "#eab308" },
];

const COLORS = PALETTE.map((p) => p.from);

export default function PerformanceGraph({ data }) {
  const [view, setView] = useState('bar');
  const [isFocused, setIsFocused] = useState(false);
  const chartRef = useRef(null);
  const modalChartRef = useRef(null);
  const chartInstance = useRef(null);
  const modalChartInstance = useRef(null);
  const scrollRef = useRef(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    return data.map(c => ({
      name: c.name.replace(' Council', '').replace(' House', ''),
      score: c.impactScore || 0,
      color: c.color || COLORS[data.indexOf(c) % COLORS.length]
    })).sort((a, b) => b.score - a.score);
  }, [data]);

  const stats = useMemo(() => {
    if (chartData.length === 0) return [
      { label: "Average", value: "—", color: "#818cf8", icon: "◈" },
      { label: "Top Council", value: "—", color: "#34d399", icon: " " },
      { label: "Peak Score", value: "—", color: "#a78bfa", icon: "△" },
      { label: "Lowest", value: "—", color: "#f472b6", icon: "▽" },
    ];
    const vals = chartData.map(d => d.score);
    const avg = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
    const maxV = Math.max(...vals);
    const minV = Math.min(...vals);
    const topD = chartData.find(d => d.score === maxV);

    return [
      { label: "Average", value: `${avg}%`, color: "#818cf8", icon: "◈" },
      { label: "Top Council", value: (topD?.name || "—"), color: "#34d399", icon: " " },
      { label: "Peak Score", value: `${maxV}%`, color: "#a78bfa", icon: "△" },
      { label: "Lowest", value: `${minV}%`, color: "#f472b6", icon: "▽" },
    ];
  }, [chartData]);

  const avgValue = useMemo(() => {
    if (chartData.length === 0) return 0;
    const vals = chartData.map(d => d.score);
    return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
  }, [chartData]);

  const handleScroll = (e) => {
    const el = e.target;
    const progress = (el.scrollLeft / (el.scrollWidth - el.clientWidth)) * 100;
    setScrollProgress(isNaN(progress) ? 0 : progress);
  };

  const getChartOptions = (height, isModal = false) => {
    const labels = chartData.map(d => d.name);
    const values = chartData.map(d => d.score);
    const count = labels.length;

    const theme = {
        gridLine: "rgba(255,255,255,0.04)",
        textMuted: "rgba(255,255,255,0.4)",
        axisLabel: "rgba(255,255,255,0.3)",
        axisLabelFaint: "rgba(255,255,255,0.2)",
        tooltipBg: "rgba(8,8,16,0.96)",
        tooltipBorder: "rgba(255,255,255,0.09)",
        tooltipTitle: "rgba(255,255,255,0.3)",
        tooltipValue: "#fff",
        tooltipUnit: "rgba(255,255,255,0.35)",
        tooltipShadow: "0 12px 40px rgba(0,0,0,0.6)",
        gradientShade: "dark",
        radarStroke: "rgba(255,255,255,0.05)",
        radarConnector: "rgba(255,255,255,0.03)",
        radarFill1: "rgba(255,255,255,0.02)",
        radarFill2: "rgba(255,255,255,0.01)",
        radarLabel: "rgba(255,255,255,0.45)",
        markerStroke: "#080810",
        legendLabel: "rgba(255,255,255,0.4)",
        dataLabelColor: "rgba(255,255,255,0.45)",
        donutNameColor: "rgba(255,255,255,0.35)",
        donutValueColor: "#fff",
        donutTotalColor: "rgba(255,255,255,0.3)"
    };

    const tooltipHTML = (name, val, color) => `
        <div style="background: ${theme.tooltipBg}; border: 1px solid ${theme.tooltipBorder}; border-radius: 12px; padding: 12px 16px; box-shadow: ${theme.tooltipShadow}, 0 0 0 1px ${color}22; font-family: inherit; min-width: 130px;">
          <div style="font-size: 9px; text-transform: uppercase; letter-spacing: 0.14em; color: ${theme.tooltipTitle}; margin-bottom: 8px;">${name}</div>
          <div style="display:flex; align-items:center; gap:8px;">
            <div style="width:9px; height:9px; border-radius:50%; background:${color}; box-shadow: 0 0 8px ${color}; flex-shrink:0;"></div>
            <span style="font-size:22px; font-weight:700; color:${theme.tooltipValue}; line-height:1;">
              ${val}<span style="font-size:12px; color:${theme.tooltipUnit}; margin-left:2px;">%</span>
            </span>
          </div>
        </div>
    `;

    let opts = {
      series: view === 'donut' ? values : [{ name: 'Performance', data: values }],
      chart: {
        type: view === 'donut' ? 'donut' : view === 'radar' ? 'radar' : view,
        height,
        width: isModal ? "100%" : (view === 'bar' && count > 8 ? count * 80 : "100%"),
        background: "transparent",
        toolbar: { show: false },
        foreColor: theme.textMuted,
        fontFamily: "inherit",
        animations: { enabled: true, easing: "easeinout", speed: 650 },
      },
      colors: COLORS,
      grid: {
        borderColor: theme.gridLine,
        strokeDashArray: 4,
        yaxis: { lines: { show: view !== "radar" && view !== "donut" } },
      },
      tooltip: {
        theme: false,
        custom: ({ series, seriesIndex, dataPointIndex, w }) => {
            const val = view === 'donut' ? series[seriesIndex] : series[seriesIndex][dataPointIndex];
            const name = view === 'donut' ? w.globals.labels[seriesIndex] : (w.globals.labels?.[dataPointIndex] ?? labels[dataPointIndex] ?? "");
            const color = COLORS[(view === 'donut' ? seriesIndex : dataPointIndex) % COLORS.length];
            return tooltipHTML(name, val, color);
        }
      },
      xaxis: {
        categories: labels,
        labels: {
          rotate: count > 6 ? -35 : 0,
          rotateAlways: count > 6,
          style: { colors: labels.map(() => theme.axisLabel), fontSize: "11px" }
        },
        axisBorder: { show: false },
        axisTicks: { show: false }
      },
      yaxis: {
        min: 0,
        max: 100,
        tickAmount: 4,
        labels: {
          style: { colors: [theme.axisLabelFaint], fontSize: "11px" },
          formatter: (v) => `${v}%`
        }
      },
      dataLabels: { enabled: false },
      legend: {
          show: view === "donut" || view === "radar",
          position: "bottom",
          labels: { colors: theme.legendLabel },
          fontSize: "11px"
      }
    };

    if (view === "bar") {
      opts.plotOptions = {
        bar: { borderRadius: 7, borderRadiusApplication: "end", columnWidth: "50%", distributed: true, dataLabels: { position: "top" } }
      };
      opts.dataLabels = {
        enabled: true,
        formatter: (v) => `${v}%`,
        offsetY: -22,
        style: { fontSize: "10px", fontWeight: "600", colors: [theme.dataLabelColor] }
      };
    }

    if (view === "donut") {
        opts.labels = labels;
        opts.plotOptions = {
            pie: {
                donut: {
                    size: "62%",
                    labels: {
                        show: true,
                        name: { show: true, fontSize: "11px", color: theme.donutNameColor, offsetY: -6 },
                        value: { show: true, fontSize: "24px", fontWeight: "700", color: theme.donutValueColor, offsetY: 4, formatter: (v) => `${Math.round(v)}%` },
                        total: { show: true, label: "Average", color: theme.donutTotalColor, fontSize: "11px", formatter: () => `${avgValue}%` }
                    }
                }
            }
        };
    }

    if (view === "radar") {
        opts.plotOptions = {
            radar: {
                polygons: {
                    strokeColors: theme.radarStroke,
                    connectorColors: theme.radarConnector,
                    fill: { colors: [theme.radarFill1, theme.radarFill2] }
                }
            }
        };
    }

    return opts;
  };

  useEffect(() => {
    if (!window.ApexCharts || !chartRef.current || chartData.length === 0) return;
    if (chartInstance.current) chartInstance.current.destroy();
    
    chartInstance.current = new window.ApexCharts(chartRef.current, getChartOptions(340));
    chartInstance.current.render();

    return () => { if (chartInstance.current) chartInstance.current.destroy(); };
  }, [chartData, view, avgValue]);

  useEffect(() => {
    if (!isFocused || !window.ApexCharts || !modalChartRef.current || chartData.length === 0) return;
    if (modalChartInstance.current) modalChartInstance.current.destroy();
    
    modalChartInstance.current = new window.ApexCharts(modalChartRef.current, getChartOptions(500, true));
    modalChartInstance.current.render();

    return () => { if (modalChartInstance.current) modalChartInstance.current.destroy(); };
  }, [isFocused, view, avgValue]);

  if (chartData.length === 0) {
    return (
      <div className="performance-container bg-[#08080a] text-white p-8 rounded-[32px] border border-white/5 font-sans shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-6 w-48 bg-white/5 rounded-lg animate-pulse" />
          <div className="h-4 w-24 bg-white/5 rounded-full animate-pulse" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[1,2,3,4].map(i => <div key={i} className="h-16 bg-white/5 rounded-2xl animate-pulse" />)}
        </div>
        <div className="h-64 bg-white/5 rounded-2xl animate-pulse flex items-center justify-center">
          <p className="text-white/20 text-sm">Loading council data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="performance-container bg-[#08080a] text-white p-8 rounded-[32px] border border-white/5 space-y-8 font-sans overflow-hidden relative shadow-2xl">
      {/* Ambient Blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] opacity-20 bg-primary" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] opacity-10 bg-purple-500" />
      </div>

      <div className="relative z-10 space-y-8 text-left">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold tracking-tight">Performance Insights</h2>
              <p className="text-sm text-white/40">Compare council output and identify the top performer instantly.</p>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                Live Sync
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-center gap-3">
            <div className="flex-1 text-sm font-medium">
              <span className="font-bold">{stats[1].value}</span> is currently leading with a performance score of <span className="font-bold">{stats[2].value}</span>.
            </div>
          </div>

          <div className="bg-[#0c0c0e]/50 backdrop-blur-sm border border-white/5 rounded-[24px] p-6 space-y-8 shadow-inner">
            <div className="flex items-center justify-between flex-wrap gap-4">
               <div className="bg-white/5 p-1 rounded-xl flex gap-1 border border-white/5">
                  <TabBtn id="bar" label="BAR" active={view} set={setView} icon="▦" />
                  <TabBtn id="area" label="AREA" active={view} set={setView} icon="⌇" />
                  <TabBtn id="radar" label="RADAR" active={view} set={setView} icon="◎" />
                  <TabBtn id="donut" label="DONUT" active={view} set={setView} icon="◉" />
               </div>
               <button 
                 onClick={() => setIsFocused(true)}
                 className="bg-white/5 p-2 rounded-xl border border-white/5 text-white/40 hover:text-white transition-all hover:bg-white/10 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider px-3"
               >
                 <Maximize2 size={12} /> Focus
               </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 border-y border-white/5 py-6 gap-y-6">
              {stats.map((s, i) => (
                <div key={i} className="flex flex-col items-center justify-center text-center px-4 border-r last:border-r-0 border-white/5">
                  <div className="flex items-center gap-2 mb-1 justify-center">
                    <span style={{ color: s.color, textShadow: `0 0 10px ${s.color}88` }} className="text-xs">{s.icon}</span>
                    <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{s.label}</span>
                  </div>
                  <div className="text-lg md:text-xl font-bold truncate w-full">{s.value}</div>
                </div>
              ))}
            </div>

            <div 
              ref={scrollRef}
              onScroll={handleScroll}
              className="w-full relative overflow-x-auto scrollbar-hide py-4"
              style={{ scrollBehavior: 'smooth' }}
            >
              <div ref={chartRef} />
            </div>

            {view === 'bar' && chartData.length > 8 && (
              <div className="flex flex-col items-center gap-2 pt-4">
                <div className="w-full h-1 bg-white/5 rounded-full relative overflow-hidden">
                   <div 
                     className="absolute left-0 top-0 h-full bg-white/20 rounded-full transition-all duration-300" 
                     style={{ width: '33%', left: `${scrollProgress * 0.66}%` }}
                   />
                </div>
                <div className="text-[9px] font-bold text-white/20 uppercase tracking-[0.3em] flex items-center gap-2">
                  <span className="animate-pulse">←</span> Scroll to explore <span className="animate-pulse">→</span>
                </div>
              </div>
            )}
          </div>
      </div>

      {/* Focus Modal */}
      {isFocused && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
            <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={() => setIsFocused(false)} />
            <div className="relative z-10 w-full max-w-5xl bg-[#08080a] border border-white/10 rounded-[32px] p-8 shadow-2xl flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-2xl font-bold">Focus View</h2>
                        <p className="text-sm text-white/40">Detailed performance analytics across all councils</p>
                    </div>
                    <button 
                        onClick={() => setIsFocused(false)}
                        className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors border border-white/10"
                    >
                        <X size={20} />
                    </button>
                </div>
                <div className="flex-1 overflow-hidden">
                    <div ref={modalChartRef} />
                </div>
            </div>
        </div>
      )}
    </div>
  );
}

function TabBtn({ id, label, active, set, icon }) {
  const isActive = active === id;
  return (
    <button 
      onClick={() => set(id)}
      className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg text-[10px] font-bold transition-all duration-200 whitespace-nowrap
        ${isActive ? 'bg-white/10 text-white shadow-xl' : 'text-white/30 hover:text-white/60'}`}
    >
      <span className="text-sm">{icon}</span> {label}
    </button>
  );
}




