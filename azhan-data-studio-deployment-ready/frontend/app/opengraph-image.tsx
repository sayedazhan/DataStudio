import { ImageResponse } from "next/og";

export const alt = "Azhan Data Studio — Excel & CSV analytics, dashboards and reports";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "#0b1d3a",
        color: "white",
        padding: "54px 62px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center" }}>
        <div
          style={{
            width: 60,
            height: 60,
            borderRadius: 16,
            background: "#1671ff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 32,
            fontWeight: 800,
          }}
        >
          A
        </div>
        <div style={{ display: "flex", flexDirection: "column", marginLeft: 18 }}>
          <div style={{ fontSize: 31, fontWeight: 800 }}>Azhan Data Studio</div>
          <div style={{ fontSize: 14, letterSpacing: 2, color: "#b8c9e2", marginTop: 4 }}>
            AUTOMATED DATA INTELLIGENCE
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flex: 1, marginTop: 42 }}>
        <div style={{ width: "56%", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div style={{ fontSize: 56, lineHeight: 1.05, fontWeight: 800 }}>
            Turn spreadsheets into decision-ready intelligence.
          </div>
          <div style={{ fontSize: 21, lineHeight: 1.45, color: "#d1dceb", marginTop: 24 }}>
            Analyse · Dashboard · Compare · Forecast · Report
          </div>
          <div style={{ fontSize: 17, color: "#94b3dc", marginTop: 34 }}>azhandatastudio.com</div>
        </div>

        <div
          style={{
            width: "40%",
            marginLeft: "4%",
            background: "#f8fbff",
            border: "8px solid #14233d",
            borderRadius: 22,
            display: "flex",
            padding: 18,
          }}
        >
          <div
            style={{
              width: 82,
              borderRadius: 10,
              background: "#0d1d39",
              display: "flex",
              flexDirection: "column",
              padding: 10,
            }}
          >
            <div style={{ height: 22, width: 22, borderRadius: 6, background: "#1671ff", marginBottom: 12 }} />
            <div style={{ height: 12, borderRadius: 4, background: "#2250a6", marginBottom: 10 }} />
            <div style={{ height: 12, borderRadius: 4, background: "#1b2f50", marginBottom: 10 }} />
            <div style={{ height: 12, borderRadius: 4, background: "#1b2f50", marginBottom: 10 }} />
            <div style={{ height: 12, borderRadius: 4, background: "#1b2f50", marginBottom: 10 }} />
            <div style={{ height: 12, borderRadius: 4, background: "#1b2f50" }} />
          </div>

          <div style={{ flex: 1, display: "flex", flexDirection: "column", marginLeft: 12 }}>
            <div style={{ display: "flex" }}>
              {[
                ["$128K", "Revenue"],
                ["1,024", "Rows"],
                ["96%", "Quality"],
              ].map(([value, label], index) => (
                <div
                  key={value}
                  style={{
                    flex: 1,
                    height: 70,
                    borderRadius: 9,
                    background: "white",
                    border: "1px solid #dbe5f2",
                    color: "#10244a",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: index < 2 ? 8 : 0,
                  }}
                >
                  <div style={{ fontSize: 18, fontWeight: 800 }}>{value}</div>
                  <div style={{ fontSize: 11, color: "#6f7f95", marginTop: 4 }}>{label}</div>
                </div>
              ))}
            </div>

            <div
              style={{
                flex: 1,
                borderRadius: 10,
                background: "white",
                border: "1px solid #dbe5f2",
                padding: 14,
                display: "flex",
                alignItems: "flex-end",
                marginTop: 10,
              }}
            >
              {[35, 58, 46, 72, 64, 84, 76, 92].map((height, index) => (
                <div
                  key={index}
                  style={{
                    flex: 1,
                    height: `${height}%`,
                    borderRadius: 4,
                    background: index % 2 === 0 ? "#72b6ff" : "#2b69ed",
                    marginRight: index < 7 ? 7 : 0,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>,
    size,
  );
}
