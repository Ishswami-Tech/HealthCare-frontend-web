"use client";

import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface ModernDashboardCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  iconColor?: string;
  borderColor?: string;
  trend?: {
    value: number;
    isPositive: boolean;
    label: string;
  };
  progress?: {
    value: number;
    max?: number;
    color?: string;
  };
  badge?: {
    text: string;
    variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  };
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'ghost';
  };
  className?: string;
  children?: React.ReactNode;
}

function ModernDashboardCardComponent({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = 'text-primary',
  borderColor = 'border-l-primary',
  trend,
  progress,
  badge,
  action,
  className,
  children,
}: ModernDashboardCardProps) {
  return (
    <Card className={cn(
      'group relative overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/5',
      borderColor,
      className
    )}>
      {/* Top subtle gradient bar */}
      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-primary/50 via-transparent to-transparent opacity-60 transition-opacity duration-300 group-hover:opacity-100" />

      {/* Corner glow */}
      <div className="pointer-events-none absolute -right-8 -top-8 size-20 rounded-full bg-primary/5 blur-2xl transition-opacity duration-300 group-hover:bg-primary/10" />

      <CardHeader className="flex flex-row items-center justify-between gap-x-2 pb-2">
        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </CardTitle>
        <div className="flex items-center gap-2">
          {badge && (
            <Badge variant={badge.variant || 'default'} className="text-[10px]">
              {badge.text}
            </Badge>
          )}
          {Icon && (
            <div className={cn(
              'rounded-lg bg-primary/8 p-1.5 ring-1 ring-primary/10 transition-all duration-300 group-hover:scale-110 group-hover:bg-primary/12',
              iconColor
            )}>
              <Icon className="size-4" />
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-y-3">
        <div className="flex items-end justify-between gap-2">
          <div className="text-2xl font-bold tracking-tight text-foreground">
            {value}
          </div>
          {trend && (
            <div className={cn(
              'inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold',
              trend.isPositive
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300'
            )}>
              <span>
                {trend.isPositive ? '↗' : '↘'}
              </span>
              {trend.value}% {trend.label}
            </div>
          )}
        </div>

        {subtitle && (
          <p className="text-xs text-muted-foreground">
            {subtitle}
          </p>
        )}

        {progress && (
          <div className="flex flex-col gap-y-1.5">
            <div className="flex justify-between text-[11px] font-medium">
              <span className="text-muted-foreground">Progress</span>
              <span className="text-foreground">{progress.value}%</span>
            </div>
            <Progress
              value={progress.value}
              max={progress.max || 100}
              className="h-2 rounded-full bg-muted"
            />
          </div>
        )}

        {children}

        {action && (
          <Button
            variant={action.variant || 'outline'}
            size="sm"
            onClick={action.onClick}
            className="w-full mt-2 transition-transform duration-300 hover:scale-[1.02]"
          >
            {action.label}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// Export memoized ModernDashboardCard for performance optimization
export const ModernDashboardCard = memo(ModernDashboardCardComponent);

// Specialized card variants
export function StatCard({
  title,
  value,
  subtitle,
  icon,
  iconColor,
  borderColor,
  trend,
  className,
}: Omit<ModernDashboardCardProps, 'children' | 'action' | 'progress' | 'badge'>) {
  return (
    <ModernDashboardCard
      title={title}
      value={value}
      {...(subtitle && { subtitle })}
      {...(icon && { icon })}
      {...(iconColor && { iconColor })}
      {...(borderColor && { borderColor })}
      {...(trend && { trend })}
      {...(className && { className })}
    />
  );
}

export function ProgressCard({
  title,
  value,
  subtitle,
  icon,
  iconColor,
  borderColor,
  progress,
  className,
}: Omit<ModernDashboardCardProps, 'children' | 'action' | 'trend' | 'badge'>) {
  return (
    <ModernDashboardCard
      title={title}
      value={value}
      {...(subtitle && { subtitle })}
      {...(icon && { icon })}
      {...(iconColor && { iconColor })}
      {...(borderColor && { borderColor })}
      {...(progress && { progress })}
      {...(className && { className })}
    />
  );
}

export function ActionCard({
  title,
  value,
  subtitle,
  icon,
  iconColor,
  borderColor,
  action,
  badge,
  className,
}: Omit<ModernDashboardCardProps, 'children' | 'progress' | 'trend'>) {
  return (
    <ModernDashboardCard
      title={title}
      value={value}
      {...(subtitle && { subtitle })}
      {...(icon && { icon })}
      {...(iconColor && { iconColor })}
      {...(borderColor && { borderColor })}
      {...(action && { action })}
      {...(badge && { badge })}
      {...(className && { className })}
    />
  );
}

// Quick stats grid component
interface QuickStatsProps {
  stats: Array<{
    title: string;
    value: string | number;
    subtitle?: string;
    icon?: LucideIcon;
    iconColor?: string;
    borderColor?: string;
    trend?: {
      value: number;
      isPositive: boolean;
      label: string;
    };
  }>;
  className?: string;
}

export function QuickStats({ stats, className }: QuickStatsProps) {
  return (
    <div className={cn(
      'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5',
      className
    )}>
      {stats.map((stat) => (
        <StatCard
          key={stat.title}
          title={stat.title}
          value={stat.value}
          {...(stat.subtitle && { subtitle: stat.subtitle })}
          {...(stat.icon && { icon: stat.icon })}
          {...(stat.iconColor && { iconColor: stat.iconColor })}
          {...(stat.borderColor && { borderColor: stat.borderColor })}
          {...(stat.trend && { trend: stat.trend })}
        />
      ))}
    </div>
  );
}

// Dashboard header card component
interface DashboardHeaderCardProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function DashboardHeaderCard({
  title,
  subtitle,
  actions,
  className
}: DashboardHeaderCardProps) {
  return (
    <div className={cn('flex items-center justify-between gap-4', className)}>
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-emerald-700 dark:text-emerald-300 sm:text-3xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-sm text-muted-foreground">
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex shrink-0 gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}
