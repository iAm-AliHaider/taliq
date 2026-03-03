"""Fix bugs with precise surgical replacements"""
import pathlib

f = pathlib.Path(r"C:\Users\AI\.openclaw\workspace\taliq\frontend\src\app\api\admin\route.ts")
src = f.read_text("utf-8")

# Bug 1: announcements uses a.applied_at (should be a.created_at)
# The announcement query is the one with COALESCE and announce_on_login
OLD1 = "FROM announcements a ORDER BY a.applied_at DESC"
NEW1 = "FROM announcements a ORDER BY a.created_at DESC"
if OLD1 in src:
    src = src.replace(OLD1, NEW1, 1)
    print("Fix 1: announcements a.applied_at -> a.created_at OK")
else:
    print(f"Fix 1: NOT FOUND - looking for similar...")
    idx = src.find("FROM announcements a ORDER BY")
    if idx > 0:
        print(repr(src[idx:idx+60]))

# Bug 2: recruitment/job_applications uses a.created_at (should be a.applied_at)
# The job_applications query joins job_postings
OLD2 = "FROM job_applications a LEFT JOIN job_postings j ON a.job_id = j.id ORDER BY a.created_at DESC"
NEW2 = "FROM job_applications a LEFT JOIN job_postings j ON a.job_id = j.id ORDER BY a.applied_at DESC"
if OLD2 in src:
    src = src.replace(OLD2, NEW2, 1)
    print("Fix 2: job_applications a.created_at -> a.applied_at OK")
else:
    print("Fix 2: already fixed or not found")

f.write_text(src, "utf-8")
print("Done")
