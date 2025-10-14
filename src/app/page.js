export default function PlaceholderPage() {
  return (
      <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          textAlign: 'center',
          padding: '1.5rem',
          backgroundColor: '#0a0a0f',
          color: '#f0f6fc',
          fontFamily: 'sans-serif',
          boxSizing: 'border-box' // Ensures padding is included in height
      }}>
          <h1 style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '1rem' }}>
              Kawn<span style={{ color: '#388bfd' }}>Hub</span>
          </h1>
          <h2 style={{ fontSize: '1.875rem', fontWeight: 'bold', marginBottom: '1rem', background: 'linear-gradient(to right, #388bfd, #8A2BE2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              الموقع قيد التطوير
          </h2>
          <p style={{ fontSize: '1.25rem', color: '#8b949e', maxWidth: '42rem' }}>
              نعمل حاليًا على إطلاق النسخة الجديدة قريبًا. شكرًا لزيارتك!
          </p>
      </div>
  );
}