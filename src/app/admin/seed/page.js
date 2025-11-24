'use client';

import React, { useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, doc, setDoc, writeBatch, getDocs } from 'firebase/firestore';
import toast, { Toaster } from 'react-hot-toast';
import { Database, Upload, CheckCircle, AlertTriangle } from 'lucide-react';
import materialsData from '@/data/seed_materials.json';
import topicsData from '@/data/seed_topics.json';
import migratedTopics from '@/data/migrated_topics.json';

export default function SeedPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [log, setLog] = useState([]);

    const addLog = (msg) => setLog(prev => [...prev, msg]);

    const handleSeedMaterials = async () => {
        if (!confirm('هل أنت متأكد من استيراد المواد؟')) return;
        setIsLoading(true);
        setLog([]);
        addLog('📦 جاري استيراد المواد...');
        try {
            const batch = writeBatch(db);
            for (const material of materialsData) {
                const docRef = doc(db, 'materials', material.slug);
                batch.set(docRef, material);
            }
            await batch.commit();
            addLog(`✅ تم استيراد ${materialsData.length} مادة.`);
            toast.success('تم استيراد المواد بنجاح');
        } catch (error) {
            console.error(error);
            addLog(`❌ خطأ: ${error.message}`);
            toast.error('فشل استيراد المواد');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSeedTopics = async () => {
        if (!confirm('هل أنت متأكد من استيراد الدروس التجريبية؟')) return;
        setIsLoading(true);
        setLog([]);
        addLog('📝 جاري استيراد الدروس التجريبية...');
        try {
            const batch = writeBatch(db);
            for (const topic of topicsData) {
                const docRef = doc(collection(db, 'topics'));
                batch.set(docRef, {
                    ...topic,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
            }
            await batch.commit();
            addLog(`✅ تم استيراد ${topicsData.length} درس.`);
            toast.success('تم استيراد الدروس بنجاح');
        } catch (error) {
            console.error(error);
            addLog(`❌ خطأ: ${error.message}`);
            toast.error('فشل استيراد الدروس');
        } finally {
            setIsLoading(false);
        }
    };

    const handleMigrateV1 = async () => {
        if (!confirm('هل أنت متأكد من نقل محتوى V1؟ (تأكد من استيراد المواد أولاً)')) return;
        setIsLoading(true);
        setLog([]);
        addLog('🚀 بدء نقل محتوى V1...');

        try {
            let count = 0;
            let batch = writeBatch(db);
            const total = migratedTopics.length;

            for (let i = 0; i < total; i++) {
                const topic = migratedTopics[i];
                // Use the ID from migration (v1-...)
                const docRef = doc(db, 'topics', topic.id);

                batch.set(docRef, {
                    ...topic,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });

                count++;

                // Commit batch every 400 items
                if (count % 400 === 0) {
                    await batch.commit();
                    batch = writeBatch(db);
                    addLog(`... تم نقل ${count} درس`);
                }
            }

            if (count % 400 !== 0) {
                await batch.commit();
            }

            addLog(`🎉 تم نقل ${count} درس بنجاح!`);
            toast.success(`تم نقل ${count} درس من النسخة القديمة`);
        } catch (error) {
            console.error(error);
            addLog(`❌ خطأ أثناء النقل: ${error.message}`);
            toast.error('فشل نقل المحتوى');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteAll = async () => {
        if (!confirm('⚠️ تحذير خطير!\nهل أنت متأكد تماماً من حذف جميع المواد والشروحات؟\nلا يمكن التراجع عن هذا الإجراء!')) return;

        setIsLoading(true);
        setLog([]);
        addLog('🗑️ جاري حذف البيانات...');

        try {
            const batch = writeBatch(db);
            let count = 0;

            // 1. Delete Materials
            const materialsSnapshot = await getDocs(collection(db, 'materials'));
            materialsSnapshot.forEach((doc) => {
                batch.delete(doc.ref);
                count++;
            });

            // 2. Delete Topics
            const topicsSnapshot = await getDocs(collection(db, 'topics'));
            topicsSnapshot.forEach((doc) => {
                batch.delete(doc.ref);
                count++;
            });

            if (count > 0) {
                await batch.commit();
                addLog(`✅ تم حذف ${count} مستند (مواد وشروحات).`);
                toast.success('تم حذف جميع البيانات بنجاح');
            } else {
                addLog('ℹ️ قاعدة البيانات فارغة بالفعل.');
                toast('لا توجد بيانات للحذف');
            }

        } catch (error) {
            console.error(error);
            addLog(`❌ خطأ أثناء الحذف: ${error.message}`);
            toast.error('فشل حذف البيانات');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-8 p-8">
            <Toaster position="bottom-center" />

            <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-primary-blue/10 rounded-xl text-primary-blue">
                    <Database size={32} />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-text-primary">أداة استيراد البيانات</h1>
                    <p className="text-text-secondary">إدارة البيانات الأولية ونقل المحتوى القديم.</p>
                </div>
            </div>

            <div className="grid gap-6">
                {/* 1. Materials */}
                <div className="bg-card-bg border border-border-color rounded-xl p-6 flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-bold mb-1">1. استيراد المواد (Materials)</h3>
                        <p className="text-text-muted text-sm">يضيف المواد الأساسية: Networks, OS, Programming, Maintenance.</p>
                    </div>
                    <button
                        onClick={handleSeedMaterials}
                        disabled={isLoading}
                        className="bg-primary-blue text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition disabled:opacity-50"
                    >
                        استيراد
                    </button>
                </div>

                {/* 2. Seed Topics */}
                <div className="bg-card-bg border border-border-color rounded-xl p-6 flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-bold mb-1">2. استيراد الدروس التجريبية</h3>
                        <p className="text-text-muted text-sm">يضيف دروس تجريبية للمواد الجديدة.</p>
                    </div>
                    <button
                        onClick={handleSeedTopics}
                        disabled={isLoading}
                        className="bg-secondary text-white px-6 py-2 rounded-lg hover:opacity-90 transition disabled:opacity-50"
                    >
                        استيراد
                    </button>
                </div>

                {/* 3. V1 Migration */}
                <div className="bg-card-bg border border-yellow-500/30 rounded-xl p-6 flex items-center justify-between relative overflow-hidden">
                    <div className="absolute inset-0 bg-yellow-500/5 pointer-events-none" />
                    <div className="relative">
                        <h3 className="text-xl font-bold mb-1 text-yellow-500">3. نقل محتوى V1 (Migration)</h3>
                        <p className="text-text-muted text-sm">ينقل {migratedTopics.length} درس من ملفات HTML القديمة.</p>
                    </div>
                    <button
                        onClick={handleMigrateV1}
                        disabled={isLoading}
                        className="relative bg-yellow-600 text-white px-6 py-2 rounded-lg hover:bg-yellow-700 transition disabled:opacity-50"
                    >
                        بدء النقل
                    </button>
                </div>

                {/* 4. Delete All Data */}
                <div className="bg-red-900/10 border border-red-500/30 rounded-xl p-6 flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-bold mb-1 text-red-500 flex items-center gap-2">
                            <AlertTriangle size={20} /> حذف جميع البيانات
                        </h3>
                        <p className="text-text-muted text-sm">تحذير: سيتم حذف جميع المواد والشروحات من قاعدة البيانات.</p>
                    </div>
                    <button
                        onClick={handleDeleteAll}
                        disabled={isLoading}
                        className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                    >
                        حذف الكل
                    </button>
                </div>
            </div>

            {log.length > 0 && (
                <div className="bg-black/30 rounded-xl p-4 font-mono text-sm space-y-2 max-h-60 overflow-y-auto border border-border-color">
                    {log.map((msg, i) => (
                        <div key={i} className={msg.includes('❌') ? 'text-red-400' : 'text-green-400'}>
                            {msg}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
