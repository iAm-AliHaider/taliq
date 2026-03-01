"use client";

import { useState, useEffect, useCallback } from "react";

interface LetterTemplate {
  id: number;
  type: string;
  name: string;
  name_ar: string;
  body_html: string;
  body_html_ar: string;
  header: {
    companyName?: string;
    companyNameAr?: string;
    subtitle?: string;
    logoUrl?: string;
    accentColor?: string;
  };
  footer: {
    signatoryName?: string;
    signatoryTitle?: string;
    showRef?: boolean;
    showDate?: boolean;
    disclaimer?: string;
  };
  variables: string[];
  updated_at: string;
  updated_by: string;
}

// Simple Mustache-like template engine
function renderTemplate(html: string, vars: Record<string, string>): string {
  let result = html;
  // Simple variable replacement: {{varName}}
  for (const [key, val] of Object.entries(vars)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), val || "");
  }
  // Simple conditionals: {{#if var}}...{{/if}}
  result = result.replace(/\{\{#if (\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (_, v, content) => {
    return vars[v] ? content : "";
  });
  // Clean up any remaining {{...}}
  result = result.replace(/\{\{[^}]+\}\}/g, '<span style="color:#ccc">[empty]</span>');
  // Convert \n to <br>
  result = result.replace(/\\n/g, "<br/>");
  return result;
}

const SAMPLE_DATA: Record<string, string> = {
  employeeName: "Ahmed Al-Rashidi",
  employeeId: "E001",
  nationality: "Saudi",
  position: "Senior Software Engineer",
  department: "Information Technology",
  joinDate: "2020-03-15",
  purpose: "bank loan application",
  companyName: "MORABAHA MRNA",
  basicSalary: "12,000",
  housingAllowance: "3,000",
  transportAllowance: "1,500",
  totalSalary: "16,500",
  letterDate: new Date().toISOString().slice(0, 10),
  addressedTo: "To Whom It May Concern",
};

