import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, limit, doc, getDoc } from 'firebase/firestore'; //  الخطوة 1: نستورد 'doc' و 'getDoc'
import Link from 'next/link';

// --- Icon for Edit Button ---
const EditIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg> );

// --- Data Fetching Functions ---
async function getStats() {
    try {
        //  الخطوة 2: نجلب كل الإحصائيات معًا
        const materialsSnapshot = await getDocs(collection(db, 'materials'));
        const topicsSnapshot = await getDocs(collection(db, 'topics'));
        const visitDoc = await getDoc(doc(db, 'stats', 'visits')); //  نجلب عدّاد الزيارات

        return {
            materialsCount: materialsSnapshot.size,
            topicsCount: topicsSnapshot.size,
            visitsCount: visitDoc.exists() ? visitDoc.data().count : 0 //  نرجع قيمة العدّاد
        };
    } catch (error) {
        console.error("Error fetching stats: ", error);
        return { materialsCount: 0, topicsCount: 0, visitsCount: 0 };
    }
}

async function getRecentTopics() {
    try {
        const topicsCol = collection(db, 'topics');
        //  ملاحظة: سنقوم بتحديث هذا ليقرأ 'createdAt' لترتيب أدق
        const q = query(topicsCol, orderBy('order', 'desc'), limit(5));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error fetching recent topics: ", error);
        return [];
    }
}


export default async function AdminDashboard() {
    
    // نجلب الإحصائيات وآخر الشروحات في نفس الوقت
    const [stats, recentTopics] = await Promise.all([
        getStats(),
        getRecentTopics()
    ]);

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">أهلاً بك في لوحة تحكم KawnHub</h1>
            <p className="text-text-secondary mb-8">من هنا تقدر تدير كل محتوى المنصة.</p>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-surface-dark p-6 rounded-lg border border-border-color">
                    <h2 className="text-lg font-bold text-text-secondary">إجمالي المواد</h2>
                    <p className="text-4xl font-bold mt-2 text-primary-blue">{stats.materialsCount}</p>
                </div>
                <div className="bg-surface-dark p-6 rounded-lg border border-border-color">
                    <h2 className="text-lg font-bold text-text-secondary">إجمالي الشروحات</h2>
                    <p className="text-4xl font-bold mt-2 text-primary-purple">{stats.topicsCount}</p>
                </div>
                {/* الخطوة 3: نعرض بطاقة الزيارات الجديدة */}
                <div className="bg-surface-dark p-6 rounded-lg border border-border-color">
                    <h2 className="text-lg font-bold text-text-secondary">إجمالي الزيارات</h2>
                    <p className="text-4xl font-bold mt-2 text-green-400">{stats.visitsCount}</p>
                </div>
            </div>

            {/* Recent Topics Table */}
            <div className="mt-12">
                <h2 className="text-2xl font-bold mb-4">آخر الشروحات المضافة</h2>
                <div className="bg-surface-dark border border-border-color rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-border-color">
                        <thead className="bg-black/20">
                            <tr className="rtl:text-right ltr:text-left">
                                <th className="px-6 py-3 text-xs font-medium text-text-secondary uppercase tracking-wider">عنوان الشرح</th>
                                <th className="px-6 py-3 text-xs font-medium text-text-secondary uppercase tracking-wider hidden sm:table-cell">المادة</th>
                                <th className="relative px-6 py-3"><span className="sr-only">Edit</span></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-color">
                            {recentTopics.length > 0 ? recentTopics.map((topic) => (
                                <tr key={topic.id} className="rtl:text-right ltr:text-left hover:bg-black/20 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-primary">{topic.title}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary font-mono hidden sm:table-cell">{topic.materialSlug}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <Link href={`/admin/topics/${topic.id}`} className="text-text-secondary hover:text-primary-blue transition-colors">
                                            <EditIcon />
                                        </Link>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="3" className="text-center py-10 text-text-secondary">
                                        لا توجد شروحات مضافة بعد.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

