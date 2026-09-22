import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

// No logo was supplied to the design system (see _ds/.../readme.md,
// "Logotype" — the brand name is set in type wherever a mark would go).
// This favicon follows the same rule: court green ground, a single
// Space Grotesk "S" in paper, no invented mark.
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0F4436",
          borderRadius: 6,
          color: "#FAF9F6",
          fontSize: 22,
          fontWeight: 600,
          fontFamily: "sans-serif",
        }}
      >
        S
      </div>
    ),
    size,
  );
}
