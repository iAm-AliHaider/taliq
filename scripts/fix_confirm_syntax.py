import pathlib
f = pathlib.Path(r"C:\Users\AI\.openclaw\workspace\taliq\frontend\src\app\admin\page.tsx")
src = f.read_text("utf-8")
# Fix the malformed confirm injection (missing closing )} before className)
src = src.replace(
    "{ if(!window.confirm('Delete this announcement?')) return; handleDeleteAnnouncement(a.id)} className",
    "{ if(!window.confirm('Delete this announcement?')) return; handleDeleteAnnouncement(a.id); }} className"
)
f.write_text(src, "utf-8")
print("Fixed confirm dialog syntax")
