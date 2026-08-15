import { useEffect, useState } from 'react';

export type CountdownPhase = 'before' | 'during' | 'after';

export interface CountdownState {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  phase: CountdownPhase;
}

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

function compute(start: Date, end: Date, now: number): CountdownState {
  const remaining = start.getTime() - now;

  if (remaining <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      phase: now <= end.getTime() ? 'during' : 'after',
    };
  }

  return {
    days: Math.floor(remaining / DAY),
    hours: Math.floor((remaining % DAY) / HOUR),
    minutes: Math.floor((remaining % HOUR) / MINUTE),
    seconds: Math.floor((remaining % MINUTE) / SECOND),
    phase: 'before',
  };
}

/**
 * Counts down to an absolute instant, so the result is identical whether the
 * guest opens the invitation in Chennai, Dubai or Toronto. Values never go
 * negative — the countdown hands over to the celebration message instead.
 */
export function useCountdown(start: Date, end: Date): CountdownState {
  const [state, setState] = useState<CountdownState>(() => compute(start, end, Date.now()));

  useEffect(() => {
    const tick = () => setState(compute(start, end, Date.now()));
    tick();
    const id = window.setInterval(tick, 1000);
    // Devices suspend timers when the tab sleeps; re-sync on wake.
    const onVisible = () => {
      if (!document.hidden) tick();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [start, end]);

  return state;
}
