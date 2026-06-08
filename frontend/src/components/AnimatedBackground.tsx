export function AnimatedBackground() {
  return (
    <>
      <div className="aurora-bg" aria-hidden="true">
        <div className="aurora-orb aurora-orb-1" />
        <div className="aurora-orb aurora-orb-2" />
        <div className="aurora-orb aurora-orb-3" />
      </div>
      <div className="grid-overlay" aria-hidden="true" />
    </>
  );
}
