import pathlib
f = pathlib.Path(r"C:\Users\AI\.openclaw\workspace\taliq\frontend\src\app\admin\page.tsx")
src = f.read_text("utf-8")

# Current broken state — DashboardCharts is outside the space-y-5 div
OLD = (
    '            </div>\n'
    '          </div>\n'
    '          <DashboardCharts data={dashboardData} />\n'
    '        )}\n'
    '\n'
    '        {/* EMPLOYEES with Manager Assignment */}'
)

# Correct — DashboardCharts inside space-y-5 (before the closing </div>)
NEW = (
    '            </div>\n'
    '          </div>\n'
    '          <DashboardCharts data={dashboardData} />\n'
    '        </div>\n'           # ← closes space-y-5
    '        )}\n'
    '\n'
    '        {/* EMPLOYEES with Manager Assignment */}'
)

if OLD in src:
    src = src.replace(OLD, NEW)
    f.write_text(src, "utf-8")
    print("Fixed DashboardCharts placement")
else:
    # Maybe the space-y-5 closing div is different indentation
    # Let's just find and fix manually
    marker = '<DashboardCharts data={dashboardData} />'
    idx = src.find(marker)
    if idx > 0:
        print(f"Found DashboardCharts at char {idx}")
        print(repr(src[idx-5:idx+120]))
    else:
        print("Not found at all!")
