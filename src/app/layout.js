import '@/styles/globals.css';
import Banner from '@/components/Banner';

export const metadata = {
  title: 'Headless Portfolio',
  description: 'Next.js headless layer — data served by Drupal JSON:API.',
  colorScheme: 'dark',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Banner />
        <main>{children}</main>
      </body>
    </html>
  );
}
