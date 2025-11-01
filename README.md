# 🚀 KawnHub v2.0 - README

مرحبًا بك في المستودع الرسمي لـ **KawnHub**، مرجعك التقني الأول المصمم لطلاب التقنية. هذا المستند هو الدليل الشامل لفهم بنية المشروع، التقنيات المستخدمة، وكيفية المساهمة والتطوير.

**الحالة الحالية:** ✅ اكتمل الأساس الوظيفي للنسخة 2.0.  
المنصة الآن ديناميكية بالكامل، مع لوحة تحكم قوية لإدارة المحتوى، وواجهة أمامية تفاعلية تعرض البيانات مباشرة من Firebase.

---

## 🎯 الفكرة الأساسية

الهدف من **KawnHub** هو حل مشكلة تشتت المراجع التقنية للطلاب. بدلاً من الاعتماد على ملفات PDF وملاحظات مبعثرة، توفر المنصة مكانًا واحدًا، مرتبًا، وسريعًا يحتوي على كل الأوامر والشروحات العملية اللازمة للنجاح في المختبرات وسوق العمل.

---

## 🛠️ التقنيات المستخدمة (Tech Stack)

| الغرض                                                                 | التقنية                                | المجال                  |
|-----------------------------------------------------------------------|----------------------------------------|-------------------------|
| بناء الواجهة الأمامية (SSR/Client) ولوحة التحكم.                      | **Next.js 15+** (App Router)           | إطار العمل              |
| تخزين كل البيانات وتأمين الدخول.                                     | **Firebase v12** (Firestore, Auth, Storage) | الخلفية وقاعدة البيانات |
| تصميم واجهة مستخدم سريعة ومتجاوبة (Dark Mode by default).            | **Tailwind CSS**                       | التصميم                 |
| إدارة الحالة المعقدة لنظام البلوكات والمعاينة الحية.                   | **React Hooks** (useState, useEffect)  | إدارة الحالة (Admin)    |
| تمكين إعادة ترتيب البلوكات في لوحة التحكم.                             | **@dnd-kit**                           | السحب والإفلات          |
| تلوين الأكواد في الواجهة الأمامية والمعاينة.                          | **react-syntax-highlighter**           | عرض الكود               |
| عرض رسائل نجاح/خطأ أنيقة.                                              | **react-hot-toast**                    | الإشعارات               |
| إدارة الوسوم المتقدمة وإنشاء معرفات فريدة.                             | **react-select/creatable**, **uuid**   | أدوات مساعدة            |
| الربط مع GitHub والنشر التلقائي.                                       | **Vercel**                             | النشر                   |

---

## 📁 هيكل المشروع (Project Structure)

```bash
kawnhub/
├── src/
│   ├── app/
│   │   ├── (main)/              # الواجهة الأمامية (للطالب)
│   │   │   ├── page.js          # صفحة الهبوط
│   │   │   ├── hub/page.js      # صفحة المنصة الرئيسية
│   │   │   ├── materials/[slug]/page.js # قالب عرض الشرح
│   │   │   └── lab/page.js      # ديمو المختبر
│   │   │
│   │   ├── admin/               # لوحة التحكم (محمية)
│   │   │   ├── page.js          # الـ Dashboard الرئيسية
│   │   │   ├── materials/       # إدارة المواد CRUD
│   │   │   ├── tags/            # إدارة الوسوم CRUD
│   │   │   └── topics/          # إدارة الشروحات CRUD
│   │   │       ├── new/page.js
│   │   │       └── [id]/page.js
│   │   │
│   │   ├── login/               # صفحة تسجيل الدخول العامة
│   │   │   └── page.js
│   │   │
│   │   ├── layout.js            # التخطيط الرئيسي
│   │   └── globals.css          # التصميم العام
│   │
│   ├── components/
│   │   ├── HubInterface.js      # مكون العميل لصفحة /hub
│   │   └── ThemeSwitcher.js     # تم إلغاؤه حاليًا
│   │
│   ├── context/
│   │   └── AuthContext.js       # "الجدار الناري" لتأمين لوحة التحكم
│   │
│   └── lib/
│       └── firebase.js          # ملف الاتصال وتهيئة Firebase
│
├── public/
│   └── images/                  # الصور الثابتة (مثل صورة البروفايل)
│
├── scripts/
│   ├── extract_content.py       # (أداة ترحيل) V1 HTML -> JSON
│   └── import_to_firestore.py   # (أداة ترحيل) JSON -> Firestore
│
├── .env.local                   # المفاتيح السرية (Firebase)
├── package.json                 # كل الحزم والسكربتات
└── tailwind.config.js           # إعدادات Tailwind
```

