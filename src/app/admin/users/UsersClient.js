'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { saveUser, deleteUser } from '@/app/actions/users';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { Trash2, UserPlus, Shield, ShieldAlert, GraduationCap, Loader2 } from 'lucide-react';

export default function UsersClient() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // دالة جلب المستخدمين في المتصفح (باستخدام صلاحياتك)
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, 'admins'));
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(data);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("فشل جلب المستخدمين: صلاحيات غير كافية");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleAdd = async (formData) => {
    setIsSubmitting(true);
    const result = await saveUser(formData);
    setIsSubmitting(false);

    if (result.success) {
      toast.success(result.message);
      document.getElementById('userForm').reset();
      fetchUsers();
    } else {
      toast.error(result.message);
    }
  };

  const handleDelete = async (targetEmail) => {
    if (currentUser?.email === targetEmail) {
        toast.error("عذراً، لا يمكنك حذف حسابك الحالي!");
        return;
    }
    if(!confirm('هل أنت متأكد من حذف هذا المستخدم؟ سيفقد صلاحيات الدخول.')) return;
    
    const oldUsers = [...users];
    setUsers(users.filter(u => u.email !== targetEmail));

    const result = await deleteUser(targetEmail);
    if (result.success) {
        toast.success(result.message);
    } else {
        setUsers(oldUsers);
        toast.error(result.message);
    }
  };

  const getRoleIcon = (role) => {
    switch(role) {
      case 'admin': return <ShieldAlert className="text-red-500" size={18} />;
      case 'editor': return <Shield className="text-blue-500" size={18} />;
      default: return <GraduationCap className="text-green-500" size={18} />;
    }
  };

  if (loading) {
      return (
          <div className="flex justify-center items-center h-64">
              <Loader2 className="animate-spin text-primary-blue" size={32} />
          </div>
      );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-1">
        <div className="bg-surface-dark border border-border-color rounded-xl p-6 sticky top-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-text-primary">
            <UserPlus size={20} /> إضافة مستخدم
          </h2>
          <form id="userForm" action={handleAdd} className="space-y-4">
            <div>
              <label className="block text-sm text-text-secondary mb-1">البريد الإلكتروني</label>
              <input name="email" type="email" required placeholder="user@gmail.com" className="w-full rounded-lg bg-background-dark border border-border-color p-3 text-text-primary focus:border-primary-blue outline-none" />
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-1">الصلاحية</label>
              <select name="role" className="w-full rounded-lg bg-background-dark border border-border-color p-3 text-text-primary focus:border-primary-blue outline-none">
                <option value="editor">مشرف محتوى (Editor)</option>
                <option value="admin">مدير كامل (Admin)</option>
                <option value="student">طالب (Student)</option>
              </select>
            </div>
            <button type="submit" disabled={isSubmitting} className="w-full bg-primary-blue text-white font-bold py-3 rounded-lg hover:bg-primary-blue/90 transition disabled:opacity-50">
              {isSubmitting ? 'جاري الحفظ...' : 'حفظ الصلاحيات'}
            </button>
          </form>
        </div>
      </div>
      <div className="lg:col-span-2">
        <div className="bg-surface-dark border border-border-color rounded-xl overflow-hidden">
          <table className="w-full text-right">
            <thead className="bg-black/20 text-text-secondary text-sm">
              <tr>
                <th className="p-4">المستخدم</th>
                <th className="p-4">الدور</th>
                <th className="p-4">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-color">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-white/5 transition">
                  <td className="p-4 font-mono text-sm text-text-primary">{user.email}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 text-text-secondary">
                      {getRoleIcon(user.role)}
                      <span className="capitalize">{user.role}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <button onClick={() => handleDelete(user.email)} className="text-red-400 hover:text-red-300 p-2 rounded-lg hover:bg-red-500/10 transition" title="حذف الصلاحية">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan="3" className="p-8 text-center text-text-secondary">لا يوجد مستخدمين مضافين بعد.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}