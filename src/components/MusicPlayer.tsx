import { useMusic } from '../context/MusicContext';

/**
 * Persistent music toggle.
 *
 * Labelled for screen readers, `aria-pressed` for state, and it fades rather
 * than cuts. It never restarts the track — the controller lives above this
 * component, so toggling picks up where it left off.
 */
export function MusicPlayer() {
  const { isPlaying, toggle } = useMusic();

  return (
    <button
      type="button"
      className={`music-toggle ${isPlaying ? 'is-playing' : ''}`}
      onClick={toggle}
      aria-pressed={isPlaying}
      aria-label={isPlaying ? 'Turn background music off' : 'Turn background music on'}
      title={isPlaying ? 'Music on' : 'Music off'}
    >
      <span className="music-toggle__bars" aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
      <span className="music-toggle__text">{isPlaying ? 'Music On' : 'Music Off'}</span>
    </button>
  );
}
