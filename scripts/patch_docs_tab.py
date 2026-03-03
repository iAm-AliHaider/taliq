import pathlib
f = pathlib.Path(r"C:\Users\AI\.openclaw\workspace\taliq\frontend\src\app\admin\page.tsx")
src = f.read_text("utf-8")

OLD = '''        {tab === "Documents" && (
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100"><h3 className="text-sm font-semibold text-gray-800">Document Requests</h3></div>
            <div className="divide-y divide-gray-50">
              {documents.map(d => (
                <div key={d.ref} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50/50">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{d.employeeName}</p>
                    <p className="text-[10px] text-gray-400">{d.ref} - {d.documentType}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={d.status} />
                    {d.status !== "ready" && d.status !== "rejected" && (
                      <div className="flex gap-1">
                        <button onClick={() => handleApprove("document", d.ref, "ready")}
                          className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-[10px] text-emerald-600">Ready</button>
                        <button onClick={() => handleApprove("document", d.ref, "rejected")}
                          className="px-2 py-0.5 rounded bg-red-50 border border-red-200 text-[10px] text-red-600">Reject</button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {documents.length === 0 && <div className="px-5 py-8 text-center text-gray-400 text-sm">No document requests</div>}
            </div>
          </div>
        )}'''

NEW = '''        {tab === "Documents" && (
          <div className="space-y-5">
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100"><h3 className="text-sm font-semibold text-gray-800">Document Requests (Approvals)</h3></div>
              <div className="divide-y divide-gray-50">
                {documents.map(d => (
                  <div key={d.ref} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50/50">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{d.employeeName}</p>
                      <p className="text-[10px] text-gray-400">{d.ref} - {d.documentType}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={d.status} />
                      {d.status !== "ready" && d.status !== "rejected" && (
                        <div className="flex gap-1">
                          <button onClick={() => handleApprove("document", d.ref, "ready")}
                            className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-[10px] text-emerald-600">Ready</button>
                          <button onClick={() => handleApprove("document", d.ref, "rejected")}
                            className="px-2 py-0.5 rounded bg-red-50 border border-red-200 text-[10px] text-red-600">Reject</button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {documents.length === 0 && <div className="px-5 py-8 text-center text-gray-400 text-sm">No document requests</div>}
              </div>
            </div>
            <FileUploads
              data={uploadsData}
              employees={employees}
              onRefresh={() => adminFetch("section=uploads").then(d => d && setUploadsData(d))}
            />
          </div>
        )}'''

if OLD in src:
    src = src.replace(OLD, NEW)
    f.write_text(src, "utf-8")
    print("Patched Documents tab")
else:
    print("ERROR: exact match not found - need to check whitespace/encoding")
    # Debug: show what we have
    doc_idx = src.find('tab === "Documents"')
    print(f"Documents tab found at char {doc_idx}")
    print(repr(src[doc_idx:doc_idx+100]))
