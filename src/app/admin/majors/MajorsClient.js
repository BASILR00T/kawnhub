'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Plus, Trash2, Edit2, Save, X, GraduationCap, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function MajorsClient() {
    const [majors, setMajors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState(null);

    // Form States
    const [formData, setFormData] = useState({ name: '', code: '' });

    useEffect(() => {
        fetchMajors();
    }, []);

    const fetchMajors = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, 'majors'));
            const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setMajors(data);
        } catch (error) {
            console.error("Error fetching majors:", error);
            toast.error("فشل جلب التخصصات");
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!formData.name || !formData.code) return;

        try {
            const docRef = await addDoc(collection(db, 'majors'), {
                name: formData.name,
                code: formData.code.toUpperCase(),
                createdAt: serverTimestamp()
            });
            setMajors([...majors, { id: docRef.id, name: formData.name, code: formData.code.toUpperCase() }]);
            setFormData({ name: '', code: '' });
            setIsAdding(false);
            toast.success('تم إضافة التخصص بنجاح');
        } catch (error) {
            console.error("Error adding major:", error);
            toast.error("فشل إضافة التخصص");
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('هل أنت متأكد من حذف هذا التخصص؟')) return;
        try {
            await deleteDoc(doc(db, 'majors', id));
            setMajors(majors.filter(m => m.id !== id));
            toast.success('تم حذف التخصص');
        } catch (error) {
            console.error("Error deleting major:", error);
            toast.error("فشل حذف التخصص");
        }
    };

    const handleUpdate = async (id) => {
        try {
            await updateDoc(doc(db, 'majors', id), {
                name: formData.name,
                code: formData.code.toUpperCase()
            });
            setMajors(majors.map(m => m.id === id ? { ...m, name: formData.name, code: formData.code.toUpperCase() } : m));
            setEditingId(null);
            setFormData({ name: '', code: '' });
            toast.success('تم تحديث التخصص');
        } catch (error) {
            console.error("Error updating major:", error);
            toast.error("فشل تحديث التخصص");
        }
    };

    const startEdit = (major) => {
        setEditingId(major.id);
        setFormData({ name: major.name, code: major.code });
        setIsAdding(false);
    };

    if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-primary-blue" /></div>;

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold flex items-center gap-3 text-text-primary">
                    <GraduationCap className="text-primary-blue" />
                    إدارة التخصصات
                </h1>
                <button
                    onClick={() => { setIsAdding(!isAdding); setEditingId(null); setFormData({ name: '', code: '' }); }}
                    className="flex items-center gap-2 bg-primary-blue text-white px-4 py-2 rounded-lg hover:bg-primary-blue/90 transition-colors font-bold"
                >
                    {isAdding ? <X size={20} /> : <Plus size={20} />}
                    {isAdding ? 'إلغاء' : 'إضافة تخصص'}
                </button>
            </div>

            {/* Add/Edit Form */}
            {(isAdding || editingId) && (
                <form onSubmit={editingId ? (e) => { e.preventDefault(); handleUpdate(editingId); } : handleAdd} className="bg-surface-dark border border-border-color rounded-xl p-6 mb-8 animate-in fade-in slide-in-from-top-4">
                    <h3 className="font-bold text-lg mb-4 text-text-primary">{editingId ? 'تعديل تخصص' : 'إضافة تخصص جديد'}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-bold text-text-secondary mb-1">اسم التخصص (عربي)</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="مثال: علوم الحاسب"
                                className="w-full bg-background-dark border border-border-color rounded-lg p-3 text-white focus:border-primary-blue outline-none"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-text-secondary mb-1">رمز التخصص (Code)</label>
                            <input
                                type="text"
                                value={formData.code}
                                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                placeholder="مثال: CS"
                                className="w-full bg-background-dark border border-border-color rounded-lg p-3 text-white focus:border-primary-blue outline-none font-mono uppercase"
                                required
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => { setIsAdding(false); setEditingId(null); }} className="px-4 py-2 text-text-secondary hover:text-white transition-colors">إلغاء</button>
                        <button type="submit" className="flex items-center gap-2 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors font-bold">
                            <Save size={18} /> حفظ
                        </button>
                    </div>
                </form>
            )}

            {/* Majors List */}
            <div className="grid gap-4">
                {majors.length > 0 ? (
                    majors.map((major) => (
                        <div key={major.id} className="bg-surface-dark border border-border-color rounded-xl p-4 flex items-center justify-between group hover:border-primary-blue/30 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-primary-blue/10 flex items-center justify-center text-primary-blue font-bold text-lg">
                                    {major.code.substring(0, 2)}
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-text-primary">{major.name}</h3>
                                    <p className="text-sm text-text-secondary font-mono">{major.code}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => startEdit(major)} className="p-2 text-text-secondary hover:text-primary-blue hover:bg-primary-blue/10 rounded-lg transition-colors" title="تعديل">
                                    <Edit2 size={18} />
                                </button>
                                <button onClick={() => handleDelete(major.id)} className="p-2 text-text-secondary hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors" title="حذف">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-12 text-text-secondary">
                        <GraduationCap size={48} className="mx-auto mb-4 opacity-20" />
                        <p>لا توجد تخصصات مضافة بعد.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
