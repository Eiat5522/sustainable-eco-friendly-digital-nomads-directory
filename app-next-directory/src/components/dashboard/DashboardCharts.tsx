'use client';

import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  NeoCard,
  NeoCardContent,
  NeoCardDescription,
  NeoCardHeader,
  NeoCardTitle,
} from '@/components/ui/neo-card';
import { cn } from '@/lib/utils';

const CHART_COLORS = {
  primary: '#1d4d4f',
  secondary: '#e7a33e',
  accent: '#6aa84f',
  highlight: '#d96459',
  muted: '#8aa39b',
  surface: '#f4f1e8',
  text: '#17313a',
  grid: '#c6d3ca',
};

const PIE_COLORS = ['#1d4d4f', '#e7a33e', '#6aa84f', '#d96459', '#8aa39b'];

type MetricCardProps = {
  title: string;
  value: number | null;
  helper: string;
  tone?: 'default' | 'accent';
  testId?: string;
};

type ChartCardProps = {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
  testId?: string;
};

type TrendSeries = {
  dataKey: string;
  label: string;
  color: string;
  type?: 'line' | 'area';
};

type BreakdownDatum = {
  label: string;
  value: number;
  color?: string;
};

type ListingComparisonDatum = {
  id: string;
  label: string;
  city?: string | null;
  rating: number | null;
  reviews: number;
  favourites: number;
  views: number | null;
};

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return undefined;
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updatePreference = () => setPrefersReducedMotion(mediaQuery.matches);

    updatePreference();
    mediaQuery.addEventListener('change', updatePreference);

    return () => mediaQuery.removeEventListener('change', updatePreference);
  }, []);

  return prefersReducedMotion;
}

function useAnimatedNumber(value: number | null) {
  return typeof value === 'number' && !Number.isNaN(value) ? value : null;
}

function formatMetricValue(value: number | null) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '—';
  }

  const isInteger = Number.isInteger(value);
  if (!isInteger) {
    return value.toFixed(2);
  }

  return Math.round(value).toLocaleString();
}

export function DashboardMetricCard({
  title,
  value,
  helper,
  tone = 'default',
  testId,
}: MetricCardProps) {
  const animatedValue = useAnimatedNumber(value);

  return (
    <NeoCard
      data-testid={testId}
      className={cn(
        'h-full border-4 border-neo-border bg-white shadow-[8px_8px_0px_0px_rgba(20,43,51,0.22)] transition-transform duration-200 motion-reduce:transition-none hover:-translate-y-1 hover:shadow-[12px_12px_0px_0px_rgba(20,43,51,0.28)]',
        tone === 'accent' && 'bg-neo-secondary/15'
      )}
    >
      <NeoCardHeader className="pb-3">
        <NeoCardTitle className="text-base text-neo-text-secondary">{title}</NeoCardTitle>
      </NeoCardHeader>
      <NeoCardContent className="space-y-2">
        <p className="text-3xl font-semibold text-neo-text-primary">
          {formatMetricValue(animatedValue)}
        </p>
        <p className="text-sm text-neo-text-secondary">{helper}</p>
      </NeoCardContent>
    </NeoCard>
  );
}

export function DashboardChartCard({
  title,
  description,
  children,
  footer,
  testId,
}: ChartCardProps) {
  return (
    <NeoCard
      data-testid={testId}
      className="h-full border-4 border-neo-border bg-white/95 shadow-[10px_10px_0px_0px_rgba(20,43,51,0.18)]"
    >
      <NeoCardHeader className="space-y-2 pb-3">
        <NeoCardTitle className="text-lg text-neo-text-primary">{title}</NeoCardTitle>
        <NeoCardDescription className="text-sm text-neo-text-secondary">
          {description}
        </NeoCardDescription>
      </NeoCardHeader>
      <NeoCardContent className="space-y-4">
        {children}
        {footer}
      </NeoCardContent>
    </NeoCard>
  );
}

