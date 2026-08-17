import { useCallback, useEffect, useRef, useState } from 'react';
import { MusicProvider, useMusic } from './context/MusicContext';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { InvitationEntry } from './components/InvitationEntry';
import { FloatingNav } from './components/FloatingNav';
import { Hero } from './components/Hero';
import { InvitationMessage } from './components/InvitationMessage';
import { WeddingStory } from './components/WeddingStory';
import { CulturalFusion } from './components/CulturalFusion';
import { DateScratchReveal } from './components/DateScratchReveal';
import { Countdown } from './components/Countdown';
import { ReceptionDetails } from './components/ReceptionDetails';
import { EventTimeline } from './components/EventTimeline';
import { GuestNotes } from './components/GuestNotes';
import { CulturalQuote } from './components/CulturalQuote';
import { OurSong } from './components/OurSong';
import { Venue } from './components/Venue';
import { BlessingGarden } from './components/BlessingGarden';
import { RSVPForm } from './components/RSVPForm';
import { ClosingMessage } from './components/ClosingMessage';
import { Footer } from './components/Footer';
import { JaaliBackdrop, SilkBorder } from './components/ornaments/Ornaments';

const ENTERED_KEY = 'rs:entered:v1';

function Invitation() {
  const { setPlaying } = useMusic();
  const shellRef = useRef<HTMLDivElement>(null);

  // Replay the opening once per session, not on every refresh or back-navigation.
  const [entered, setEntered] = useState(() => {
    try {
      return window.sessionStorage.getItem(ENTERED_KEY) === 'yes';
    } catch {
      return false;
    }
  });

  const onEnter = useCallback(
    (withMusic: boolean) => {
      setEntered(true);
      try {
        window.sessionStorage.setItem(ENTERED_KEY, 'yes');
      } catch {
        // Non-fatal: the opening will simply show again next time.
      }
      // The click is the gesture browsers require before audio may start.
      if (withMusic) setPlaying(true);
    },
    [setPlaying],
  );

  // While the opening is up, the page behind it is inert for pointer, keyboard
  // and screen-reader alike.
  useEffect(() => {
    const shell = shellRef.current;
    if (!shell) return;
    if (entered) {
      shell.removeAttribute('inert');
      shell.removeAttribute('aria-hidden');
    } else {
      shell.setAttribute('inert', '');
      shell.setAttribute('aria-hidden', 'true');
    }
  }, [entered]);

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to the invitation
      </a>

      {!entered && (
        <ErrorBoundary label="opening">
          <InvitationEntry onEnter={onEnter} />
        </ErrorBoundary>
      )}

      <div className={`shell-root ${entered ? 'is-entered' : ''}`} ref={shellRef}>
        <JaaliBackdrop />
        <SilkBorder className="page-edge page-edge--top" />

        <ErrorBoundary label="navigation">
          <FloatingNav />
        </ErrorBoundary>

        <Hero />

        <main id="main">
          <InvitationMessage />

          <ErrorBoundary label="story">
            <WeddingStory />
          </ErrorBoundary>

          <ErrorBoundary label="fusion">
            <CulturalFusion />
          </ErrorBoundary>

          <ErrorBoundary label="date">
            <DateScratchReveal />
          </ErrorBoundary>

          <ErrorBoundary label="countdown">
            <Countdown />
          </ErrorBoundary>

          <ReceptionDetails />

          <ErrorBoundary label="schedule">
            <EventTimeline />
          </ErrorBoundary>

          <ErrorBoundary label="quote">
            <CulturalQuote />
          </ErrorBoundary>

          <ErrorBoundary label="song">
            <OurSong />
          </ErrorBoundary>

          <Venue />

          <ErrorBoundary label="notes">
            <GuestNotes />
          </ErrorBoundary>

          <ErrorBoundary label="blessings">
            <BlessingGarden />
          </ErrorBoundary>

          <ErrorBoundary label="rsvp">
            <RSVPForm />
          </ErrorBoundary>

          <ErrorBoundary label="closing">
            <ClosingMessage />
          </ErrorBoundary>
        </main>

        <Footer />
        <SilkBorder className="page-edge page-edge--bottom" flip />
      </div>
    </>
  );
}

export default function App() {
  return (
    <MusicProvider>
      <Invitation />
    </MusicProvider>
  );
}
