import UsersClient from './UsersClient';

export const metadata = {
  title: 'إدارة المستخدمين - KawnHub Admin',
};

export default function UsersPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-text-primary">إدارة المستخدمين والصلاحيات</h1>
      </div>
      
      {/* استدعاء المكون التفاعلي فقط */}
      <UsersClient />
    </div>
  );
}