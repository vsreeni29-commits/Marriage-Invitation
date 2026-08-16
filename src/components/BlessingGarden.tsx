import { useEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent } from 'react';
import { blessingService, type Blessing } from '../services';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { seeded } from '../utils/geometry';
import { Section } from './ui/Section';
import { Jasmine } from './ornaments/Ornaments';

const MAX_BLOOMS = 44;
const MAX_LENGTH = 400;

/** Deterministic placement, so the garden looks the same on every visit. */
function bloomStyle(index: number): CSSProperties {
  const random = seeded(index * 977 + 13);
  const left = 4 + random() * 92;
  const top = 8 + random() * 78;
  const size = 15 + random() * 16;
  const delay = random() * 6;
  return {
    left: `${left.toFixed(2)}%`,
    top: `${top.toFixed(2)}%`,
    '--bloom-size': `${size.toFixed(1)}px`,
    animationDelay: `${delay.toFixed(2)}s`,
  } as CSSProperties;
}

const formatDate = (iso: string) => {
  try {
    return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' }).format(
      new Date(iso),
    );
  } catch {
    return '';
  }
};

/**
 * The Blessing Garden.
 *
 * Every message a guest leaves becomes a jasmine bloom in a shared garden —
 * a symbol that belongs to neither tradition exclusively, and to the whole
 * evening equally. The words themselves are listed underneath, because a
 * blessing you can't read isn't much of a blessing.
 */
export function BlessingGarden() {
  const reducedMotion = useReducedMotion();
  const [blessings, setBlessings] = useState<Blessing[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [honeypot, setHoneypot] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [loadFailed, setLoadFailed] = useState(false);
  const messageRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    let active = true;
    blessingService
      .list()
      .then((items) => {
        if (active) setBlessings(items);
      })
      .catch(() => {
        if (active) setLoadFailed(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const ordered = useMemo(
    () => [...blessings].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [blessings],
  );

  const onSubmit = async (submitEvent: FormEvent<HTMLFormElement>) => {
    submitEvent.preventDefault();
    const trimmed = message.trim();

    if (!trimmed) {
      setError('Please write a few words before sending.');
      messageRef.current?.focus();
      return;
    }

    setError(null);
    setStatus('sending');

    try {
      const saved = await blessingService.add({ name, message: trimmed, honeypot });
      setBlessings((current) => [...current, saved]);
      setName('');
      setMessage('');
      setStatus('sent');
    } catch (submitError) {
      setStatus('idle');
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Something went wrong. Please try again.',
      );
    }
  };

  return (
    <Section
      id="blessings"
      eyebrow="The blessing garden"
      title="Leave Us a Little Love"
      lead="A wish, a memory, a piece of advice — leave something here for us to carry into this new chapter. Every message becomes a jasmine in the garden below."
    >
      <div className="garden">
        <div
          className={`garden__field ${reducedMotion ? 'garden__field--still' : ''}`}
          aria-hidden="true"
        >
          <div className="garden__horizon" />
          {ordered.slice(0, MAX_BLOOMS).map((blessing, index) => (
            <span key={blessing.id} className="garden__bloom" style={bloomStyle(index)}>
              <Jasmine size={22} />
            </span>
          ))}
          {!loading && ordered.length === 0 && (
            <p className="garden__empty">The garden is waiting for its first bloom.</p>
          )}
        </div>

        <form className="garden__form card" onSubmit={onSubmit} noValidate>
          {/* Bait for bots. Hidden from sight, from screen readers and from tab order. */}
          <div className="honeypot" aria-hidden="true">
            <label htmlFor="blessing-website">Leave this empty</label>
            <input
              id="blessing-website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={honeypot}
              onChange={(changeEvent) => setHoneypot(changeEvent.target.value)}
            />
          </div>

          <div className="field">
            <label className="field__label" htmlFor="blessing-name">
              Your name <span className="field__optional">(optional)</span>
            </label>
            <input
              id="blessing-name"
              className="field__control"
              type="text"
              autoComplete="name"
              maxLength={60}
              value={name}
              onChange={(changeEvent) => setName(changeEvent.target.value)}
              placeholder="Who is this from?"
            />
          </div>

          <div className="field">
            <label className="field__label" htmlFor="blessing-message">
              Your message
            </label>
            <textarea
              id="blessing-message"
              ref={messageRef}
              className="field__control"
              maxLength={MAX_LENGTH}
              value={message}
              onChange={(changeEvent) => {
                setMessage(changeEvent.target.value);
                if (error) setError(null);
              }}
              placeholder="Write your message…"
              aria-invalid={error ? 'true' : undefined}
              aria-describedby={error ? 'blessing-error' : 'blessing-count'}
              required
            />
            <p className="field__count" id="blessing-count">
              {MAX_LENGTH - message.length} characters left
            </p>
            {error && (
              <p className="field__error" id="blessing-error">
                {error}
              </p>
            )}
          </div>

          <button type="submit" className="btn btn--gold btn--block" disabled={status === 'sending'}>
            {status === 'sending' ? 'Sending…' : 'Send Your Blessing'}
          </button>

          <p className="form-status" role="status">
            {status === 'sent' && 'Thank you — your blessing is in the garden.'}
          </p>
        </form>
      </div>

      <div className="garden__wall">
        <h3 className="garden__wall-title">
          {ordered.length > 0
            ? `${ordered.length} ${ordered.length === 1 ? 'blessing' : 'blessings'} so far`
            : 'Blessings'}
        </h3>

        {loadFailed && (
          <p className="form-status">
            We couldn’t load earlier messages just now — yours will still send.
          </p>
        )}

        <ul className="garden__list">
          {ordered.slice(0, 24).map((blessing) => (
            <li className="garden__note" key={blessing.id}>
              <p className="garden__note-text">{blessing.message}</p>
              <p className="garden__note-meta">
                <span>{blessing.name}</span>
                <span aria-hidden="true">·</span>
                <span>{formatDate(blessing.createdAt)}</span>
              </p>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}
