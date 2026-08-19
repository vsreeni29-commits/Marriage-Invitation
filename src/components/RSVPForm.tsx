import { useEffect, useRef, useState, type FormEvent } from 'react';
import { rsvpService, type Rsvp } from '../services';
import { weddingConfig } from '../config/weddingConfig';
import { Section } from './ui/Section';
import { Modal } from './ui/Modal';
import { Emblem, WaxSeal } from './ornaments/Ornaments';

const MIN_GUESTS = 1;
const MAX_GUESTS = 5;

type Attendance = 'yes' | 'no' | null;

/**
 * RSVP.
 *
 * The answer is sealed behind a wax stamp: press it and the form opens over the
 * page, so the invitation itself stays an invitation rather than a form to fill
 * in. Two answers, both graceful. Validation happens on submit and speaks like
 * a person; the guest counter cannot be pushed out of range by buttons, typing
 * or a pasted value; and a response already sent from this device is remembered
 * so nobody wonders whether it went through.
 */
export function RSVPForm() {
  const { couple } = weddingConfig;
  const [confirmed, setConfirmed] = useState<Rsvp | null>(null);
  const [open, setOpen] = useState(false);
  const successRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    rsvpService
      .mine()
      .then((existing) => {
        if (active && existing) setConfirmed(existing);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (confirmed) successRef.current?.focus();
  }, [confirmed]);

  if (confirmed) {
    return (
      <Section id="rsvp" eyebrow="Your answer" tinted>
        <div className="rsvp__success card card--arch" ref={successRef} tabIndex={-1} role="status">
          <Emblem className="rsvp__success-emblem" />
          {confirmed.attending ? (
            <>
              <h2 className="rsvp__success-title">
                You’re on the list <span aria-hidden="true">♡</span>
              </h2>
              <p className="rsvp__success-body">
                We can’t wait to celebrate with you
                {confirmed.guests > 1 ? `, all ${confirmed.guests} of you` : ''}.
              </p>
            </>
          ) : (
            <>
              <h2 className="rsvp__success-title">We’ll miss you</h2>
              <p className="rsvp__success-body">
                But we’re glad you’re part of our story — and we’ll raise a glass to you in
                Chennai.
              </p>
            </>
          )}

          {confirmed.pending && (
            <p className="rsvp__success-meta">
              We couldn’t reach our guest book just now, so your answer is safe on this
              device and will be sent the next time you open this page. Nothing more to do.
            </p>
          )}

          <p className="rsvp__success-meta">
            Recorded for {confirmed.name}. Something changed?{' '}
            <button type="button" className="btn btn--quiet" onClick={() => setConfirmed(null)}>
              Send another response
            </button>
          </p>
        </div>
      </Section>
    );
  }

  return (
    <Section
      id="rsvp"
      eyebrow="RSVP"
      title="Will You Celebrate With Us?"
      lead="A quick word helps us plan the evening — and know how many chairs to keep warm."
      tinted
      torn
    >
      <div className="rsvp__invite">
        <button
          type="button"
          className="rsvp__seal"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
        >
          <WaxSeal label="RSVP" variant="word" />
          <span className="rsvp__seal-hint">
            <span className="rsvp__seal-chevron" aria-hidden="true" />
            Press the seal to answer
          </span>
        </button>

        <p className="rsvp__foot">
          {couple.bride} &amp; {couple.groom} — {weddingConfig.venue.city}
        </p>
      </div>

      {open && (
        <Modal title="Will you celebrate with us?" onClose={() => setOpen(false)} className="rsvp__modal">
          <RsvpFields
            onDone={(saved) => {
              setOpen(false);
              setConfirmed(saved);
            }}
          />
        </Modal>
      )}
    </Section>
  );
}

interface RsvpFieldsProps {
  onDone: (saved: Rsvp) => void;
}

