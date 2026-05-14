import Link from 'next/link';
import styles from './page.module.css';

export default function HeadlessPage() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Headless Layer</h1>
      <p className={styles.subtitle}>
        Next.js app served alongside Drupal · data from JSON:API · rendered in your browser.
      </p>
      <div className={styles.grid}>
        <Link href="/constellation" className={styles.card}>
          <h2 className={styles.cardTitle}>Tech Constellation</h2>
          <p className={styles.cardDesc}>
            Interactive D3.js force-directed graph visualising the relationships between
            technologies across projects and skills. Click a node to explore.
          </p>
        </Link>
        <Link href="/search" className={styles.card}>
          <h2 className={styles.cardTitle}>Ask My Portfolio</h2>
          <p className={styles.cardDesc}>
            Natural language search powered by AI embeddings computed entirely in your browser.
            No API calls. No server. No cost.
          </p>
        </Link>
      </div>
    </div>
  );
}
