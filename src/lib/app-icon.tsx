import { ImageResponse } from "next/og";

/** Warm canvas + clay/lilac mark — matches the in-app brand. */
export function renderAppIcon(size: number) {
  const cy = size / 2;
  const r = size * 0.22;
  const leftCx = size * 0.42;
  const rightCx = size * 0.58;
  const stroke = Math.max(2, Math.round(size * 0.045));

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(160deg, #fffdfa 0%, #faf5ef 55%, #f3ebe1 100%)",
        }}
      >
        {/* Overlap fill first (behind strokes) */}
        <div
          style={{
            position: "absolute",
            display: "flex",
            width: size,
            height: size,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: r * 1.15,
              height: r * 2,
              borderRadius: r,
              background: "rgba(201, 123, 138, 0.22)",
            }}
          />
        </div>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
        >
          <circle
            cx={leftCx}
            cy={cy}
            r={r}
            stroke="#c97b8a"
            strokeWidth={stroke}
            fill="none"
          />
          <circle
            cx={rightCx}
            cy={cy}
            r={r}
            stroke="#8878a6"
            strokeWidth={stroke}
            fill="none"
          />
        </svg>
      </div>
    ),
    { width: size, height: size },
  );
}