/** The form itself. Lives inside the dialog, and knows nothing about it. */
function RsvpFields({ onDone }: RsvpFieldsProps) {
  const [attending, setAttending] = useState<Attendance>(null);
  const [name, setName] = useState('');
  const [guests, setGuests] = useState(MIN_GUESTS);
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<{ name?: string; attending?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const nameRef = useRef<HTMLInputElement>(null);
  const trapRef = useRef<HTMLInputElement>(null);

  const setGuestCount = (next: number) => {
    if (Number.isNaN(next)) return;
    setGuests(Math.min(MAX_GUESTS, Math.max(MIN_GUESTS, Math.round(next))));
  };

  const onSubmit = async (submitEvent: FormEvent<HTMLFormElement>) => {
    submitEvent.preventDefault();

    const nextErrors: typeof errors = {};
    if (attending === null) nextErrors.attending = 'Please let us know if you can make it.';
    if (!name.trim()) nextErrors.name = 'Please tell us your name.';

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      if (nextErrors.name) nameRef.current?.focus();
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const saved = await rsvpService.submit({
        name,
        attending: attending === 'yes',
        guests: attending === 'yes' ? guests : 0,
        note,
        honeypot: trapRef.current?.value ?? '',
      });
      onDone(saved);
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : 'We couldn’t send that just now. Please try again in a moment.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="rsvp" onSubmit={onSubmit} noValidate>
      {/* Bait for bots. Hidden from sight, from screen readers and from tab
          order — and, deliberately, nameless. A field called "website" is one a
          password manager will happily fill in for a guest, which trips the trap
          on a real person and quietly loses their RSVP; there is nothing here
          for autofill to recognise, and it is read-only so it cannot offer to
          try. Read through a ref, because a bot that assigns to `.value` never
          fires the event a controlled input listens for. */}
      <div className="honeypot" aria-hidden="true">
        <label htmlFor="rsvp-extra">Leave this empty</label>
        <input
          id="rsvp-extra"
          ref={trapRef}
          type="text"
          tabIndex={-1}
          readOnly
          autoComplete="off"
          defaultValue=""
        />
      </div>

      <fieldset className="rsvp__choice">
        <legend className="field__label">Will you be joining us?</legend>

        <div className="rsvp__options">
          <label className={`rsvp__option ${attending === 'yes' ? 'is-selected' : ''}`}>
            <input
              type="radio"
              name="attending"
              value="yes"
              checked={attending === 'yes'}
              onChange={() => {
                setAttending('yes');
                setErrors((current) => ({ ...current, attending: undefined }));
              }}
            />
            <span>
              Yes, wouldn’t miss it <span aria-hidden="true">♡</span>
            </span>
          </label>

          <label className={`rsvp__option ${attending === 'no' ? 'is-selected' : ''}`}>
            <input
              type="radio"
              name="attending"
              value="no"
              checked={attending === 'no'}
              onChange={() => {
                setAttending('no');
                setErrors((current) => ({ ...current, attending: undefined }));
              }}
            />
            <span>Sorry, I can’t make it</span>
          </label>
        </div>

        {errors.attending && <p className="field__error">{errors.attending}</p>}
      </fieldset>

      <div className="field">
        <label className="field__label" htmlFor="rsvp-name">
          Guest name
        </label>
        <input
          id="rsvp-name"
          ref={nameRef}
          className="field__control"
          type="text"
          autoComplete="name"
          maxLength={70}
          value={name}
          onChange={(changeEvent) => {
            setName(changeEvent.target.value);
            if (errors.name) setErrors((current) => ({ ...current, name: undefined }));
          }}
          placeholder="Your name"
          aria-invalid={errors.name ? 'true' : undefined}
          aria-describedby={errors.name ? 'rsvp-name-error' : undefined}
          required
        />
        {errors.name && (
          <p className="field__error" id="rsvp-name-error">
            {errors.name}
          </p>
        )}
      </div>

      {attending === 'yes' && (
        <div className="field">
          <label className="field__label" htmlFor="rsvp-guests">
            How many of you are coming?
          </label>
          <div className="stepper">
            <button
              type="button"
              className="stepper__button"
              onClick={() => setGuestCount(guests - 1)}
              disabled={guests <= MIN_GUESTS}
              aria-label="One person fewer"
            >
              −
            </button>
            <input
              id="rsvp-guests"
              className="stepper__value"
              type="number"
              inputMode="numeric"
              min={MIN_GUESTS}
              max={MAX_GUESTS}
              value={guests}
              onChange={(changeEvent) => setGuestCount(Number(changeEvent.target.value))}
              onBlur={(blurEvent) => setGuestCount(Number(blurEvent.target.value) || MIN_GUESTS)}
            />
            <button
              type="button"
              className="stepper__button"
              onClick={() => setGuestCount(guests + 1)}
              disabled={guests >= MAX_GUESTS}
              aria-label="One person more"
            >
              +
            </button>
          </div>
          <p className="field__count">
            Including yourself — up to {MAX_GUESTS}. Coming with more? Send a second response.
          </p>
        </div>
      )}

      <div className="field">
        <label className="field__label" htmlFor="rsvp-note">
          Leave a note for us <span className="field__optional">(optional)</span>
        </label>
        <textarea
          id="rsvp-note"
          className="field__control"
          maxLength={300}
          value={note}
          onChange={(changeEvent) => setNote(changeEvent.target.value)}
          placeholder={
            attending === 'no'
              ? 'Anything you’d like us to know…'
              : 'Dietary notes, travel plans, anything at all…'
          }
        />
      </div>

      <button type="submit" className="btn btn--gold btn--block" disabled={submitting}>
        {submitting ? 'Sending…' : 'Send RSVP'}
      </button>

      <p className="form-status" role="status">
        {submitError ?? ''}
      </p>
    </form>
  );
}
