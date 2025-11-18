'use client'; 

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, getDocs, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import toast, { Toaster } from 'react-hot-toast';
import { revalidatePublicPages } from '@/app/actions/revalidation'; // ✅ 1. استيراد الأداة

const EditIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg> );
const DeleteIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg> );

export default function MaterialsPage() {
    const [materials, setMaterials] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter(); 

    const fetchMaterials = async () => {
        setIsLoading(true);
        const materialsCol = collection(db, 'materials');
        const q = query(materialsCol, orderBy('order', 'asc'));
        const materialsSnapshot = await getDocs(q);
        const materialsList = materialsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setMaterials(materialsList);
        setIsLoading(false);
    };

    useEffect(() => {
        fetchMaterials();
    }, []);

    const handleDelete = async (id, title) => {
        toast((t) => (
            <div className="flex flex-col gap-3 p-2">
                <p>هل أنت متأكد أنك تريد حذف <strong className="text-red-500">{title}</strong>؟</p>
                <div className="flex gap-2">
                    <button
                        className="w-full bg-red-500 text-white px-3 py-1 rounded text-sm"
                        onClick={async () => {
                            toast.dismiss(t.id);
                            const loadingToast = toast.loading('جاري الحذف...');
                            
                            try {
                                await deleteDoc(doc(db, 'materials', id));
                                
                                // ✅ 2. استدعاء أداة تحديث الكاش
                                await revalidatePublicPages(); 
                                
                                toast.dismiss(loadingToast);
                                toast.success('تم حذف المادة بنجاح');
                                fetchMaterials();
                            } catch (error) {
                                toast.dismiss(loadingToast);
                                toast.error(`فشل الحذف: ${error.message}`);
                            }
                        }}
                    >
                        نعم، احذف
                    </button>
                    <button
                        className="w-full bg-surface-dark border border-border-color px-3 py-1 rounded text-sm"
                        onClick={() => toast.dismiss(t.id)}
                    >
                        إلغاء
                    </button>
                </div>
            </div>
        ), { duration: 6000 });
    };

    if (isLoading) {
        return <p>جاري تحميل المواد...</p>;
    }

    return (
        <div>
            <Toaster position="bottom-center" />
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">إدارة المواد</h1>
                <Link href="/admin/materials/new" className="inline-flex items-center gap-2 rounded-md bg-primary-blue px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-primary-blue/90">
                    <span>إضافة مادة جديدة</span>
                </Link>
            </div>

            <div className="bg-surface-dark border border-border-color rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-border-color">
                    <thead className="bg-black/20">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">العنوان</th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">كود المادة</th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">التخصصات</th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">الترتيب</th>
                            <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border-color">
                        {materials.map((material) => (
                            <tr key={material.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-primary">{material.title}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary font-mono">{material.courseCode}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                                    <div className="flex gap-1 flex-wrap">
                                        {material.targetMajors?.map(major => (
                                            <span key={major} className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-xs font-bold">{major}</span>
                                        ))}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">{material.order}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <div className="flex items-center justify-end gap-4">
                                        <Link href={`/admin/materials/${material.id}`} className="text-text-secondary hover:text-primary-blue transition-colors">
                                            <EditIcon />
                                        </Link>
                                        <button onClick={() => handleDelete(material.id, material.title)} className="text-text-secondary hover:text-red-500 transition-colors">
                                            <DeleteIcon />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}