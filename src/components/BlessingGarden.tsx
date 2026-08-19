import { useEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent } from 'react';
import { blessingService, type Blessing } from '../services';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { seeded } from '../utils/geometry';
import { Section } from './ui/Section';
import { CardCorners, GardenFlower } from './ornaments/Ornaments';

const MAX_BLOOMS = 40;
const MAX_LENGTH = 400;

/**
 * Where each flower is planted.
 *
 * The golden ratio spreads successive flowers across the bed instead of
 * clumping them the way plain randomness does, so the garden fills evenly
 * however many blessings arrive. Depth then does the rest: a flower planted
 * further back sits higher, stands smaller and pales into the haze.
 */
function plant(index: number): CSSProperties {
  const random = seeded(index * 977 + 13);
  const left = ((index * 0.61803398875 + random() * 0.06) % 1) * 92 + 4;
  const depth = random(); // 0 = front of the bed, 1 = back
  return {
    left: `${left.toFixed(2)}%`,
    bottom: `${(4 + depth * 38).toFixed(2)}%`,
    '--grow': `${(1.15 - depth * 0.5).toFixed(3)}`,
    '--haze': `${(1 - depth * 0.3).toFixed(3)}`,
    '--sway': `${(random() * 2 - 1).toFixed(2)}`,
    animationDelay: `${(index % 9) * 0.09}s`,
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
  // Painted from what this device already knows, on the very first render, so
  // the garden is in bloom before the network has said anything. The read below
  // then corrects it — usually adding whatever arrived since the last visit.
  const [blessings, setBlessings] = useState<Blessing[]>(() => blessingService.cached());
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [loadFailed, setLoadFailed] = useState(false);
  const [justPlanted, setJustPlanted] = useState<string | null>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);
  const trapRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    blessingService
      .list()
      .then((result) => {
        if (!active) return;
        setBlessings(result.blessings);
        setLoadFailed(result.degraded);
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
      const saved = await blessingService.add({
        name,
        message: trimmed,
        honeypot: trapRef.current?.value ?? '',
      });
      setBlessings((current) => [...current, saved]);
      // Tracked by message, not id: the re-read below replaces this guest's
      // copy with the sheet's, which carries a different id but the same words.
      setJustPlanted(saved.message);
      setName('');
      setMessage('');
      setStatus('sent');

      // Read the guest book back now that it holds one more message. It puts
      // everyone else's blessings on screen for a guest who has only just
      // arrived, and it proves the round trip actually reached the sheet.
      blessingService
        .list()
        .then((result) => {
          if (result.degraded) return;
          setBlessings((current) => {
            const seen = new Set(result.blessings.map((item) => item.message));
            return [...result.blessings, ...current.filter((item) => !seen.has(item.message))];
          });
          setLoadFailed(false);
        })
        .catch(() => {
          // The blessing is saved; a failed re-read is not the guest's problem.
        });
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
      lead="A wish, a memory, a piece of advice — leave something here for us to carry into this new chapter. Every message plants a flower in the garden below."
    >
      <div className="garden">
        <div
          className={`garden__field ${reducedMotion ? 'garden__field--still' : ''}`}
          aria-hidden="true"
        >
          <div className="garden__sky" />
          <div className="garden__soil" />

          {/* Planted before anyone arrives, so the bed is never bare earth. */}
          <span className="garden__grass" />

          {ordered.slice(0, MAX_BLOOMS).map((blessing, index) => (
            <span
              key={blessing.id}
              className={`garden__plant ${blessing.message === justPlanted ? 'is-new' : ''}`}
              style={plant(index)}
            >
              {/* Kinds 0 and 1 only: every blessing that has been sent is a
                  flower in full bloom, never a bud still waiting to open. */}
              <GardenFlower kind={(index + blessing.message.length) % 2} flip={index % 2 === 1} />
              {blessing.name && <span className="garden__tag">{blessing.name}</span>}
            </span>
          ))}

          {!loading && ordered.length === 0 && (
            <p className="garden__empty">
              Nothing has been planted yet.
              <span>The first flower is yours.</span>
            </p>
          )}
        </div>

        <form className="garden__form card" onSubmit={onSubmit} noValidate>
          <CardCorners />
          {/* Bait for bots. Hidden from sight, from screen readers and from tab
              order — and, deliberately, nameless. A field called "website" is
              one a password manager will happily fill in for a guest, which
              trips the trap on a real person; there is nothing here for autofill
              to recognise, and it is read-only so it cannot offer to try.
              Read through a ref, because a bot that assigns to `.value` never
              fires the event a controlled input listens for. */}
          <div className="honeypot" aria-hidden="true">
            <label htmlFor="blessing-extra">Leave this empty</label>
            <input
              id="blessing-extra"
              ref={trapRef}
              type="text"
              tabIndex={-1}
              readOnly
              autoComplete="off"
              defaultValue=""
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
            {status === 'sent' && 'Thank you — your flower is in the garden.'}
          </p>
        </form>
      </div>

      <div className="garden__wall">
        <h3 className="garden__wall-title">
          {ordered.length > 0
            ? `${ordered.length} ${ordered.length === 1 ? 'blessing' : 'blessings'} so far`
            : 'Blessings'}
        </h3>

        {loading && ordered.length === 0 && (
          <p className="form-status">Gathering everyone’s blessings…</p>
        )}

        {loadFailed && (
          <p className="form-status">
            We can’t reach the shared guest book just now, so these may not be all of
            them. Anything you send is kept safe and delivered.
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
