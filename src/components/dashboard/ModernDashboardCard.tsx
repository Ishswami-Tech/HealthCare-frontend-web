"use client";

import React from 'react';
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

export function ModernDashboardCard({
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
      'hover:shadow-lg transition-all duration-300 border-l-4',
      borderColor,
      className
    )}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="flex items-center gap-2">
          {badge && (
            <Badge variant={badge.variant || 'default'} className="text-xs">
              {badge.text}
            </Badge>
          )}
          {Icon && <Icon className={cn('h-4 w-4', iconColor)} />}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold">
            {value}
          </div>
          {trend && (
            <div className={cn(
              'flex items-center text-xs font-medium',
              trend.isPositive ? 'text-green-600' : 'text-red-600'
            )}>
              <span className="mr-1">
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
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span>Progress</span>
              <span>{progress.value}%</span>
            </div>
            <Progress 
              value={progress.value} 
              max={progress.max || 100}
              className="h-2"
            />
          </div>
        )}
        
        {children}
        
        {action && (
          <Button
            variant={action.variant || 'outline'}
            size="sm"
            onClick={action.onClick}
            className="w-full mt-3 hover:scale-105 transition-transform"
          >
            {action.label}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

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
      subtitle={subtitle}
      icon={icon}
      iconColor={iconColor}
      borderColor={borderColor}
      trend={trend}
      className={className}
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
      subtitle={subtitle}
      icon={icon}
      iconColor={iconColor}
      borderColor={borderColor}
      progress={progress}
      className={className}
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
      subtitle={subtitle}
      icon={icon}
      iconColor={iconColor}
      borderColor={borderColor}
      action={action}
      badge={badge}
      className={className}
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
      'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6',
      className
    )}>
      {stats.map((stat, index) => (
        <StatCard
          key={index}
          title={stat.title}
          value={stat.value}
          subtitle={stat.subtitle}
          icon={stat.icon}
          iconColor={stat.iconColor}
          borderColor={stat.borderColor}
          trend={stat.trend}
        />
      ))}
    </div>
  );
}

// Dashboard header component
interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function DashboardHeader({ 
  title, 
  subtitle, 
  actions, 
  className 
}: DashboardHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between', className)}>
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          {title}
        </h1>
        {subtitle && (
          <p className="text-muted-foreground mt-1">
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}
