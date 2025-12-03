export function BackgroundEffects() {
  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
      {/* Top Left - Emerald */}
      <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] rounded-full bg-emerald-500/5 blur-[120px] animate-pulse" style={{ animationDuration: '8s' }} />
      
      {/* Bottom Right - Blue */}
      <div className="absolute top-[40%] -right-[10%] w-[60%] h-[60%] rounded-full bg-blue-500/5 blur-[100px] animate-pulse" style={{ animationDuration: '10s', animationDelay: '1s' }} />
      
      {/* Bottom Left - Purple */}
      <div className="absolute -bottom-[10%] left-[20%] w-[50%] h-[50%] rounded-full bg-purple-500/5 blur-[100px] animate-pulse" style={{ animationDuration: '12s', animationDelay: '2s' }} />
    </div>
  );
}
