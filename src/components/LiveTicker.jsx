import React, { useState, useEffect } from 'react';
import { Radio } from 'lucide-react';
import { makeTickerEvent, getOnlineCount } from '../utils/liveFeed';

/**
 * The stadium pulse: a rotating feed of (synthetic) fan activity plus a
 * believable online-now counter. Pinned to the bottom of the dashboard so
 * the app never feels empty, even on day one.
 */
const LiveTicker = () => {
  const [event, setEvent] = useState(() => makeTickerEvent());
  const [eventKey, setEventKey] = useState(0);
  const [online, setOnline] = useState(() => getOnlineCount());

  useEffect(() => {
    const rotate = setInterval(() => {
      setEvent(makeTickerEvent());
      setEventKey((k) => k + 1);
    }, 4200);
    const pulse = setInterval(() => {
      // drift a few fans in/out between the per-minute anchor points
      setOnline(getOnlineCount() + Math.floor(Math.random() * 14) - 7);
    }, 5000);
    return () => { clearInterval(rotate); clearInterval(pulse); };
  }, []);

  return (
    <div className="fixed bottom-0 inset-x-0 z-30 px-3 pb-3 pointer-events-none">
      <div className="max-w-md mx-auto glass-panel !rounded-xl px-3 py-2 flex items-center gap-3 pointer-events-auto">
        <div className="flex items-center gap-1.5 shrink-0 border-r border-white/10 pr-3">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
          </span>
          <Radio className="w-3.5 h-3.5 text-red-400" />
          <span className="text-[10px] font-black text-white tabular-nums whitespace-nowrap">
            {online.toLocaleString()} <span className="text-gray-400 font-bold">LIVE</span>
          </span>
        </div>
        <div className="overflow-hidden flex-grow h-5">
          <p key={eventKey} className="animate-ticker-in text-xs font-bold text-gray-200 truncate leading-5">
            {event}
          </p>
        </div>
      </div>
    </div>
  );
};

export default LiveTicker;
