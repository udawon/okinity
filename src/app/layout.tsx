import '@/app/globals.css';
import { Geist } from 'next/font/google';

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className="dark">
      <body className={`${geist.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
