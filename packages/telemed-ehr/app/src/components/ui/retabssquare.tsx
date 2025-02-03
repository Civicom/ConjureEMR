import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';

import { cn } from '@/lib/utils';

const ReTabsSquare = TabsPrimitive.Root;

interface ReTabsSquareListProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> {
  bgColor?: string;
}

const ReTabsSquareList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> & ReTabsSquareListProps
>(({ className, bgColor, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      `inline-flex h-10 items-center bg-muted justify-center rounded-md p-1 text-muted-foreground`,
      className,
    )}
    {...props}
  />
));
ReTabsSquareList.displayName = TabsPrimitive.List.displayName;

interface ReTabsSquareTriggerProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> {
  activeBgColor?: string;
  activeTextColor?: string;
}

const ReTabsSquareTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> & ReTabsSquareTriggerProps
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      `inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 
      data-[state=active]:shadow-sm
      data-[state=active]:bg-background 
      data-[state=active]:text-foreground`,
      className,
    )}
    {...props}
  />
));
ReTabsSquareTrigger.displayName = TabsPrimitive.Trigger.displayName;

const ReTabsSquareContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      'mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      className,
    )}
    {...props}
  />
));
ReTabsSquareContent.displayName = TabsPrimitive.Content.displayName;

export { ReTabsSquare, ReTabsSquareList, ReTabsSquareTrigger, ReTabsSquareContent };