export default function TemplatesPanel() {
  const [templates, setTemplates] = useState<LetterTemplate[]>([]);
  const [selected, setSelected] = useState<LetterTemplate | null>(null);
  const [editing, setEditing] = useState(false);
  const [editBody, setEditBody] = useState("");
  const [editHeader, setEditHeader] = useState<LetterTemplate["header"]>({});
  const [editFooter, setEditFooter] = useState<LetterTemplate["footer"]>({});
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<"preview" | "edit" | "header" | "footer">("preview");

  const loadTemplates = useCallback(async () => {
    try {
      const res = await fetch("/api/templates");
      if (res.ok) {
        const data = await res.json();
        setTemplates(data);
        if (!selected && data.length > 0) {
          setSelected(data[0]);
          setEditBody(data[0].body_html);
          setEditHeader(data[0].header || {});
          setEditFooter(data[0].footer || {});
        }
      }
    } catch { /* */ }
  }, []);

  useEffect(() => { loadTemplates(); }, [loadTemplates]);

  const selectTemplate = (t: LetterTemplate) => {
    setSelected(t);
    setEditBody(t.body_html);
    setEditHeader(t.header || {});
    setEditFooter(t.footer || {});
    setEditing(false);
    setTab("preview");
  };

  const saveTemplate = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const res = await fetch("/api/templates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: selected.type,
          body_html: editBody,
          header: editHeader,
          footer: editFooter,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setTemplates(prev => prev.map(t => t.type === updated.type ? { ...t, ...updated } : t));
        setSelected(prev => prev ? { ...prev, ...updated } : prev);
        setEditing(false);
      }
    } catch { /* */ }
    setSaving(false);
  };

  const rendered = selected ? renderTemplate(editBody || selected.body_html, SAMPLE_DATA) : "";
  const hdr = editHeader;
  const ftr = editFooter;

  return (
    <div className="space-y-4">
      {/* Template selector */}
      <div className="flex gap-2 flex-wrap">
        {templates.map(t => (
          <button
            key={t.type}
            onClick={() => selectTemplate(t)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              selected?.type === t.type
                ? "bg-emerald-500 text-white shadow-sm shadow-emerald-200"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {t.name}
          </button>
        ))}
      </div>

      {selected && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left: Editor */}
          <div className="space-y-3">
            {/* Tabs */}
            <div className="flex border-b border-gray-200">
              {(["preview", "edit", "header", "footer"] as const).map(t => (
                <button
                  key={t}
                  onClick={() => { setTab(t); if (t === "edit") setEditing(true); }}
                  className={`px-4 py-2 text-xs font-semibold transition-colors ${
                    tab === t ? "text-emerald-600 border-b-2 border-emerald-500" : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  {t === "preview" ? "Preview" : t === "edit" ? "Edit Body" : t === "header" ? "Header" : "Footer"}
                </button>
              ))}
            </div>

            {/* Edit Body */}
            {tab === "edit" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] text-gray-400">
                    Variables: {selected.variables?.map(v => `{{${v}}}`).join(", ")}
                  </p>
                  <button
                    onClick={saveTemplate}
                    disabled={saving}
                    className="px-4 py-1.5 rounded-lg bg-emerald-500 text-white text-xs font-semibold hover:bg-emerald-600 disabled:opacity-50 shadow-sm shadow-emerald-200"
                  >
                    {saving ? "Saving..." : "Save Template"}
                  </button>
                </div>
                <textarea
                  value={editBody}
                  onChange={e => setEditBody(e.target.value)}
                  className="w-full h-[400px] rounded-xl border border-gray-200 p-4 text-xs font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-emerald-200 resize-none"
                  placeholder="HTML template body..."
                />
              </div>
            )}

            {/* Header Config */}
            {tab === "header" && (
              <div className="space-y-3 p-4 rounded-xl border border-gray-200 bg-gray-50">
                <h4 className="text-xs font-bold text-gray-800">Letterhead Configuration</h4>
                {[
                  { key: "companyName", label: "Company Name", placeholder: "MORABAHA MRNA" },
                  { key: "companyNameAr", label: "Company Name (Arabic)", placeholder: "" },
                  { key: "subtitle", label: "Subtitle", placeholder: "Kingdom of Saudi Arabia" },
                  { key: "logoUrl", label: "Logo URL", placeholder: "https://..." },
                  { key: "accentColor", label: "Accent Color", placeholder: "#10B981" },
                ].map(({ key, label, placeholder }) => (
                  <div key={key}>
                    <label className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">{label}</label>
                    <input
                      type={key === "accentColor" ? "color" : "text"}
                      value={(editHeader as any)[key] || ""}
                      onChange={e => setEditHeader(prev => ({ ...prev, [key]: e.target.value }))}
                      placeholder={placeholder}
                      className={`w-full mt-1 px-3 py-2 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-200 ${key === "accentColor" ? "h-10" : ""}`}
                    />
                  </div>
                ))}
                <button onClick={saveTemplate} disabled={saving}
                  className="px-4 py-1.5 rounded-lg bg-emerald-500 text-white text-xs font-semibold hover:bg-emerald-600 disabled:opacity-50 shadow-sm shadow-emerald-200 mt-2">
                  {saving ? "Saving..." : "Save Header"}
                </button>
              </div>
            )}

            {/* Footer Config */}
            {tab === "footer" && (
              <div className="space-y-3 p-4 rounded-xl border border-gray-200 bg-gray-50">
                <h4 className="text-xs font-bold text-gray-800">Footer & Signature Configuration</h4>
                {[
                  { key: "signatoryName", label: "Signatory Name", placeholder: "Authorized Signatory" },
                  { key: "signatoryTitle", label: "Signatory Title", placeholder: "HR Department" },
                  { key: "disclaimer", label: "Disclaimer Text", placeholder: "Computer-generated document..." },
                ].map(({ key, label, placeholder }) => (
                  <div key={key}>
                    <label className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">{label}</label>
                    <input
                      type="text"
                      value={(editFooter as any)[key] || ""}
                      onChange={e => setEditFooter(prev => ({ ...prev, [key]: e.target.value }))}
                      placeholder={placeholder}
                      className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-200"
                    />
                  </div>
                ))}
                <div className="flex gap-4">
                  {[
                    { key: "showRef", label: "Show Reference Number" },
                    { key: "showDate", label: "Show Date" },
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center gap-2 text-xs text-gray-600">
                      <input
                        type="checkbox"
                        checked={(editFooter as any)[key] !== false}
                        onChange={e => setEditFooter(prev => ({ ...prev, [key]: e.target.checked }))}
                        className="rounded border-gray-300 text-emerald-500 focus:ring-emerald-200"
                      />
                      {label}
                    </label>
                  ))}
                </div>
                <button onClick={saveTemplate} disabled={saving}
                  className="px-4 py-1.5 rounded-lg bg-emerald-500 text-white text-xs font-semibold hover:bg-emerald-600 disabled:opacity-50 shadow-sm shadow-emerald-200 mt-2">
                  {saving ? "Saving..." : "Save Footer"}
                </button>
              </div>
            )}

            {/* Preview (tab === "preview") shows in right panel */}
            {tab === "preview" && (
              <div className="p-4 rounded-xl border border-gray-200 bg-gray-50 text-center text-xs text-gray-400">
                Select &quot;Edit Body&quot;, &quot;Header&quot;, or &quot;Footer&quot; tab to customize.
                <br/>Live preview is shown on the right.
                <p className="mt-3 text-[10px] text-gray-300">Last updated: {selected.updated_at?.slice(0, 16)?.replace("T", " ")} by {selected.updated_by}</p>
              </div>
            )}
          </div>

          {/* Right: Live Preview */}
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
              <h4 className="text-xs font-bold text-gray-800">Live Preview</h4>
              <span className="text-[10px] text-gray-400">{selected.name}</span>
            </div>
            <div className="p-6" style={{ fontFamily: "Georgia, serif", fontSize: "13px", lineHeight: "1.7", color: "#1a1a1a" }}>
              {/* Letterhead */}
              <div style={{ borderTop: `3px solid ${hdr.accentColor || "#10B981"}`, paddingTop: "12px", marginBottom: "24px" }}>
                <div style={{ fontSize: "20px", fontWeight: "bold", color: hdr.accentColor || "#10B981" }}>
                  {hdr.companyName || "MORABAHA MRNA"}
                </div>
                {hdr.companyNameAr && <div style={{ fontSize: "16px", color: "#888", direction: "rtl" }}>{hdr.companyNameAr}</div>}
                <div style={{ fontSize: "11px", color: "#888" }}>{hdr.subtitle || "Kingdom of Saudi Arabia"}</div>
                <hr style={{ marginTop: "8px", border: "none", borderTop: `1px solid ${hdr.accentColor || "#10B981"}40` }} />
              </div>

              {/* Date & Addressee */}
              <div style={{ textAlign: "right", fontSize: "11px", color: "#888", marginBottom: "16px" }}>
                {SAMPLE_DATA.letterDate}
              </div>
              <div style={{ marginBottom: "16px" }}>
                <strong>To:</strong> {SAMPLE_DATA.addressedTo}
              </div>

              {/* Subject */}
              <div style={{ textAlign: "center", fontSize: "15px", fontWeight: "bold", margin: "20px 0", textDecoration: "underline" }}>
                RE: {selected.name}
              </div>

              {/* Body */}
              <div dangerouslySetInnerHTML={{ __html: rendered }} style={{ marginBottom: "24px" }} />

              {/* Closing */}
              <p style={{ marginBottom: "32px", fontSize: "12px", color: "#555" }}>
                Should you require any further information, please do not hesitate to contact the Human Resources department.
              </p>

              {/* Signature */}
              <div style={{ marginTop: "40px" }}>
                <p style={{ fontSize: "12px", color: "#555" }}>Yours sincerely,</p>
                <div style={{ marginTop: "32px", borderTop: "1px solid #ccc", width: "180px", paddingTop: "6px" }}>
                  <div style={{ fontWeight: "bold", fontSize: "12px" }}>{ftr.signatoryName || "Authorized Signatory"}</div>
                  <div style={{ fontSize: "11px", color: "#888" }}>{ftr.signatoryTitle || "HR Department"}</div>
                </div>
              </div>

              {/* Footer */}
              <div style={{ marginTop: "32px", paddingTop: "8px", borderTop: "1px solid #eee", fontSize: "9px", color: "#bbb" }}>
                {ftr.showRef !== false && <span>Ref: LTR-2026-001 | </span>}
                {ftr.showDate !== false && <span>Date: {SAMPLE_DATA.letterDate} | </span>}
                <span>Generated by Taliq HR Platform</span>
                {ftr.disclaimer && <div style={{ marginTop: "4px" }}>{ftr.disclaimer}</div>}
              </div>
            </div>
          </div>
        </div>
      )}

      {templates.length === 0 && (
        <div className="text-center py-12 text-sm text-gray-400">
          No templates found. Templates will be created when the agent initializes.
        </div>
      )}
    </div>
  );
}
