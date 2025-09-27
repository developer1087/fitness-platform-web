import { AuthProvider } from '../hooks/useAuth';
import './globals.css';

export const metadata = {
  title: 'Fitness Platform',
  description: 'Your comprehensive fitness tracking platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}