import { useState } from 'react';
import { shareInvitation, type ShareResult } from '../utils/share';

const MESSAGES: Record<Exclude<ShareResult, 'shared' | 'dismissed'>, string> = {
  copied: 'Invitation link copied — paste it anywhere.',
  unavailable: 'Copy the link from your browser’s address bar to share it.',
};

interface ShareInvitationProps {
  className?: string;
  label?: string;
  variant?: 'ghost' | 'gold' | 'quiet';
}

/** Web Share where it exists, clipboard everywhere else, honest message if neither. */
export function ShareInvitation({
  className,
  label = 'Share Invitation',
  variant = 'ghost',
}: ShareInvitationProps) {
  const [status, setStatus] = useState<string>('');

  const onShare = async () => {
    const result = await shareInvitation();
    setStatus(result === 'shared' || result === 'dismissed' ? '' : MESSAGES[result]);
    if (result === 'copied') window.setTimeout(() => setStatus(''), 5000);
  };

  return (
    <div className={`share ${className ?? ''}`}>
      <button type="button" className={`btn btn--${variant}`} onClick={onShare}>
        {label} <span aria-hidden="true">↗</span>
      </button>
      <p className="form-status" role="status">
        {status}
      </p>
    </div>
  );
}
