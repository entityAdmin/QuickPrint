import { useEffect, useState } from 'react';

/**
 * PaymentTimer
 * - Listens to a global `payment:success` CustomEvent on `window`.
 * - Starts a visible timer (elapsed time since success) when event received.
 * - UI-only component. Backend must emit the event after confirming payment.
 */
export default function PaymentTimer() {
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const onSuccess = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      const ts = detail?.timestamp || Date.now();
      setStartedAt(ts);
    };

    window.addEventListener('payment:success', onSuccess as EventListener);

    return () => window.removeEventListener('payment:success', onSuccess as EventListener);
  }, []);

  useEffect(() => {
    if (!startedAt) return;
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  if (!startedAt) return null;

  const hrs = Math.floor(elapsed / 3600);
  const mins = Math.floor((elapsed % 3600) / 60);
  const secs = elapsed % 60;

  return (
    <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-[#5B6B82]">Since last successful payment</div>
          <div className="text-lg font-medium text-[#0F1A2B]">{String(hrs).padStart(2,'0')}:{String(mins).padStart(2,'0')}:{String(secs).padStart(2,'0')}</div>
        </div>
        <div className="text-xs text-[#5B6B82]">Payment confirmed</div>
      </div>
    </div>
  );
}