---

## 🗃️ هيكل قاعدة البيانات (Firestore Data Structure)

### 1. `materials` (المواد)
مجموعة لتخزين المواد الدراسية.

**المستند (Document):** `[AUTO_ID]`

```json
{
  "title": "Network 2",
  "slug": "network-2",
  "courseCode": "NET-212",
  "description": {
    "en": "Advanced routing protocols...",
    "ar": "بروتوكولات التوجيه المتقدمة..."
  },
  "icon": "NetworkIcon",
  "order": 3
}
```

### 2. `topics` (الشروحات)
مجموعة لتخزين كل الشروحات.

**المستند (Document):** `[AUTO_ID]`

```json
{
  "title": "OSPF Configuration",
  "materialSlug": "network-2",
  "order": 1,
  "tags": ["routing", "cisco"],
  "createdAt": timestamp,
  "updatedAt": timestamp,
  "content": [ /* مصفوفة البلوكات */ ]
}
```

### 3. `topics.content` (نظام البلوكات)
هيكل مصفوفة `content` داخل كل شرح:

```json
[
  { "type": "subheading", "data": "Configuring OSPF Area 0" },
  { "type": "paragraph", "data": { "en": "First, enter router config...", "ar": "..." } },
  { "type": "ciscoTerminal", "data": "Switch> enable\nSwitch# conf t" },
  { "type": "note", "data": { "en": "Remember to save your config.", "ar": "..." } },
  { "type": "orderedList", "data": ["Step 1: Configure router ID", "Step 2: Define networks"] },
  { "type": "videoEmbed", "data": { "url": "https://youtube.com/embed/...", "caption": "OSPF Basics" } }
]
```

### 4. `tags` (الوسوم)
مجموعة مركزية لكل الوسوم لضمان عدم التكرار.

**المستند (Document):** `[AUTO_ID]`

```json
{
  "name": "Cisco",
  "slug": "cisco"
}
```

### 5. `admins` (القائمة البيضاء للأمان)
مجموعة لتحديد من يمكنه الدخول للوحة التحكم.

**معرف المستند (Document ID):** `user@gmail.com`

```json
{
  "email": "user@gmail.com",
  "role": "admin"
}
```

---

## 🚀 بدء التشغيل (Getting Started)

1. **نسخ المستودع:**
   ```bash
   git clone https://github.com/BASILR00T/kawnhub.git
   cd kawnhub
   ```

2. **التثبيت (فرع develop):**
   ```bash
   git checkout develop
   npm install
   ```

3. **إنشاء ملف `.env.local`:**
   - أنشئ ملف `.env.local` في المجلد الرئيسي.
   - انسخ مفاتيح `firebaseConfig` من مشروعك في Firebase.
   - أضف المفاتيح بهذا الشكل:
     ```env
     NEXT_PUBLIC_FIREBASE_API_KEY=...
     NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
     NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
     NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
     NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
     NEXT_PUBLIC_FIREBASE_APP_ID=...
     ```

4. **تشغيل الخادم المحلي:**
   ```bash
   npm run dev
   ```

</div>

<div dir="ltr" lang="en">

**Current Status:** ✅ Core functionality for v2.0 is complete.  
The platform is now fully dynamic, with a powerful content management dashboard and an interactive frontend pulling data directly from Firebase.

---

### 🎯 Core Idea

The goal of **KawnHub** is to solve the problem of scattered technical references for students. Instead of relying on PDF files and disorganized notes, the platform provides a single, organized, and fast place containing all the commands and practical explanations needed for success in labs and the job market.

---

### 🛠️ Tech Stack

| Domain                  | Technology                             | Purpose                                                               |
|-------------------------|----------------------------------------|-----------------------------------------------------------------------|
| Framework               | **Next.js 15+** (App Router)           | Building the frontend (SSR/Client) and admin dashboard.               |
| Backend & Database      | **Firebase v12** (Firestore, Auth, Storage) | Storing all data and securing access.                            |
| Styling                 | **Tailwind CSS**                       | Fast and responsive UI design (Dark Mode by default).                 |
| State Management (Admin)| **React Hooks** (useState, useEffect)  | Managing complex state for block system and live preview.             |
| Drag & Drop             | **@dnd-kit**                           | Enabling block reordering in the admin panel.                         |
| Code Highlighting       | **react-syntax-highlighter**           | Syntax coloring in frontend and preview.                              |
| Notifications           | **react-hot-toast**                    | Elegant success/error messages.                                       |
| Utilities               | **react-select/creatable**, **uuid**   | Advanced tag management and unique ID generation.                     |
| Deployment              | **Vercel**                             | GitHub integration and automatic deployment.                          |

