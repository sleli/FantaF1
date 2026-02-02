'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';

interface Event {
  id: string;
  name: string;
  type: 'RACE' | 'SPRINT';
  date: string;
  closingDate: string;
  status: string;
  countryFlag?: string | null;
  circuitImage?: string | null;
  circuitName?: string | null;
  _count?: {
    predictions: number;
  };
}

interface NextEventCardProps {
  event?: Event | null;
  isLoading?: boolean;
  userHasPrediction?: boolean;
}

interface CountdownTime {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

function useCountdown(targetDate: Date | null): CountdownTime {
  const [timeLeft, setTimeLeft] = useState<CountdownTime>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    total: 0,
  });

  useEffect(() => {
    if (!targetDate) return;

    const calculateTimeLeft = () => {
      const now = new Date();
      const diff = targetDate.getTime() - now.getTime();

      if (diff <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
      }

      return {
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
        total: diff,
      };
    };

    setTimeLeft(calculateTimeLeft());

    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  return timeLeft;
}

export default function NextEventCard({
  event,
  isLoading = false,
  userHasPrediction = false,
}: NextEventCardProps) {
  const closingDate = useMemo(
    () => (event ? new Date(event.closingDate) : null),
    [event]
  );

  const countdown = useCountdown(closingDate);

  // Determine countdown urgency
  const urgencyLevel = useMemo(() => {
    const hoursRemaining = countdown.total / (1000 * 60 * 60);
    if (hoursRemaining <= 1) return 'critical';
    if (hoursRemaining <= 6) return 'warning';
    if (hoursRemaining <= 24) return 'attention';
    return 'normal';
  }, [countdown.total]);

  // Colors based on urgency
  const urgencyStyles = {
    critical: {
      text: 'text-red-400',
      bg: 'bg-red-500/10',
      border: 'border-red-500/30',
      glow: 'shadow-[0_0_20px_rgba(239,68,68,0.3)]',
      pulse: true,
    },
    warning: {
      text: 'text-accent-amber',
      bg: 'bg-accent-amber/10',
      border: 'border-accent-amber/30',
      glow: 'shadow-[0_0_15px_rgba(245,158,11,0.2)]',
      pulse: false,
    },
    attention: {
      text: 'text-accent-cyan',
      bg: 'bg-accent-cyan/10',
      border: 'border-accent-cyan/30',
      glow: '',
      pulse: false,
    },
    normal: {
      text: 'text-accent-green',
      bg: 'bg-accent-green/10',
      border: 'border-accent-green/30',
      glow: '',
      pulse: false,
    },
  };

  const currentStyle = urgencyStyles[urgencyLevel];

  if (isLoading) {
    return (
      <Card isLoading className="min-h-[200px]" />
    );
  }

  if (!event) {
    return (
      <Card className="min-h-[200px]">
        <div className="flex flex-col items-center justify-center h-full py-8 text-center">
          <div className="text-4xl mb-4">🏁</div>
          <p className="text-lg font-medium text-foreground mb-2">
            Nessun evento in programma
          </p>
          <p className="text-sm text-muted-foreground">
            Torna più tardi per i prossimi eventi
          </p>
        </div>
      </Card>
    );
  }

  const isClosed = countdown.total <= 0;

  return (
    <Card
      variant="highlight"
      className={`
        overflow-hidden relative
        ${currentStyle.glow}
        ${currentStyle.pulse ? 'animate-pulse-urgent' : ''}
      `}
    >
      {/* Circuit image - decorative background */}
      {event.circuitImage ? (
        <img
          src={event.circuitImage}
          alt=""
          className="absolute right-2 top-2 w-24 h-24 md:right-4 md:top-4 md:w-32 md:h-32 object-contain opacity-10 pointer-events-none"
        />
      ) : (
        <div className="absolute top-0 right-0 w-24 h-24 opacity-10">
          <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-bl from-primary to-transparent transform rotate-45 translate-x-12 -translate-y-6" />
        </div>
      )}

      <div className="relative z-10">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Badge variant={event.type === 'RACE' ? 'race' : 'sprint'} size="lg">
                {event.type === 'RACE' ? 'Gara' : 'Sprint'}
              </Badge>
              {!isClosed && userHasPrediction && (
                <Badge variant="success" size="sm">
                  Pronostico inviato
                </Badge>
              )}
            </div>
            <h2 className="text-xl md:text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
              {event.countryFlag && (
                <img src={event.countryFlag} alt="" className="w-7 h-5 object-cover rounded-sm inline-block" />
              )}
              {event.name}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {new Date(event.date).toLocaleDateString('it-IT', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
        </div>

        {/* Countdown Section */}
        <div
          className={`
            rounded-xl p-4 mb-6
            ${currentStyle.bg} border ${currentStyle.border}
            transition-all duration-300
          `}
        >
          {isClosed ? (
            <div className="text-center py-2">
              <p className="text-lg font-bold text-red-400">
                Pronostici chiusi
              </p>
            </div>
          ) : (
            <>
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3 text-center">
                Tempo rimasto per pronosticare
              </p>
              <div className="flex justify-center gap-3 md:gap-4">
                <CountdownUnit
                  value={countdown.days}
                  label="Giorni"
                  textColor={currentStyle.text}
                />
                <CountdownSeparator />
                <CountdownUnit
                  value={countdown.hours}
                  label="Ore"
                  textColor={currentStyle.text}
                />
                <CountdownSeparator />
                <CountdownUnit
                  value={countdown.minutes}
                  label="Min"
                  textColor={currentStyle.text}
                />
                <CountdownSeparator />
                <CountdownUnit
                  value={countdown.seconds}
                  label="Sec"
                  textColor={currentStyle.text}
                  animate={urgencyLevel === 'critical'}
                />
              </div>
            </>
          )}
        </div>

        {/* CTA Section */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link href={`/predictions?event=${event.id}`} className="flex-1">
            <Button
              size="lg"
              variant={userHasPrediction ? 'secondary' : 'primary'}
              fullWidth
              disabled={isClosed}
              className={isClosed ? 'opacity-50' : ''}
            >
              {isClosed
                ? 'Pronostici chiusi'
                : userHasPrediction
                ? 'Modifica Pronostico'
                : 'Fai il tuo Pronostico'}
            </Button>
          </Link>

          {event._count?.predictions !== undefined && event._count.predictions > 0 && (
            <Link href={`/all-predictions?event=${event.id}`}>
              <Button variant="outline" size="lg">
                {event._count.predictions} Pronostici
              </Button>
            </Link>
          )}
        </div>
      </div>
    </Card>
  );
}

// Helper components
function CountdownUnit({
  value,
  label,
  textColor,
  animate = false,
}: {
  value: number;
  label: string;
  textColor: string;
  animate?: boolean;
}) {
  return (
    <div className="flex flex-col items-center min-w-[50px]">
      <span
        className={`
          text-2xl md:text-3xl font-black tabular-nums
          ${textColor}
          ${animate ? 'animate-countdown-pulse' : ''}
        `}
      >
        {String(value).padStart(2, '0')}
      </span>
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">
        {label}
      </span>
    </div>
  );
}

function CountdownSeparator() {
  return (
    <span className="text-xl md:text-2xl font-bold text-muted-foreground self-start mt-1">
      :
    </span>
  );
}
