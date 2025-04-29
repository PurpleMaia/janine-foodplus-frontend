import type {Metadata} from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { KanbanBoardProvider } from '@/hooks/use-kanban-board'; // Import the provider
import { Toaster } from "@/components/ui/toaster" // Import Toaster for potential notifications

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Legislation Tracker', // Updated title
  description: 'Track bills through the legislative process', // Updated description
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <KanbanBoardProvider> {/* Wrap children with the provider */}
          {children}
        </KanbanBoardProvider>
        <Toaster /> {/* Add toaster for notifications */}
      </body>
    </html>
  );
}
