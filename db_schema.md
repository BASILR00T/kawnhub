# 🗃️ مرجع قاعدة البيانات (Firebase Firestore Schema)

## 1. `users` (الطلاب)
* `email` (ID): البريد الإلكتروني.
* `name`: الاسم.
* `role`: 'student' | 'admin' | 'editor'.
* `major`: 'CS' | 'IT' | 'ISE' | 'Common'.
* `favorites`: [Topic_IDs].
* `recentlyViewed`: [Topic_IDs].
* `completedTopics`: [Topic_IDs].

## 2. `materials` (المواد)
* `slug` (ID/Field): رابط المادة (مثل: network-1).
* `title`: العنوان.
* `targetMajors`: ['CS', 'IT'...].
* `icon`: اسم أيقونة Lucide.
* `order`: رقم الترتيب.

## 3. `topics` (الشروحات)
* `title`: العنوان.
* `materialSlug`: رابط المادة التابعة لها.
* `content`: مصفوفة البلوكات (JSON).
* `order`: رقم الترتيب.

## 4. `admins` (القائمة البيضاء)
* `email` (ID): بريد المشرف.
* `role`: الصلاحية.

## 5. `messages` (الدعم الفني)
* `email`, `message`, `type`, `createdAt`.
