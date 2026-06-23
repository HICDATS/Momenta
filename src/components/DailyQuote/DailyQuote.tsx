import styles from './DailyQuote.module.css';

interface DailyQuoteProps {
  quote: string;
}

const ARIA_LABEL = '每日励志名言';
const TESTID = 'daily-quote';

export function DailyQuote({ quote }: DailyQuoteProps): JSX.Element {
  return (
    <aside
      className={styles.card}
      aria-label={ARIA_LABEL}
      data-testid={TESTID}
    >
      <span className={styles.bar} aria-hidden="true" />
      <p className={styles.text}>{quote}</p>
    </aside>
  );
}
