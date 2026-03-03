import pathlib
f = pathlib.Path(r"C:\Users\AI\.openclaw\workspace\taliq\frontend\src\app\admin\page.tsx")
src = f.read_text("utf-8")

# Remove the broken placement (extra </div> + misplaced DashboardCharts)
OLD = (
    '          </div>\n'               # closes space-y-5 (wrong position)
    '          <DashboardCharts data={dashboardData} />\n'
    '        </div>\n'                  # mismatched extra
    '        )}\n'
)
# Correct: DashboardCharts inside space-y-5, then close space-y-5, then )}
NEW = (
    '            <DashboardCharts data={dashboardData} />\n'
    '          </div>\n'               # closes space-y-5
    '        )}\n'
)

if OLD in src:
    src = src.replace(OLD, NEW)
    f.write_text(src, "utf-8")
    print("Fixed DashboardCharts placement v2")
else:
    # Show context to debug
    idx = src.find('<DashboardCharts data={dashboardData}')
    if idx >= 0:
        print("Found DashboardCharts, showing 200 chars around it:")
        print(repr(src[idx-100:idx+100]))
    else:
        print("DashboardCharts not found!")
