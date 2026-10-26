import '@/styles/globals.css';
import Banner from '@/components/Banner';
import Nav from '@/components/Nav';

export const metadata = {
  title: 'Tech Lab | Ricardo Contreras',
  description: 'Next.js headless layer — data served by Drupal JSON:API.',
};

export const viewport = {
  colorScheme: 'dark',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Banner />
        <Nav />
        <main>{children}</main>
      </body>
    </html>
  );
}
