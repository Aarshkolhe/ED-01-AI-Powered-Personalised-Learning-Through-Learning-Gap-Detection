'use client';

import * as React from "react";
import { GlassCalendar } from "@/components/ui/glass-calendar";

export default function GlassCalendarDemo() {
  const [selectedDate, setSelectedDate] = React.useState(new Date());
  
  // High-quality dark abstract Unsplash image to highlight the glassmorphism backdrop blur
  const backgroundImageUrl = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1920&auto=format&fit=crop";

  return (
    <div 
      className="flex min-h-[480px] w-full items-center justify-center bg-cover bg-center p-6 rounded-3xl overflow-hidden relative"
      style={{ backgroundImage: `url(${backgroundImageUrl})` }}
    >
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm pointer-events-none" />
      <div className="relative z-10">
        <GlassCalendar 
          selectedDate={selectedDate}
          onDateSelect={setSelectedDate}
          className="transform transition-transform duration-500 hover:scale-[1.02]"
        />
      </div>
    </div>
  );
}
