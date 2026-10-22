import { useState } from "react";
import { Plus, ChevronRight, ExternalLink } from "lucide-react";
import { FONT, MONO, R } from "../tokens.js";
import { TOOLS, WORKFLOW_TEMPLATES, toolById } from "../data.js";
import { Card, Btn, Eyebrow, H1, Sub, SectionH } from "../components/primitives/index.jsx";

  const [launchingGeo, setLaunchingGeo] = useState(false);

  const handleLaunchGeo = async () => {
    try {
      setLaunchingGeo(true);
      showToast("Opening GEO Tool...");
      const res = await fetch("/bff/tools/geo/launch", {
        method: "GET",
        credentials: "include",
      });
      const data = await res.json();
      const targetUrl = data?.launch_url || "http://geotest2026.duckdns.org:3000/";
      window.open(targetUrl, "_blank", "noopener,noreferrer");
      showToast("GEO Tool opened in a new tab");
    } catch (err) {
      window.open("http://geotest2026.duckdns.org:3000/", "_blank", "noopener,noreferrer");
      showToast("GEO Tool opened in a new tab");
    } finally {
      setLaunchingGeo(false);
    }
  };

  const handleOpenTool = (tool) => {
    if (tool.id === "copy") {
      nav("tool-detail");
    } else if (tool.id === "genfy") {
      nav("genfy-detail");
    } else if (tool.id === "geo") {
      handleLaunchGeo();
    } else if (tool.id === "hr" || tool.url) {
      window.location.href = tool.url || "https://testhr.duckdns.org/";
    } else {
      showToast(`${tool.name} — coming soon`);
    }
  };

  return (
    <div style={{ maxWidth: 1180, margin: "0 auto", padding: "16px 40px 80px", fontFamily: FONT }}>
      <H1 t={t}>Tools</H1>
      <Sub t={t}>
        Open any tool directly for a quick task — each reads OFFGRID's brand automatically. Or
        tap + to drop it into a workflow instead.
      </Sub>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill,minmax(258px,1fr))",
          gap: 16,
          marginTop: 20,
        }}
      >
        {TOOLS.map((tool) => (
          <Card
            key={tool.id}
            t={t}
            hoverable
            accentTop={tool.hue}
            onClick={() => handleOpenTool(tool)}
            style={{ padding: 20 }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
                background: tool.id === "copy" ? "#000000" : tool.id === "genfy" ? "rgba(232, 85, 42, 0.12)" : `${tool.hue}1F`,
                color: tool.hue,
                overflow: "hidden",
                border: tool.id === "copy" ? "none" : tool.id === "genfy" ? "1px solid rgba(232, 85, 42, 0.35)" : `1px solid ${t.border}`,
                boxShadow: tool.id === "genfy" ? "0 0 12px rgba(232, 85, 42, 0.3)" : "none",
              }}
            >
              {tool.id === "copy" ? (
                <span style={{ color: "#ffffff", fontWeight: 800, fontSize: 17, fontFamily: "Inter, sans-serif", userSelect: "none" }}>CA</span>
              ) : tool.id === "genfy" ? (
                <img src="/images/genfy_logo.png" alt="Genfy" style={{ width: "100%", height: "100%", objectFit: "cover", filter: "drop-shadow(0 0 4px rgba(232, 85, 42, 0.6))" }} />
              ) : (
                <tool.icon size={22} />
              )}
            </div>
            <h3
              style={{
                fontFamily: FONT,
                fontWeight: 700,
                fontSize: 16.5,
                letterSpacing: "-.01em",
                color: t.text,
                margin: "0 0 4px 0",
              }}
            >
              {tool.name}
            </h3>
            <p
              style={{
                fontFamily: FONT,
                fontSize: 12.5,
                color: t.text2,
                marginTop: 6,
                lineHeight: 1.45,
                minHeight: 54,
              }}
            >
              {tool.desc}
            </p>
            <div style={{ display: "flex", gap: 5, margin: "14px 0" }}>
              {tool.tags.map((tg) => (
                <span
                  key={tg}
                  style={{
                    fontFamily: MONO,
                    fontSize: 9.5,
                    color: t.text3,
                    background: t.surface2,
                    padding: "2px 7px",
                    borderRadius: 5,
                    border: `1px solid ${t.border}`,
                  }}
                >
                  {tg}
                </span>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Btn
                t={t}
                hue={tool.hue}
                disabled={tool.id === "geo" && launchingGeo}
                icon={tool.id === "geo" ? ExternalLink : undefined}
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenTool(tool);
                }}
                style={{ flex: 1 }}
              >
                {tool.id === "geo" ? (launchingGeo ? "Launching..." : "Launch") : "Open"}
              </Btn>
              <Btn
                t={t}
                kind="secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  showToast(`${tool.name} added to workflow`);
                }}
                icon={Plus}
                style={{ width: 36, padding: 0 }}
              />
            </div>
          </Card>
        ))}
      </div>

    </div>
  );
}
