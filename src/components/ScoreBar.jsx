export default function ScoreBar({ score }) {
  const color = score >= 75 ? "#F44336" : score >= 40 ? "#FFC107" : "#4CAF50";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-white/5">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${score}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-xs font-mono w-7 text-right" style={{ color }}>
        {score}
      </span>
    </div>
  );
}
