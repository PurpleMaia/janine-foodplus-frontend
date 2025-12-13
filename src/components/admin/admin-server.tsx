'use server'
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getAdminDashboardData } from '@/services/actions/admin';
import { AdminDashboardClient } from './admin-dashboard';

export default async function AdminPage() {
  const session = await auth();
  
  if (!session?.user || session.user.role !== 'admin') {
    redirect('/');
  }

  const result = await getAdminDashboardData();
  
  if (!result.success) {
    return <div>Failed to load admin data</div>;
  }

  return (
    <AdminDashboardClient
      initialData={result.data}
      user={session.user}
    />
  );
}