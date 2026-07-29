/**
 * ToolDetail — Copy Agent (Live)
 * -------------------------------------------------------
 * This is the only screen wired to a real backend.
 * All requests go to POST /bff/chat/completions (proxied to copyagennt.in).
 * Supports both JSON and SSE streaming modes.
 */
import { useState, useRef, useCallback } from "react";
import {
  Sparkles, Plus, Check, ArrowRight, RefreshCw, Copy as CopyIcon,
  Send, X, Loader2,
} from "lucide-react";
import { FONT, MONO, R } from "../tokens.js";
import { BRAND, COPY_TEMPLATES, toolById } from "../data.js";
import { Card, Btn, Chip, Mono, Eyebrow } from "../components/primitives/index.jsx";
import BrandContextRail from "../components/BrandContextRail.jsx";

const BFF_ENDPOINT = "/bff/chat/completions";

// ── Default prompt seed ───────────────────────────────────
const DEFAULT_PROMPT = `Write 3 Instagram captions for the Spring Drop — lightweight technical outerwear for city commutes. Angle: beat the weather without looking like you're dressed for it.`;

export default function ToolDetail({ t, nav, showToast }) {
  const tool = toolById("copy");

  // ── UI State ──────────────────────────────────────────
  const [template, setTemplate] = useState("Instagram Captions");
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [useStream, setUseStream] = useState(true);

  // ── Generation state ──────────────────────────────────
  const [isGenerating, setIsGenerating] = useState(false);
  const [output, setOutput] = useState("");
  const [hasOutput, setHasOutput] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(null);
  const [approved, setApproved] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [copied, setCopied] = useState(false);

  const abortRef = useRef(null);

  // ── Generate ─────────────────────────────────────────
  const generate = useCallback(async () => {
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setError(null);
    setOutput("");
    setHasOutput(false);
    setApproved(false);
    setIsStreaming(false);

    const enrichedPrompt = prompt.trim();

    const payload = {
      user_message: enrichedPrompt,
      llm_model: "gpt-4o",
      temperature: 0.75,
      stream: useStream,
      conversation_id: conversationId,
    };

    try {
      const response = await fetch(BFF_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: abortRef.current?.signal,
      });

      if (!response.ok) {
        let detail = `HTTP ${response.status}`;
        try {
          const err = await response.json();
          detail = err.detail || detail;
        } catch (_) {
          const txt = await response.text();
          if (txt) detail = txt.slice(0, 200);
        }
        throw new Error(detail);
      }

      // ── SSE streaming ──────────────────────────────
      if (useStream) {
        setIsStreaming(true);
        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let buffer = "";
        let fullText = "";

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith("data:")) continue;
            const dataStr = trimmed.slice(5).trim();
            if (!dataStr) continue;

            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.error) throw new Error(parsed.error);
              if (parsed.chunk) {
                fullText += parsed.chunk;
                setOutput(fullText);
                setHasOutput(true);
              }
              if (parsed.conversation_id) setConversationId(parsed.conversation_id);
            } catch (parseErr) {
              if (dataStr.includes('"error"')) throw new Error(dataStr);
            }
          }
        }
        setIsStreaming(false);

      // ── JSON ───────────────────────────────────────
      } else {
        const data = await response.json();
        if (data.assistant_message) {
          setOutput(data.assistant_message);
          setHasOutput(true);
          if (data.conversation_id) setConversationId(data.conversation_id);
        } else {
          throw new Error("No response text returned.");
        }
      }
    } catch (err) {
      if (err.name === "AbortError") return;
      console.error("Copy Agent error:", err);
      setError(err.message || "Unknown error");
      setIsStreaming(false);
    } finally {
      setIsGenerating(false);
      setIsStreaming(false);
    }
  }, [prompt, template, useStream, conversationId, isGenerating]);

  // ── Regenerate (new thread) ──────────────────────────
  const regenerate = () => {
    setConversationId(null);
    generate();
  };

  // ── Copy to clipboard ─────────────────────────────────
  const copyOutput = async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (_) {
      showToast("Copy failed — please select manually");
    }
  };

  // ── Approve ───────────────────────────────────────────
  const handleApprove = () => {
    setApproved(true);
    showToast("Approved — saved to Assets & fed back to Brand Brain");
  };

  return (
    <div style={{ maxWidth: 1180, margin: "0 auto", padding: "32px 40px 80px", fontFamily: FONT }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22 }}>
        <div
          style={{
            width: 32, height: 32, borderRadius: 8, display: "grid", placeItems: "center",
            background: tool.id === "copy" ? "transparent" : tool.id === "genfy" ? "rgba(232, 85, 42, 0.12)" : `${tool.hue}1F`,
            color: tool.hue, overflow: "hidden",
            border: tool.id === "copy" ? "none" : tool.id === "genfy" ? "1px solid rgba(232, 85, 42, 0.35)" : `1px solid ${t.border}`,
            boxShadow: tool.id === "genfy" ? "0 0 8px rgba(232, 85, 42, 0.3)" : "none",
          }}
        >
          {tool.id === "copy" ? (
            <img src="/images/copy_agent_logo.png" alt="Copy Agent" style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scale(1.25)" }} />
          ) : tool.id === "genfy" ? (
            <img src="/images/genfy_logo.png" alt="Genfy" style={{ width: "100%", height: "100%", objectFit: "cover", filter: "drop-shadow(0 0 3px rgba(232, 85, 42, 0.6))" }} />
          ) : (
            <tool.icon size={16} />
          )}
        </div>
        <div>
          <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 20, letterSpacing: "-.02em", color: t.text }}>
            {tool.name}
          </div>
        </div>
        <button
          onClick={() => nav("tools")}
          style={{
            marginLeft: "auto", fontFamily: MONO, fontSize: 11.5, color: t.text2,
            background: t.surface2, border: `1px solid ${t.border}`, borderRadius: R.pill,
            padding: "5px 12px", cursor: "pointer",
          }}
        >
          ← Back to tools
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 20 }} className="detail-grid">
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* ── Composer ─────────────────────────────────── */}
          <Card t={t} style={{ padding: 18 }}>
            {/* Template selector */}
            <div style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: ".1em", textTransform: "uppercase", color: t.text3, marginBottom: 8 }}>
              Template
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
              {COPY_TEMPLATES.map((x) => (
                <button
                  key={x}
                  onClick={() => setTemplate(x)}
                  style={{
                    fontFamily: FONT, fontSize: 11.5, fontWeight: 500, padding: "6px 11px",
                    borderRadius: 8, cursor: "pointer",
                    background: template === x ? tool.hue : t.surface2,
                    color: template === x ? "#fff" : t.text2,
                    border: `1px solid ${template === x ? tool.hue : t.border}`,
                    transition: "all .12s",
                  }}
                >
                  {x}
                </button>
              ))}
            </div>

            {/* Stream toggle */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <button
                onClick={() => setUseStream(!useStream)}
                style={{
                  width: 36, height: 20, borderRadius: 10, border: "none", cursor: "pointer",
                  background: useStream ? tool.hue : t.surface3,
                  position: "relative", transition: "background .2s", flexShrink: 0,
                }}
              >
                <span style={{
                  position: "absolute", top: 2, left: useStream ? 18 : 2,
                  width: 16, height: 16, borderRadius: 8, background: "#fff",
                  transition: "left .2s", boxShadow: "0 1px 3px rgba(0,0,0,.3)",
                }} />
              </button>
              <span style={{ fontFamily: MONO, fontSize: 10.5, color: t.text3 }}>
                {useStream ? "Streaming (SSE)" : "JSON response"}
              </span>
            </div>

            {/* Prompt textarea */}
            <div style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: ".1em", textTransform: "uppercase", color: t.text3, marginBottom: 8 }}>
              Your prompt
            </div>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe what copy you need..."
              rows={4}
              style={{
                width: "100%", resize: "vertical", fontFamily: FONT, fontSize: 13.5,
                color: t.text, background: t.surface2, border: `1px solid ${t.border}`,
                borderRadius: R.md, padding: 14, lineHeight: 1.55, outline: "none",
                transition: "border-color .14s",
              }}
              onFocus={(e) => (e.target.style.borderColor = tool.hue)}
              onBlur={(e) => (e.target.style.borderColor = t.border)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) generate();
              }}
            />

            {/* Actions */}
            <div style={{ display: "flex", gap: 9, marginTop: 14, alignItems: "center", flexWrap: "wrap" }}>
              <Btn
                t={t}
                hue={tool.hue}
                icon={isGenerating ? Loader2 : Sparkles}
                loading={isGenerating}
                onClick={generate}
                disabled={!prompt.trim()}
              >
                {isGenerating ? "Generating…" : "Generate"}
              </Btn>
              <span style={{ fontFamily: MONO, fontSize: 10, color: t.text3 }}>
                ⌘+Enter
              </span>
              {conversationId && (
                <span style={{ fontFamily: MONO, fontSize: 10, color: t.text3, marginLeft: "auto" }}>
                  thread: {conversationId.slice(0, 8)}…
                </span>
              )}
            </div>
          </Card>

          {/* ── Output ───────────────────────────────────── */}
          <Card t={t} style={{ padding: 0, overflow: "hidden" }}>
            {/* Output header */}
            <div
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "14px 18px", borderBottom: `1px solid ${t.border}`,
              }}
            >
              <Mono t={t}>
                {isStreaming ? "Streaming response…" : hasOutput ? "Output" : "Waiting for output"}
              </Mono>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {isStreaming && (
                  <Loader2
                    size={13}
                    style={{ color: tool.hue, animation: "spin 1s linear infinite" }}
                  />
                )}
                {hasOutput && (
                  <Chip t={t} dot hue={t.success}>{BRAND.match}% on-brand</Chip>
                )}
              </div>
            </div>

            {/* Output body */}
            {error ? (
              <div style={{ padding: "18px 18px", background: t.dangerSoft }}>
                <div style={{ fontFamily: MONO, fontSize: 11, color: t.danger, marginBottom: 6 }}>
                  ERROR
                </div>
                <div style={{ fontFamily: FONT, fontSize: 13, color: t.danger, lineHeight: 1.55, whiteSpace: "pre-wrap" }}>
                  {error}
                </div>
                <button
                  onClick={() => setError(null)}
                  style={{ marginTop: 10, fontFamily: MONO, fontSize: 11, color: t.danger, background: "none", border: "none", cursor: "pointer" }}
                >
                  Dismiss ×
                </button>
              </div>
            ) : hasOutput ? (
              <div
                style={{
                  padding: "18px 18px",
                  fontFamily: FONT,
                  fontSize: 14,
                  lineHeight: 1.65,
                  color: t.text,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  minHeight: 120,
                }}
                className={isStreaming ? "streaming-cursor" : ""}
              >
                {output}
              </div>
            ) : (
              <div
                style={{
                  padding: "36px 18px",
                  textAlign: "center",
                  fontFamily: FONT,
                  fontSize: 13.5,
                  color: t.text3,
                }}
              >
                {isGenerating ? "Copy Agent is thinking…" : "Output will appear here"}
              </div>
            )}

            {/* Output actions */}
            {hasOutput && !error && (
              <div
                style={{
                  display: "flex", alignItems: "center", gap: 9, padding: "14px 18px",
                  background: t.surface2, borderTop: `1px solid ${t.border}`, flexWrap: "wrap",
                }}
              >
                <Btn
                  t={t}
                  kind={approved ? "secondary" : "success"}
                  icon={Check}
                  onClick={handleApprove}
                  disabled={approved}
                >
                  {approved ? "Approved ✓" : "Approve & save"}
                </Btn>

                <Btn
                  t={t}
                  icon={CopyIcon}
                  kind="secondary"
                  small
                  onClick={copyOutput}
                >
                  {copied ? "Copied!" : "Copy text"}
                </Btn>

                <Btn
                  t={t}
                  kind="ghost"
                  small
                  icon={RefreshCw}
                  onClick={regenerate}
                  disabled={isGenerating}
                >
                  Regenerate
                </Btn>

                <Btn
                  t={t}
                  icon={ArrowRight}
                  hue={toolById("genfy").hue}
                  small
                  onClick={() => {
                    showToast("Sent to Genfy · Image");
                    nav("workflow");
                  }}
                  style={{
                    marginLeft: "auto",
                    background: `${toolById("genfy").hue}18`,
                    color: toolById("genfy").hue,
                    border: `1px solid ${toolById("genfy").hue}44`,
                  }}
                >
                  Send to Genfy →
                </Btn>
              </div>
            )}
          </Card>
        </div>

        {/* ── Brand Context Rail ──────────────────────────── */}
        <BrandContextRail t={t} showToast={showToast} />
      </div>
    </div>
  );
}