---

### 📁 Project Structure

```plaintext
kawnhub/
├── src/
│   ├── app/
│   │   ├── (main)/              # Frontend (for students)
│   │   │   ├── page.js          # Landing page
│   │   │   ├── hub/page.js      # Main hub page
│   │   │   ├── materials/[slug]/page.js # Topic display template
│   │   │   └── lab/page.js      # Lab demo
│   │   │
│   │   ├── admin/               # Admin panel (protected)
│   │   │   ├── page.js          # Main Dashboard
│   │   │   ├── materials/       # CRUD for materials
│   │   │   ├── tags/            # CRUD for tags
│   │   │   └── topics/          # CRUD for topics
│   │   │       ├── new/page.js
│   │   │       └── [id]/page.js
│   │   │
│   │   ├── login/               # General login page
│   │   │   └── page.js
│   │   │
│   │   ├── layout.js            # Main layout
│   │   └── globals.css          # Global styles
│   │
│   ├── components/
│   │   ├── HubInterface.js      # Client component for /hub
│   │   └── ThemeSwitcher.js     # Currently disabled
│   │
│   ├── context/
│   │   └── AuthContext.js       # "Firewall" for securing admin panel
│   │
│   └── lib/
│       └── firebase.js          # Firebase connection and initialization
│
├── public/
│   └── images/                  # Static images (e.g., profile picture)
│
├── scripts/
│   ├── extract_content.py       # (Migration tool) V1 HTML -> JSON
│   └── import_to_firestore.py   # (Migration tool) JSON -> Firestore
│
├── .env.local                   # Secret keys (Firebase)
├── package.json                 # All packages and scripts
└── tailwind.config.js           # Tailwind settings
```

---

### 🗃️ Firestore Data Structure

#### 1. `materials`
Collection for storing courses.

**Document:** `[AUTO_ID]`

```json
{
  "title": "Network 2",
  "slug": "network-2",
  "courseCode": "NET-212",
  "description": {
    "en": "Advanced routing protocols...",
    "ar": "بروتوكولات التوجيه المتقدمة..."
  },
  "icon": "NetworkIcon",
  "order": 3
}
```

#### 2. `topics`
Collection for all topics.

**Document:** `[AUTO_ID]`

```json
{
  "title": "OSPF Configuration",
  "materialSlug": "network-2",
  "order": 1,
  "tags": ["routing", "cisco"],
  "createdAt": timestamp,
  "updatedAt": timestamp,
  "content": [ /* Block array */ ]
}
```

#### 3. `topics.content` (Block System)
Structure of `content` array in each topic:

```json
[
  { "type": "subheading", "data": "Configuring OSPF Area 0" },
  { "type": "paragraph", "data": { "en": "First, enter router config...", "ar": "..." } },
  { "type": "ciscoTerminal", "data": "Switch> enable\nSwitch# conf t" },
  { "type": "note", "data": { "en": "Remember to save your config.", "ar": "..." } },
  { "type": "orderedList", "data": ["Step 1: Configure router ID", "Step 2: Define networks"] },
  { "type": "videoEmbed", "data": { "url": "https://youtube.com/embed/...", "caption": "OSPF Basics" } }
]
```

#### 4. `tags`
Central collection to prevent duplication.

**Document:** `[AUTO_ID]`

```json
{
  "name": "Cisco",
  "slug": "cisco"
}
```

#### 5. `admins`
Whitelist for admin access.

**Document ID:** `user@gmail.com`

```json
{
  "email": "user@gmail.com",
  "role": "admin"
}
```

---

### 🚀 Getting Started

1. **Clone the repo:**
   ```bash
   git clone https://github.com/BASILR00T/kawnhub.git
   cd kawnhub
   ```

2. **Install (develop branch):**
   ```bash
   git checkout develop
   npm install
   ```

3. **Create `.env.local`:**
   - Create `.env.local` in root.
   - Copy `firebaseConfig` from your Firebase project.
   - Add keys like:
     ```env
     NEXT_PUBLIC_FIREBASE_API_KEY=...
     NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
     NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
     NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
     NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
     NEXT_PUBLIC_FIREBASE_APP_ID=...
     ```

4. **Run locally:**
   ```bash
   npm run dev
   ```

</div>

---
```