export function DashboardTrendChart({
  title,
  description,
  data,
  series,
  testId,
}: {
  title: string;
  description: string;
  data: object[];
  series: TrendSeries[];
  testId?: string;
}) {
  const prefersReducedMotion = usePrefersReducedMotion();

  return (
    <DashboardChartCard title={title} description={description} testId={testId}>
      <div className="h-80 w-full" data-testid={testId ? `${testId}-canvas` : undefined}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 12, right: 12, left: -12, bottom: 0 }}>
            <CartesianGrid stroke={CHART_COLORS.grid} strokeDasharray="4 4" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: CHART_COLORS.text, fontSize: 12 }} />
            <YAxis tick={{ fill: CHART_COLORS.text, fontSize: 12 }} allowDecimals={false} />
            <Tooltip
              contentStyle={{
                borderRadius: 16,
                borderColor: CHART_COLORS.text,
                backgroundColor: '#fffdf8',
              }}
            />
            <Legend />
            {series.map(item => {
              if (item.type === 'area') {
                return (
                  <Area
                    key={item.dataKey}
                    type="monotone"
                    dataKey={item.dataKey}
                    name={item.label}
                    stroke={item.color}
                    fill={item.color}
                    fillOpacity={0.18}
                    strokeWidth={3}
                    isAnimationActive={!prefersReducedMotion}
                    animationDuration={700}
                  />
                );
              }

              return (
                <Line
                  key={item.dataKey}
                  type="monotone"
                  dataKey={item.dataKey}
                  name={item.label}
                  stroke={item.color}
                  strokeWidth={3}
                  dot={{ r: 4, fill: item.color }}
                  activeDot={{ r: 6 }}
                  isAnimationActive={!prefersReducedMotion}
                  animationDuration={700}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </DashboardChartCard>
  );
}

export function DashboardBreakdownChart({
  title,
  description,
  data,
  testId,
}: {
  title: string;
  description: string;
  data: BreakdownDatum[];
  testId?: string;
}) {
  const prefersReducedMotion = usePrefersReducedMotion();

  return (
    <DashboardChartCard title={title} description={description} testId={testId}>
      <div className="h-72 w-full" data-testid={testId ? `${testId}-canvas` : undefined}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid stroke={CHART_COLORS.grid} strokeDasharray="4 4" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: CHART_COLORS.text, fontSize: 12 }} />
            <YAxis tick={{ fill: CHART_COLORS.text, fontSize: 12 }} allowDecimals={false} />
            <Tooltip
              contentStyle={{
                borderRadius: 16,
                borderColor: CHART_COLORS.text,
                backgroundColor: '#fffdf8',
              }}
            />
            <Bar
              dataKey="value"
              radius={[12, 12, 0, 0]}
              isAnimationActive={!prefersReducedMotion}
              animationDuration={650}
            >
              {data.map((entry, index) => (
                <Cell key={`${entry.label}-${index}`} fill={entry.color ?? PIE_COLORS[index % PIE_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </DashboardChartCard>
  );
}

export function DashboardDonutChart({
  title,
  description,
  data,
  testId,
}: {
  title: string;
  description: string;
  data: BreakdownDatum[];
  testId?: string;
}) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const nonZeroData = useMemo(() => data.filter(item => item.value > 0), [data]);

  return (
    <DashboardChartCard title={title} description={description} testId={testId}>
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_180px] md:items-center">
        <div className="h-72 w-full" data-testid={testId ? `${testId}-canvas` : undefined}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip
                contentStyle={{
                  borderRadius: 16,
                  borderColor: CHART_COLORS.text,
                  backgroundColor: '#fffdf8',
                }}
              />
              <Pie
                data={nonZeroData}
                dataKey="value"
                nameKey="label"
                innerRadius={62}
                outerRadius={96}
                paddingAngle={2}
                isAnimationActive={!prefersReducedMotion}
                animationDuration={650}
              >
                {nonZeroData.map((entry, index) => (
                  <Cell key={`${entry.label}-${index}`} fill={entry.color ?? PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="space-y-3">
          {nonZeroData.map((entry, index) => (
            <div key={entry.label} className="flex items-center justify-between gap-3 rounded-2xl border-2 border-neo-border/60 bg-neo-surface/40 px-4 py-3 text-sm">
              <span className="flex items-center gap-2 font-medium text-neo-text-primary">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: entry.color ?? PIE_COLORS[index % PIE_COLORS.length] }}
                />
                {entry.label}
              </span>
              <span className="font-semibold text-neo-text-secondary">{entry.value}</span>
            </div>
          ))}
        </div>
      </div>
    </DashboardChartCard>
  );
}

export function ListingComparisonBoard({
  title,
  description,
  data,
  testId,
}: {
  title: string;
  description: string;
  data: ListingComparisonDatum[];
  testId?: string;
}) {
  return (
    <DashboardChartCard title={title} description={description} testId={testId}>
      <div className="space-y-3">
        {data.map(item => {
          const engagementMax = Math.max(item.reviews, item.favourites, item.views ?? 0, 1);
          return (
            <div
              key={item.id}
              className="rounded-3xl border-2 border-neo-border/70 bg-neo-surface/40 p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-base font-semibold text-neo-text-primary">{item.label}</p>
                  <p className="text-sm text-neo-text-secondary">{item.city ?? 'Unknown city'}</p>
                </div>
                <div className="grid gap-2 text-right text-sm text-neo-text-secondary sm:grid-cols-2 sm:text-left">
                  <span>Rating: {formatMetricValue(item.rating)}</span>
                  <span>Views: {formatMetricValue(item.views)}</span>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {[
                  { label: 'Reviews', value: item.reviews, color: CHART_COLORS.primary },
                  { label: 'Favourites', value: item.favourites, color: CHART_COLORS.secondary },
                  { label: 'Views', value: item.views ?? 0, color: CHART_COLORS.accent },
                ].map(metric => (
                  <div key={`${item.id}-${metric.label}`}>
                    <div className="mb-1 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.16em] text-neo-text-secondary">
                      <span>{metric.label}</span>
                      <span>{formatMetricValue(metric.value)}</span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-white">
                      <div
                        className="h-full rounded-full transition-[width] duration-700 ease-out motion-reduce:transition-none"
                        style={{
                          width: `${Math.max((metric.value / engagementMax) * 100, metric.value > 0 ? 12 : 0)}%`,
                          backgroundColor: metric.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </DashboardChartCard>
  );
}

export const dashboardChartPalette = CHART_COLORS;
