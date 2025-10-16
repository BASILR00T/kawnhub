export default function AdminDashboard() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">أهلاً بك في لوحة تحكم KawnHub</h1>
      <p className="text-text-secondary mb-8">من هنا تقدر تدير كل محتوى المنصة.</p>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surface-dark p-6 rounded-lg border border-border-color">
          <h2 className="text-lg font-bold text-text-secondary">عدد المواد</h2>
          <p className="text-4xl font-bold mt-2 text-primary-blue">0</p>
          <p className="text-xs text-text-secondary mt-1">(سيتم جلبها من قاعدة البيانات)</p>
        </div>
        <div className="bg-surface-dark p-6 rounded-lg border border-border-color">
          <h2 className="text-lg font-bold text-text-secondary">عدد الشروحات</h2>
          <p className="text-4xl font-bold mt-2 text-primary-purple">0</p>
          <p className="text-xs text-text-secondary mt-1">(سيتم جلبها من قاعدة البيانات)</p>
        </div>
      </div>
    </div>
  );
}