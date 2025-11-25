'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
// ✅ استيراد جميع أدوات Firestore اللازمة هنا
import { db } from '@/lib/firebase';
import { collection, getDocs, getDoc, setDoc, deleteDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';
import {
    Trash2, UserPlus, Shield, ShieldAlert, GraduationCap, Loader2,
    Search, Edit, X, Save
} from 'lucide-react';

export default function UsersClient() {
    const { user: currentUser } = useAuth();

    const [usersList, setUsersList] = useState([]);
    const [filteredList, setFilteredList] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [majors, setMajors] = useState([]); // State for majors

    // --- 1. جلب البيانات ---
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const usersSnap = await getDocs(collection(db, 'users'));
            const usersData = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            const adminsSnap = await getDocs(collection(db, 'admins'));
            const adminsMap = {};
            adminsSnap.docs.forEach(doc => { adminsMap[doc.id] = doc.data().role; });

            // Fetch Majors
            const majorsSnap = await getDocs(collection(db, 'majors'));
            const majorsData = majorsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setMajors(majorsData);

            const mergedList = usersData.map(user => ({
                ...user,
                role: adminsMap[user.email] || user.role || 'student',
                joinedAt: user.createdAt?.toDate ? user.createdAt.toDate().toLocaleDateString('ar-EG') : 'غير معروف'
            }));

            setUsersList(mergedList);
            setFilteredList(mergedList);
        } catch (error) {
            console.error("Error fetching users:", error);
            // تجاهل خطأ الصلاحيات عند التحميل الأول لتجنب الإزعاج، ستظهر البيانات فارغة
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        const lowerQuery = searchQuery.toLowerCase();
        const results = usersList.filter(user =>
            user.email.toLowerCase().includes(lowerQuery) ||
            (user.name && user.name.toLowerCase().includes(lowerQuery))
        );
        setFilteredList(results);
    }, [searchQuery, usersList]);

    const openModal = (user = null) => {
        setEditingUser(user ? { ...user } : { email: '', name: '', role: 'student', major: '' });
        setIsModalOpen(true);
    };

    // --- 2. دالة الحفظ (Client Side Logic) ---
    const handleSave = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        const formData = new FormData(e.target);
        const email = formData.get('email');
        const name = formData.get('name');
        const role = formData.get('role');
        const major = formData.get('major');

        try {
            // 1. تحديث القائمة البيضاء (Admins)
            const adminRef = doc(db, 'admins', email);
            if (role === 'admin' || role === 'editor') {
                await setDoc(adminRef, { email, role });
            } else {
                // إذا كان المستند غير موجود، deleteDoc لن يسبب خطأ
                await deleteDoc(adminRef);
            }

            // 2. تحديث ملف المستخدم (Users)
            const userRef = doc(db, 'users', email);
            const userSnap = await getDoc(userRef);

            const userData = {
                email,
                role,
                ...(name && { name }),
                major: major || null, // Update major
                updatedAt: serverTimestamp()
            };

            if (userSnap.exists()) {
                await updateDoc(userRef, userData);
            } else {
                await setDoc(userRef, {
                    ...userData,
                    createdAt: serverTimestamp(),
                    photoURL: null,
                    favorites: []
                });
            }

            toast.success('تم حفظ البيانات بنجاح');
            setIsModalOpen(false);
            fetchData(); // تحديث القائمة

        } catch (error) {
            console.error("Error saving user:", error);
            if (error.code === 'permission-denied') {
                toast.error("خطأ: ليس لديك صلاحية الأدمن للقيام بذلك.");
            } else {
                toast.error("حدث خطأ أثناء الحفظ.");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- 3. دالة الحذف (Client Side Logic) ---
    const handleDelete = async (targetEmail) => {
        if (currentUser?.email === targetEmail) {
            toast.error("لا يمكنك حذف نفسك!");
            return;
        }
        if (!confirm('تحذير: سيتم حذف الحساب بالكامل. هل أنت متأكد؟')) return;

        try {
            await deleteDoc(doc(db, 'admins', targetEmail));
            await deleteDoc(doc(db, 'users', targetEmail));

            toast.success('تم حذف المستخدم');
            fetchData();
        } catch (error) {
            console.error("Error deleting user:", error);
            toast.error("فشل الحذف: تأكد من الصلاحيات.");
        }
    };

    const getRoleBadge = (role) => {
        switch (role) {
            case 'admin': return <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-red-500/10 text-red-500 text-xs font-bold"><ShieldAlert size={12} /> مدير</span>;
            case 'editor': return <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-blue-500/10 text-blue-500 text-xs font-bold"><Shield size={12} /> مشرف</span>;
            default: return <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-green-500/10 text-green-500 text-xs font-bold"><GraduationCap size={12} /> طالب</span>;
        }
    };

    if (loading) return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-primary-blue" size={32} /></div>;

    return (
        <div className="space-y-6">
            {/* Header Controls */}
            <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                    <input
                        type="text"
                        placeholder="بحث بالاسم أو الإيميل..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-dark border border-border-color focus:border-primary-blue outline-none text-sm"
                    />
                    <Search className="absolute left-3 top-3 text-text-secondary" size={16} />
                </div>
                <button
                    onClick={() => openModal()}
                    className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-primary-blue text-white font-bold hover:bg-primary-blue/90 transition-colors shadow-lg shadow-primary-blue/20"
                >
                    <UserPlus size={18} />
                    <span>إضافة مستخدم</span>
                </button>
            </div>

            {/* Table */}
            <div className="bg-surface-dark border border-border-color rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-right text-sm">
                    <thead className="bg-black/20 text-text-secondary border-b border-border-color">
                        <tr>
                            <th className="p-4 font-medium">المستخدم</th>
                            <th className="p-4 font-medium">التخصص</th>
                            <th className="p-4 font-medium">الرتبة</th>
                            <th className="p-4 font-medium">تاريخ الانضمام</th>
                            <th className="p-4 font-medium text-left">إجراءات</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border-color">
                        {filteredList.map((user) => (
                            <tr key={user.id} className="hover:bg-white/5 transition group">
                                <td className="p-4">
                                    <div className="font-bold text-text-primary">{user.name || 'بدون اسم'}</div>
                                    <div className="text-xs text-text-secondary font-mono">{user.email}</div>
                                </td>
                                <td className="p-4">
                                    {user.major ? <span className="px-2 py-1 bg-background-dark rounded text-xs">{user.major}</span> : <span className="text-text-secondary text-xs">-</span>}
                                </td>
                                <td className="p-4">
                                    {getRoleBadge(user.role)}
                                </td>
                                <td className="p-4 text-text-secondary text-xs font-mono">
                                    {user.joinedAt}
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center justify-end gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => openModal(user)} className="p-2 rounded-lg text-text-secondary hover:text-primary-blue hover:bg-primary-blue/10 transition" title="تعديل">
                                            <Edit size={16} />
                                        </button>
                                        <button onClick={() => handleDelete(user.email)} className="p-2 rounded-lg text-text-secondary hover:text-red-500 hover:bg-red-500/10 transition" title="حذف">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filteredList.length === 0 && (
                            <tr><td colSpan="5" className="p-12 text-center text-text-secondary">لا توجد نتائج مطابقة.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-surface-dark border border-border-color rounded-2xl w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center p-6 border-b border-border-color">
                            <h3 className="text-xl font-bold">{editingUser.email ? 'تعديل بيانات المستخدم' : 'إضافة مستخدم جديد'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-text-secondary hover:text-red-400"><X size={24} /></button>
                        </div>

                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            <input type="hidden" name="email" value={editingUser.email} />

                            <div>
                                <label className="block text-xs font-bold text-text-secondary mb-1">البريد الإلكتروني</label>
                                <input
                                    name="email"
                                    type="email"
                                    defaultValue={editingUser.email}
                                    readOnly={!!editingUser.email}
                                    placeholder="user@example.com"
                                    className={`w-full rounded-lg border border-border-color p-3 text-sm outline-none ${editingUser.email ? 'bg-black/20 text-text-secondary cursor-not-allowed' : 'bg-background-dark focus:border-primary-blue'}`}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-text-secondary mb-1">التخصص</label>
                                <select
                                    name="major"
                                    defaultValue={editingUser.major || ''}
                                    className="w-full rounded-lg bg-background-dark border border-border-color p-3 text-sm outline-none focus:border-primary-blue"
                                >
                                    <option value="">اختر التخصص...</option>
                                    {majors.map((m) => (
                                        <option key={m.id} value={m.name}>{m.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid grid-cols-3 gap-2">
                                    {['student', 'editor', 'admin'].map((role) => (
                                        <label key={role} className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${editingUser.role === role ? 'border-primary-blue bg-primary-blue/10 text-primary-blue' : 'border-border-color hover:border-primary-blue/50'}`}>
                                            <input
                                                type="radio"
                                                name="role"
                                                value={role}
                                                defaultChecked={editingUser.role === role}
                                                onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                                                className="hidden"
                                            />
                                            {role === 'admin' && <ShieldAlert size={20} />}
                                            {role === 'editor' && <Shield size={20} />}
                                            {role === 'student' && <GraduationCap size={20} />}
                                            <span className="text-xs font-bold uppercase">{role}</span>
                                        </label>
                                    ))}
                                </div>
                                <p className="text-[10px] text-text-secondary mt-2 text-center">
                                    {editingUser.role === 'admin' && 'صلاحيات كاملة + الوصول للوحة التحكم.'}
                                    {editingUser.role === 'editor' && 'تعديل المحتوى فقط + الوصول للوحة التحكم.'}
                                    {editingUser.role === 'student' && 'تصفح فقط (بدون لوحة تحكم).'}
                                </p>
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full flex items-center justify-center gap-2 bg-primary-blue text-white font-bold py-3 rounded-xl hover:bg-primary-blue/90 transition mt-4 disabled:opacity-50"
                            >
                                {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <><Save size={20} /> حفظ التغييرات</>}
                            </button>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}