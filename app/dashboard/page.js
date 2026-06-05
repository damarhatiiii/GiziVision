'use client';

import { useState, useEffect } from 'react';
import { getDashboardStats, clearHistory } from '@/services/history.service';
import Link from 'next/link';
import {
  ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell,
  BarChart, Bar
} from 'recharts';
import { Trash2, Camera, Sparkles, TrendingUp, Flame, Award, Scale } from 'lucide-react';

// Custom tooltip for Recharts
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-card border border-border rounded-lg px-3 py-2 text-xs shadow-lg">
        <p className="text-text-muted mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} className="text-text-primary font-semibold">
            {p.name}: {p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  const loadStats = () => {
    setStats(getDashboardStats());
    setLoading(false);
  };

  useEffect(() => {
    loadStats();
    setMounted(true);
  }, []);

  const handleSeedSimulation = async () => {
    // Fetch real nutrition data from the API to ensure accuracy
    const mockFoodNames = [
      'Bakso', 'Nasi Goreng', 'Sate ayam', 'Rendang',
      'Gado-gado', 'Tempe murni goreng'
    ];

    if (typeof window === 'undefined') return;

    // Try to get real data from the search API
    const mockFoods = [];
    for (const name of mockFoodNames) {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(name)}`);
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const item = data[0];
          mockFoods.push({
            name: item.name,
            calories: Number(item.calories) || 0,
            proteins: Number(item.proteins) || 0,
            fat: Number(item.fat) || 0,
            carbohydrate: Number(item.carbohydrate) || 0,
          });
        }
      } catch {
        // Ignore errors, skip this food
      }
    }

    // Fallback if API calls failed
    if (mockFoods.length === 0) {
      mockFoods.push(
        { name: 'Bakso', calories: 76, proteins: 4.1, fat: 2.5, carbohydrate: 9.2 },
        { name: 'Nasi Goreng', calories: 276, proteins: 3.2, fat: 3.2, carbohydrate: 30.2 },
        { name: 'Mie Goreng', calories: 468, proteins: 7.6, fat: 20.4, carbohydrate: 62.4 },
        { name: 'Tempe murni goreng', calories: 336, proteins: 20, fat: 23, carbohydrate: 18 },
      );
    }

    localStorage.removeItem('gizivision_history');
    const now = new Date();
    const list = [];
    for (let i = 9; i >= 0; i--) {
      const food = mockFoods[Math.floor(Math.random() * mockFoods.length)];
      list.push({
        id: (Date.now() - i * 1000).toString(),
        timestamp: new Date(now.getTime() - i * 14 * 60 * 60 * 1000).toISOString(),
        foodName: food.name,
        items: [{
          name: food.name,
          confidence: Math.round((0.85 + Math.random() * 0.14) * 100) / 100,
          source: 'dataset',
          nutrition: food,
        }],
        totalNutrition: food,
        image: null,
      });
    }
    localStorage.setItem('gizivision_history', JSON.stringify(list));
    loadStats();
  };

  const handleClear = () => {
    if (confirm('Hapus seluruh riwayat scan?')) {
      clearHistory();
      loadStats();
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-sm text-text-muted">Memuat dashboard...</p>
        </div>
      </div>
    );
  }

  const { totalScans, avgCalories, popularFood, popularCount, totalMacros, chartCalories, chartMacros, popularFoodsList } = stats;

  return (
    <div className="flex-1 container mx-auto px-6 max-w-7xl py-10">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="gold-line"></div>
            <span className="section-label">Dashboard</span>
          </div>
          <h1 className="text-3xl font-bold text-text-primary">Statistik Nutrisi</h1>
          <p className="text-sm text-text-muted mt-1">Ringkasan asupan kalori dan makronutrisi dari riwayat pemindaian Anda.</p>
        </div>
        {totalScans > 0 && (
          <button
            onClick={handleClear}
            className="flex items-center gap-2 text-xs text-danger border border-danger/20 bg-danger/5 px-3 py-2 rounded-lg hover:bg-danger/10 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Hapus Semua Riwayat
          </button>
        )}
      </div>

      {/* Empty state */}
      {totalScans === 0 ? (
        <div className="card p-14 text-center max-w-lg mx-auto mt-10">
          <div className="w-14 h-14 rounded-xl bg-card border border-border flex items-center justify-center mx-auto mb-5">
            <TrendingUp className="w-7 h-7 text-text-muted" />
          </div>
          <h2 className="text-xl font-bold text-text-primary mb-2">Belum Ada Data</h2>
          <p className="text-sm text-text-muted mb-8 leading-relaxed">
            Dashboard akan menampilkan statistik dan grafik nutrisi setelah Anda melakukan pemindaian makanan.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/upload" className="btn-primary justify-center">
              <Camera className="w-4 h-4" />
              Scan Sekarang
            </Link>
            <button onClick={handleSeedSimulation} className="btn-secondary justify-center">
              <Sparkles className="w-4 h-4" />
              Simulasikan Data
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">

          {/* KPI Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Pemindaian', value: `${totalScans} Scan`, sub: 'Tersimpan di perangkat', icon: TrendingUp },
              { label: 'Rata-rata Kalori', value: `${avgCalories} kkal`, sub: 'Per porsi makanan', icon: Flame },
              { label: 'Menu Terpopuler', value: popularFood, sub: `Dianalisis ${popularCount} kali`, icon: Award },
              { label: 'Total Makronutrisi', value: `${Math.round(totalMacros.protein + totalMacros.fat + totalMacros.carbohydrate)}g`, sub: 'Karbo + Protein + Lemak', icon: Scale },
            ].map((kpi, i) => (
              <div key={i} className="card p-5">
                <div className="flex items-start justify-between mb-3">
                  <p className="stat-label">{kpi.label}</p>
                  <kpi.icon className="w-4 h-4 text-text-muted" />
                </div>
                <p className="text-xl font-bold text-text-primary truncate">{kpi.value}</p>
                <p className="text-xs text-text-muted mt-0.5">{kpi.sub}</p>
              </div>
            ))}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

            {/* Area Chart */}
            <div className="lg:col-span-7 card p-6 min-w-0">
              <div className="mb-5">
                <p className="stat-label mb-1">Asupan Kalori Harian</p>
                <h3 className="text-base font-semibold text-text-primary">Tren 7 Hari Terakhir</h3>
              </div>
              <div className="h-64">
                {mounted && (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartCalories} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="gradCal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#6F4E37" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#6F4E37" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="2 4" stroke="#222" opacity={0.6} />
                      <XAxis dataKey="date" stroke="#404040" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke="#404040" fontSize={10} tickLine={false} axisLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="Kalori"
                        stroke="#6F4E37"
                        strokeWidth={1.5}
                        fill="url(#gradCal)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Pie Chart */}
            <div className="lg:col-span-5 card p-6 flex flex-col min-w-0">
              <div className="mb-5">
                <p className="stat-label mb-1">Distribusi Makronutrisi</p>
                <h3 className="text-base font-semibold text-text-primary">Rata-rata Komposisi</h3>
              </div>
              <div className="flex-1 relative flex items-center justify-center min-h-45">
                {mounted && (
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie
                        data={chartMacros}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {chartMacros.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(v, n, p) => [`${v}% (${p.payload.grams}g)`, n]}
                        content={({ active, payload }) => {
                          if (active && payload?.length) {
                            const d = payload[0].payload;
                            return (
                              <div className="bg-card border border-border rounded-lg px-3 py-2 text-xs shadow-lg">
                                <p className="text-text-primary font-semibold">{d.name}</p>
                                <p className="text-text-muted">{d.value}% · {d.grams}g</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
                <div className="absolute flex flex-col items-center pointer-events-none">
                  <span className="text-[10px] text-text-muted uppercase tracking-widest font-bold">Avg kkal</span>
                  <span className="text-xl font-bold text-text-primary">{avgCalories}</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-border">
                {chartMacros.map((m, i) => (
                  <div key={i} className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-0.5">
                      <div className="w-2 h-2 rounded-full" style={{ background: m.color }}></div>
                      <span className="text-[10px] font-semibold text-text-secondary">{m.name}</span>
                    </div>
                    <span className="text-xs text-text-muted">{m.grams}g</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Popular Foods Bar */}
          <div className="card p-6 min-w-0">
            <div className="mb-5">
              <p className="stat-label mb-1">Frekuensi Pemindaian</p>
              <h3 className="text-base font-semibold text-text-primary">Top 5 Menu Paling Sering Dianalisis</h3>
            </div>
            <div className="h-56">
              {mounted && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={popularFoodsList}
                    layout="vertical"
                    margin={{ top: 0, right: 20, left: 10, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="2 4" stroke="#222" opacity={0.5} horizontal={false} />
                    <XAxis type="number" stroke="#404040" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                    <YAxis dataKey="name" type="category" stroke="#404040" fontSize={11} tickLine={false} axisLine={false} width={110} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="Jumlah" radius={[0, 3, 3, 0]} barSize={14}>
                      {popularFoodsList.map((_, i) => (
                        <Cell key={i} fill={i === 0 ? '#D4AF37' : i === 1 ? '#C9A227' : '#6F4E37'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

        </div>
      )}

      {/* ── TIM PENGEMBANG (Bootcamp IT 2026) ── */}
      <div className="mt-12 pt-8 border-t border-border/60">
        <div className="card bg-card/40 border border-border-subtle p-5 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <span className="text-[10px] font-bold text-gold uppercase tracking-wider block mb-1">Pengembang Aplikasi</span>
            <h4 className="text-sm font-bold text-text-primary">Tim Bootcamp IT 2026</h4>
            <p className="text-xs text-text-muted mt-0.5">Mahasiswa Semester 4 Prodi Informatika, Universitas Bina Sarana Informatika</p>
          </div>
          <div className="flex flex-wrap gap-2 md:justify-end max-w-2xl">
            {[
              { name: 'Muhammad Damarhati', nim: '15240045' },
              { name: 'Ananta Bagas Sasena', nim: '15240078' },
              { name: 'Achmad Nazzri Adlan Fatkhuladzi', nim: '15240054' },
              { name: 'Akhdan Adiva Sangaji', nim: '15240006' },
              { name: 'Dyas Fathir Arkananta', nim: '15240091' },
            ].map((member, i) => (
              <div 
                key={i} 
                className="px-3 py-1.5 rounded-lg bg-surface border border-border/80 flex flex-col items-start gap-0.5 text-left hover:border-gold/30 transition-colors"
              >
                <span className="text-xs font-semibold text-text-primary leading-none">{member.name}</span>
                <span className="text-[10px] text-text-muted leading-none font-mono mt-0.5">{member.nim}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
