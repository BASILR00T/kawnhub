import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, limit, doc, getDoc } from 'firebase/firestore'; //  الخطوة 1: نستورد 'doc' و 'getDoc'
import Link from 'next/link';

// --- Icon for Edit Button ---
const EditIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>);

// --- Data Fetching Functions ---
async function getStats() {
    try {
        //  الخطوة 2: نجلب كل الإحصائيات معًا
        const materialsSnapshot = await getDocs(collection(db, 'materials'));
        const topicsSnapshot = await getDocs(collection(db, 'topics'));
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const messagesSnapshot = await getDocs(collection(db, 'messages'));
        const visitDoc = await getDoc(doc(db, 'stats', 'visits'));

        return {
            materialsCount: materialsSnapshot.size,
            topicsCount: topicsSnapshot.size,
            usersCount: usersSnapshot.size,
            messagesCount: messagesSnapshot.size,
            visitsCount: visitDoc.exists() ? visitDoc.data().count : 0
        };
    } catch (error) {
        console.error("Error fetching stats: ", error);
        return { materialsCount: 0, topicsCount: 0, usersCount: 0, messagesCount: 0, visitsCount: 0 };
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
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-surface-dark p-6 rounded-2xl border border-border-color hover:border-primary-blue/50 transition-colors group">
                    <h2 className="text-sm font-bold text-text-secondary mb-2">الطلاب المسجلين</h2>
                    <p className="text-4xl font-bold text-primary-blue group-hover:scale-105 transition-transform">{stats.usersCount}</p>
                </div>
                <div className="bg-surface-dark p-6 rounded-2xl border border-border-color hover:border-primary-purple/50 transition-colors group">
                    <h2 className="text-sm font-bold text-text-secondary mb-2">الشروحات والمواد</h2>
                    <div className="flex items-baseline gap-2">
                        <p className="text-4xl font-bold text-primary-purple group-hover:scale-105 transition-transform">{stats.topicsCount}</p>
                        <span className="text-xs text-text-secondary">شرح في {stats.materialsCount} مادة</span>
                    </div>
                </div>
                <div className="bg-surface-dark p-6 rounded-2xl border border-border-color hover:border-yellow-400/50 transition-colors group">
                    <h2 className="text-sm font-bold text-text-secondary mb-2">رسائل الدعم</h2>
                    <p className="text-4xl font-bold text-yellow-400 group-hover:scale-105 transition-transform">{stats.messagesCount}</p>
                </div>
                <div className="bg-surface-dark p-6 rounded-2xl border border-border-color hover:border-green-400/50 transition-colors group">
                    <h2 className="text-sm font-bold text-text-secondary mb-2">إجمالي الزيارات</h2>
                    <p className="text-4xl font-bold text-green-400 group-hover:scale-105 transition-transform">{stats.visitsCount}</p>
                </div>
            </div>

            {/* Announcements Section (Placeholder) */}
            <div className="mb-12 bg-gradient-to-r from-primary-blue/10 to-primary-purple/10 border border-primary-blue/20 rounded-2xl p-6 flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold text-text-primary mb-1">📢 إعلانات المنصة</h3>
                    <p className="text-sm text-text-secondary">يمكنك قريباً إرسال إشعارات لجميع الطلاب من هنا.</p>
                </div>
                <button className="bg-surface-dark border border-border-color text-text-secondary px-4 py-2 rounded-lg text-sm font-bold hover:bg-white/5 transition-colors cursor-not-allowed opacity-70">
                    إنشاء إعلان (قريباً)
                </button>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
                <Link href="/admin/users" className="bg-surface-dark p-6 rounded-xl border border-border-color hover:border-primary-blue transition-all hover:-translate-y-1 group">
                    <h3 className="font-bold text-lg mb-2 group-hover:text-primary-blue transition-colors">إدارة المستخدمين</h3>
                    <p className="text-sm text-text-secondary">عرض وتعديل بيانات الطلاب والصلاحيات.</p>
                </Link>
                <Link href="/admin/messages" className="bg-surface-dark p-6 rounded-xl border border-border-color hover:border-yellow-400 transition-all hover:-translate-y-1 group">
                    <h3 className="font-bold text-lg mb-2 group-hover:text-yellow-400 transition-colors">رسائل الدعم</h3>
                    <p className="text-sm text-text-secondary">متابعة الشكاوى والاقتراحات.</p>
                </Link>
                <Link href="/admin/topics" className="bg-surface-dark p-6 rounded-xl border border-border-color hover:border-primary-purple transition-all hover:-translate-y-1 group">
                    <h3 className="font-bold text-lg mb-2 group-hover:text-primary-purple transition-colors">إدارة الشروحات</h3>
                    <p className="text-sm text-text-secondary">إضافة وتعديل المواد والدروس.</p>
                </Link>
                <Link href="/admin/majors" className="bg-surface-dark p-6 rounded-xl border border-border-color hover:border-green-400 transition-all hover:-translate-y-1 group">
                    <h3 className="font-bold text-lg mb-2 group-hover:text-green-400 transition-colors">إدارة التخصصات</h3>
                    <p className="text-sm text-text-secondary">إضافة وتعديل التخصصات الجامعية.</p>
                </Link>
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

