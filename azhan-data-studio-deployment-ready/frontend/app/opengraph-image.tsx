import { ImageResponse } from "next/og";

export const alt = "Azhan Data Studio — Automated Data Intelligence";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #f7fafc 0%, #eef4f8 45%, #ffffff 100%)",
          color: "#0b1f33",
          padding: "68px 76px",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
          <div
            style={{
              width: 84,
              height: 84,
              borderRadius: 22,
              background: "#0b1f33",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 46,
              fontWeight: 800,
            }}
          >
            A
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 38, fontWeight: 800 }}>Azhan Data Studio</div>
            <div style={{ fontSize: 22, color: "#546575", marginTop: 4 }}>Automated Data Intelligence</div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", maxWidth: 980 }}>
          <div style={{ fontSize: 65, lineHeight: 1.05, fontWeight: 800, letterSpacing: -2 }}>
            Turn CSV & Excel data into useful insights.
          </div>
          <div style={{ fontSize: 27, lineHeight: 1.35, color: "#4b6071", marginTop: 24 }}>
            Data quality · ranked insights · visual discovery · comparison · forecasting · statistics
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 20, color: "#617384" }}>
          <div>Free to use · No dashboard setup</div>
          <div>azhandatastudio.com</div>
        </div>
      </div>
    ),
    size,
  );
}
