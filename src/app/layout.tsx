import type {Metadata} from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { KanbanBoardProvider } from '@/contexts/kanban-board-context'; // Import the provider
import { Toaster } from "@/components/ui/toaster" // Import Toaster for potential notifications
import { BillsProvider } from '@/contexts/bills-context';
import { AuthProvider } from '@/contexts/auth-context';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/react-query';
import { Providers } from '@/lib/providers';



//Wraps entire app with authentication context 
//Makes auth state avalible to all components

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
    <html lang="en" suppressHydrationWarning={true}>
      {/* Add suppressHydrationWarning to body to ignore extension-injected attributes */}
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`} suppressHydrationWarning={true}>
        <Providers>
          {children}
        </Providers>
        <Toaster /> {/* Add toaster for notifications */}
      </body>
    </html>
  );
}
