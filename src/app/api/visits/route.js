import { db } from '@/lib/firebase';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { NextResponse } from 'next/server';

// نستخدم دالة POST (وليس GET) لضمان عدم تخزين Vercel للنتيجة (Caching)
// هذا يضمن أن العدّاد سيزيد مع كل زيارة
export async function POST(request) {
    try {
        // نحدد المستند الذي نريد تحديثه
        const visitRef = doc(db, 'stats', 'visits');

        // نستخدم دالة 'increment' الذرية من Firebase
        // هذا يضمن أنه حتى لو زار 1000 شخص الموقع في نفس الثانية، ستتم كل العدّات بنجاح
        await updateDoc(visitRef, {
            count: increment(1)
        });

        // نرسل ردًا ناجحًا
        return NextResponse.json({ success: true, message: 'Visit counted.' });

    } catch (error) {
        console.error("Error incrementing visit count: ", error);
        // نرسل ردًا بالخطأ إذا حدثت مشكلة
        return NextResponse.json({ success: false, message: 'Internal server error.' }, { status: 500 });
    }
}
