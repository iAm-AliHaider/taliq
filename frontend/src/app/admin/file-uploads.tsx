"use client";
import { useState, useRef } from "react";

type Upload = {
  id: number; employee_id: string; employee_name: string; filename: string;
  mime_type: string; size_bytes: number; category: string; description: string;
  uploaded_by: string; created_at: string;
};
type UploadStat = { category: string; cnt: number; total_size: number };

const CATEGORIES = ["general","contract","identity","education","certificate","medical","iqama","other"];
const CAT_COLORS: Record<string, string> = {
  contract: "bg-blue-50 text-blue-700",
  identity: "bg-emerald-50 text-emerald-700",
  education: "bg-violet-50 text-violet-700",
  certificate: "bg-amber-50 text-amber-700",
  medical: "bg-red-50 text-red-600",
  iqama: "bg-orange-50 text-orange-700",
  general: "bg-slate-100 text-slate-600",
  other: "bg-slate-100 text-slate-500",
};

function fileIcon(mime: string) {
  if (mime?.includes("pdf")) return (
    <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>
  );
  if (mime?.includes("image")) return (
    <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
  );
  return (
    <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
  );
}

function fmtSize(bytes: number) {
  if (!bytes) return "—";
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${Math.round(bytes / 1024)} KB`;
}

export default function FileUploads({
  data, employees, onRefresh,
}: {
  data: { uploads: Upload[]; stats: UploadStat[] } | null;
  employees: any[];
  onRefresh: () => void;
}) {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState("");
  const [filterCat, setFilterCat] = useState("all");
  const [filterEmp, setFilterEmp] = useState("all");
  const [form, setForm] = useState({ employee_id: "", category: "general", description: "" });
  const fileRef = useRef<HTMLInputElement>(null);

  const uploads = data?.uploads || [];
  const stats = data?.stats || [];
  const totalSize = stats.reduce((a, s) => a + Number(s.total_size || 0), 0);

  const filtered = uploads.filter(u => {
    if (filterCat !== "all" && u.category !== filterCat) return false;
    if (filterEmp !== "all" && u.employee_id !== filterEmp) return false;
    return true;
  });

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setMsg("");
    let success = 0;
    for (const file of Array.from(files)) {
      const b64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(",")[1] || "");
        reader.readAsDataURL(file);
      });
      const r = await fetch("/api/admin?action=upload_file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employee_id: form.employee_id || null,
          filename: file.name,
          mime_type: file.type,
          size_bytes: file.size,
          category: form.category,
          description: form.description || file.name,
          data_b64: b64,
          uploaded_by: "admin",
        }),
      }).then(r => r.json());
      if (r.ok) success++;
    }
    setMsg(`Uploaded ${success} file${success !== 1 ? "s" : ""} successfully`);
    setTimeout(() => setMsg(""), 4000);
    setUploading(false);
    onRefresh();
  }

  async function deleteUpload(id: number, name: string) {
    if (!window.confirm(`Delete "${name}"?`)) return;
    await fetch("/api/admin?action=delete_upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    onRefresh();
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Document Manager</h2>
          <p className="text-xs text-gray-500 mt-0.5">{uploads.length} documents · {fmtSize(totalSize)} total</p>
        </div>
        {msg && <span className="text-xs text-emerald-600 font-semibold bg-emerald-50 px-3 py-1 rounded-full">{msg}</span>}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
        {CATEGORIES.slice(0,6).map(cat => {
          const s = stats.find(s => s.category === cat);
          return (
            <button key={cat} onClick={() => setFilterCat(filterCat === cat ? "all" : cat)}
              className={`rounded-xl border p-2 text-center transition ${filterCat === cat ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-white hover:border-slate-300"}`}>
              <div className="text-lg font-black text-slate-800">{s?.cnt || 0}</div>
              <div className="text-[9px] text-slate-400 capitalize">{cat}</div>
            </button>
          );
        })}
      </div>

      {/* Upload zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
        className={`rounded-2xl border-2 border-dashed p-6 text-center transition-all cursor-pointer ${dragOver ? "border-emerald-400 bg-emerald-50" : "border-slate-200 bg-white hover:border-emerald-300 hover:bg-slate-50"}`}
        onClick={() => fileRef.current?.click()}
      >
        <input ref={fileRef} type="file" className="hidden" multiple accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xlsx"
          onChange={e => handleFiles(e.target.files)} />
        <svg className="w-8 h-8 text-slate-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
        </svg>
        {uploading ? (
          <p className="text-sm text-emerald-600 font-semibold">Uploading...</p>
        ) : (
          <>
            <p className="text-sm font-semibold text-slate-600">Drop files here or click to browse</p>
            <p className="text-xs text-slate-400 mt-1">PDF, JPG, PNG, Word, Excel up to 10 MB each</p>
          </>
        )}
      </div>

      {/* Upload options */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 grid grid-cols-3 gap-3">
        <div>
          <label className="text-xs text-slate-400 font-medium">Assign to Employee</label>
          <select value={form.employee_id} onChange={e => setForm({...form, employee_id: e.target.value})}
            className="mt-1 w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400">
            <option value="">General / No employee</option>
            {employees.map((e: any) => <option key={e.id} value={e.id}>{e.id} — {e.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-400 font-medium">Category</label>
          <select value={form.category} onChange={e => setForm({...form, category: e.target.value})}
            className="mt-1 w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400">
            {CATEGORIES.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-400 font-medium">Description (optional)</label>
          <input value={form.description} onChange={e => setForm({...form, description: e.target.value})}
            placeholder="e.g. National ID scan" className="mt-1 w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400"/>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap items-center">
        <span className="text-xs text-slate-400 font-medium">Filter by employee:</span>
        <select value={filterEmp} onChange={e => setFilterEmp(e.target.value)}
          className="px-2 py-1 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400">
          <option value="all">All employees</option>
          {employees.map((e: any) => <option key={e.id} value={e.id}>{e.id} — {e.name}</option>)}
        </select>
        {(filterCat !== "all" || filterEmp !== "all") && (
          <button onClick={() => { setFilterCat("all"); setFilterEmp("all"); }}
            className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1 rounded-lg border border-slate-200 hover:bg-slate-50">
            Clear filters
          </button>
        )}
        <span className="text-xs text-slate-400 ml-auto">{filtered.length} of {uploads.length} documents</span>
      </div>

      {/* File list */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-300">
            <svg className="w-10 h-10 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            <p className="text-sm">No documents found</p>
          </div>
        ) : (
          <table className="w-full text-xs">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold">
              <tr>
                <th className="px-4 py-2.5 text-left">File</th>
                <th className="px-4 py-2.5 text-left">Employee</th>
                <th className="px-4 py-2.5 text-left">Category</th>
                <th className="px-4 py-2.5 text-right">Size</th>
                <th className="px-4 py-2.5 text-left">Uploaded</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(u => (
                <tr key={u.id} className="hover:bg-slate-50 transition">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {fileIcon(u.mime_type)}
                      <div>
                        <div className="font-medium text-slate-800 truncate max-w-[200px]">{u.filename}</div>
                        {u.description && u.description !== u.filename && (
                          <div className="text-[10px] text-slate-400 truncate max-w-[200px]">{u.description}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {u.employee_name ? (
                      <div>
                        <span className="font-semibold text-slate-700">{u.employee_name}</span>
                        <span className="text-slate-400 ml-1">({u.employee_id})</span>
                      </div>
                    ) : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${CAT_COLORS[u.category] || CAT_COLORS.general}`}>
                      {u.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-slate-500">{fmtSize(u.size_bytes)}</td>
                  <td className="px-4 py-3 text-slate-400">{String(u.created_at || "").slice(0,10)}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => deleteUpload(u.id, u.filename)}
                      className="text-slate-300 hover:text-red-400 transition p-1 rounded hover:bg-red-50">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Storage note */}
      <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-700 flex items-start gap-2">
        <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        <div>
          <strong>Storage mode:</strong> Files stored as base64 in Postgres (development mode). Set <code className="bg-amber-100 px-1 rounded">BLOB_READ_WRITE_TOKEN</code> in Vercel environment to switch to Vercel Blob CDN storage for production performance.
        </div>
      </div>
    </div>
  );
}
