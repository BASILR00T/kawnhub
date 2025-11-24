'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, deleteDoc, doc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import toast, { Toaster } from 'react-hot-toast';
import { Trash2, Plus, Star, User, Award } from 'lucide-react';

export default function SupportersPage() {
    const [supporters, setSupporters] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newName, setNewName] = useState('');
    const [newRole, setNewRole] = useState('');

    // جلب البيانات
    const fetchData = async () => {
        setIsLoading(true);
        try {
            const q = query(collection(db, 'supporters'), orderBy('createdAt', 'desc'));
            const snap = await getDocs(q);
            const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setSupporters(data);
        } catch (error) {
            console.error(error);
            toast.error('فشل جلب القائمة');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // إضافة داعم جديد
    const handleAdd = async (e) => {
        e.preventDefault();
        if (!newName.trim()) return;

        const toastId = toast.loading('جاري الإضافة...');
        try {
            await addDoc(collection(db, 'supporters'), {
                name: newName,
                role: newRole || 'داعم مميز',
                createdAt: serverTimestamp()
            });

            toast.success('تمت الإضافة بنجاح');
            setNewName('');
            setNewRole('');
            fetchData();
        } catch (error) {
            console.error(error);
            toast.error('فشل الإضافة');
        } finally {
            toast.dismiss(toastId);
        }
    };

    // حذف داعم
    const handleDelete = async (id) => {
        if (!confirm('هل أنت متأكد من الحذف؟')) return;

        const toastId = toast.loading('جاري الحذف...');
        try {
            await deleteDoc(doc(db, 'supporters', id));
            toast.success('تم الحذف');
            setSupporters(prev => prev.filter(s => s.id !== id));
        } catch (error) {
            console.error(error);
            toast.error('فشل الحذف');
        } finally {
            toast.dismiss(toastId);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <Toaster position="bottom-center" />

            <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-yellow-500/10 rounded-xl text-yellow-500">
                    <Award size={32} />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-text-primary">قائمة الشرف</h1>
                    <p className="text-text-secondary">إدارة قائمة الداعمين والمساهمين في المشروع.</p>
                </div>
            </div>

            {/* نموذج الإضافة */}
            <form onSubmit={handleAdd} className="bg-surface-dark border border-border-color rounded-2xl p-6 flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1 w-full">
                    <label className="block text-sm text-text-secondary mb-2">الاسم</label>
                    <div className="relative">
                        <User className="absolute right-3 top-3 text-text-secondary" size={18} />
                        <input
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder="اسم الداعم..."
                            className="w-full bg-background-dark border border-border-color rounded-xl py-2.5 pr-10 pl-4 focus:border-primary-blue outline-none transition-colors"
                            required
                        />
                    </div>
                </div>

                <div className="flex-1 w-full">
                    <label className="block text-sm text-text-secondary mb-2">الصفة / الدور</label>
                    <div className="relative">
                        <Star className="absolute right-3 top-3 text-text-secondary" size={18} />
                        <input
                            type="text"
                            value={newRole}
                            onChange={(e) => setNewRole(e.target.value)}
                            placeholder="مثال: مطور، مصمم، داعم..."
                            className="w-full bg-background-dark border border-border-color rounded-xl py-2.5 pr-10 pl-4 focus:border-primary-blue outline-none transition-colors"
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full md:w-auto bg-primary-blue text-white px-6 py-2.5 rounded-xl font-bold hover:bg-primary-blue/90 transition-colors flex items-center justify-center gap-2"
                >
                    <Plus size={20} />
                    إضافة
                </button>
            </form>

            {/* القائمة */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {supporters.map((supporter) => (
                    <div key={supporter.id} className="group flex items-center justify-between p-4 bg-surface-dark border border-border-color rounded-xl hover:border-primary-blue/50 transition-all">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-blue/20 to-purple-500/20 flex items-center justify-center text-primary-blue font-bold text-lg">
                                {supporter.name[0]}
                            </div>
                            <div>
                                <h3 className="font-bold text-text-primary">{supporter.name}</h3>
                                <p className="text-xs text-text-secondary">{supporter.role}</p>
                            </div>
                        </div>

                        <button
                            onClick={() => handleDelete(supporter.id)}
                            className="p-2 text-text-secondary hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                            title="حذف"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                ))}

                {!isLoading && supporters.length === 0 && (
                    <div className="col-span-2 text-center py-12 border border-dashed border-border-color rounded-2xl">
                        <p className="text-text-secondary">لا يوجد داعمين مضافين بعد.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
