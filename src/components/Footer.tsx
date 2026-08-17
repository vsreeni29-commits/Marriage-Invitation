import { formattedEvent, weddingConfig } from '../config/weddingConfig';

export function Footer() {
  const { couple, venue, event } = weddingConfig;

  return (
    <footer className="footer">
      <div className="kasavu-rule" aria-hidden="true" />
      <div className="shell footer__inner">
        <p className="footer__couple script-name">
          {couple.bride} <span className="amp">&amp;</span> {couple.groom}
        </p>
        <p className="footer__detail">
          {event.name} <span aria-hidden="true">·</span>{' '}
          <time dateTime={event.date}>{formattedEvent.fullDate}</time>
        </p>
        <p className="footer__detail">
          <a href={venue.googleMapsUrl} target="_blank" rel="noopener noreferrer">
            {venue.name}
          </a>
          , {venue.city}
        </p>
        <p className="footer__meta">Made with love, for the people we love.</p>
      </div>
    </footer>
  );
}
