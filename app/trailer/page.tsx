export const metadata = {
  title: 'Job Pipeline — Launch Trailer',
  description: 'A 38-second animated walkthrough of the Job Pipeline agent.',
}

export default function TrailerPage() {
  return (
    <main style={{ position: 'fixed', inset: 0, background: '#0a0a0a' }}>
      <iframe
        src="/trailer/launch-trailer.html"
        title="Job Pipeline — Launch Trailer"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
        allow="autoplay"
      />
    </main>
  )
}
