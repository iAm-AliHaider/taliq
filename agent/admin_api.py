"""Admin API bridge — exposes Neon Postgres data for the admin frontend.
Run alongside agent on port 8082."""

import json
import sys
sys.stdout.reconfigure(encoding='utf-8')

from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import database as db


class AdminHandler(BaseHTTPRequestHandler):
    def _cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def _json(self, data, code=200):
        self.send_response(code)
        self._cors()
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(data, default=str).encode())

    def do_OPTIONS(self):
        self.send_response(204)
        self._cors()
        self.end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        params = parse_qs(parsed.query)
        section = params.get("section", ["overview"])[0]

        try:
            handler = {
                "overview": self._overview,
                "employees": self._employees,
                "leaves": self._leaves,
                "loans": self._all_loans,
                "documents": self._documents,
                "announcements": self._announcements,
                "grievances": self._grievances,
                "training": self._training,
                "performance": self._performance,
                "policies": self._policies,
            }.get(section)
            if handler:
                self._json(handler())
            else:
                self._json({"error": "Unknown section"}, 404)
        except Exception as e:
            self._json({"error": str(e)}, 500)

    def do_POST(self):
        content_length = int(self.headers.get("Content-Length", 0))
        body = json.loads(self.rfile.read(content_length)) if content_length else {}
        parsed = urlparse(self.path)

        try:
            if parsed.path == "/api/admin/approve":
                self._json(self._approve(body))
            elif parsed.path == "/api/admin/reassign":
                self._json(self._reassign(body))
            elif parsed.path == "/api/admin/policy":
                self._json(self._update_policy(body))
            else:
                self._json({"error": "Unknown endpoint"}, 404)
        except Exception as e:
            self._json({"error": str(e)}, 500)

    def do_PUT(self):
        self.do_POST()

    # ── Helpers (psycopg2) ──

    def _query(self, sql, params=None):
        conn = db.get_db()
        c = conn.cursor()
        c.execute(sql, params or ())
        rows = db._fetchall(c)
        conn.close()
        return rows

    def _query_one(self, sql, params=None):
        conn = db.get_db()
        c = conn.cursor()
        c.execute(sql, params or ())
        row = db._fetchone(c)
        conn.close()
        return row

    def _scalar(self, sql, params=None):
        conn = db.get_db()
        c = conn.cursor()
        c.execute(sql, params or ())
        val = c.fetchone()[0]
        conn.close()
        return val

    # ── Section handlers ──

    def _overview(self):
        return {
            "totalEmployees": self._scalar("SELECT COUNT(*) FROM employees"),
            "departments": self._query("SELECT department, COUNT(*) as count FROM employees GROUP BY department ORDER BY count DESC"),
            "pendingLeaves": self._scalar("SELECT COUNT(*) FROM leave_requests WHERE status='pending'"),
            "activeLoans": self._scalar("SELECT COUNT(*) FROM loans WHERE status IN ('active','pending')"),
            "pendingDocuments": self._scalar("SELECT COUNT(*) FROM document_requests WHERE status IN ('requested','processing')"),
            "announcements": self._scalar("SELECT COUNT(*) FROM announcements"),
            "openGrievances": self._scalar("SELECT COUNT(*) FROM grievances WHERE status NOT IN ('resolved','closed')"),
            "pendingTravel": self._scalar("SELECT COUNT(*) FROM travel_requests WHERE status='pending'"),
        }

    def _employees(self):
        emps = self._query("SELECT * FROM employees ORDER BY id")
        result = []
        for d in emps:
            mgr = self._query_one("SELECT name FROM employees WHERE id = %s", (d["manager_id"],)) if d.get("manager_id") else None
            reports = self._query("SELECT id, name FROM employees WHERE manager_id = %s", (d["id"],))
            result.append({
                "id": d["id"], "name": d["name"], "nameAr": d.get("name_ar"),
                "position": d["position"], "department": d["department"],
                "email": d.get("email"), "phone": d.get("phone"),
                "joinDate": d.get("join_date"), "grade": d.get("grade"),
                "managerId": d.get("manager_id"),
                "managerName": mgr["name"] if mgr else None,
                "nationality": d.get("nationality"),
                "annualLeave": d.get("annual_leave"), "sickLeave": d.get("sick_leave"),
                "emergencyLeave": d.get("emergency_leave"), "studyLeave": d.get("study_leave"),
                "salary": d.get("basic_salary"), "housing": d.get("housing_allowance"),
                "transport": d.get("transport_allowance"),
                "totalSalary": (d.get("basic_salary") or 0) + (d.get("housing_allowance") or 0) + (d.get("transport_allowance") or 0),
                "directReports": [{"id": r["id"], "name": r["name"]} for r in reports],
                "isManager": len(reports) > 0,
            })
        return result

    def _leaves(self):
        return self._query("""
            SELECT lr.*, e.name as employee_name, e.department,
                   m.name as approver_name
            FROM leave_requests lr
            JOIN employees e ON lr.employee_id = e.id
            LEFT JOIN employees m ON lr.approver_id = m.id
            ORDER BY lr.created_at DESC
        """)

    def _all_loans(self):
        return self._query("""
            SELECT l.*, e.name as employee_name, e.department
            FROM loans l JOIN employees e ON l.employee_id = e.id
            ORDER BY l.created_at DESC
        """)

    def _documents(self):
        return self._query("""
            SELECT d.*, e.name as employee_name
            FROM document_requests d JOIN employees e ON d.employee_id = e.id
            ORDER BY d.created_at DESC
        """)

    def _announcements(self):
        return self._query("SELECT * FROM announcements ORDER BY created_at DESC")

    def _grievances(self):
        return self._query("""
            SELECT g.*, e.name as employee_name, e.department
            FROM grievances g JOIN employees e ON g.employee_id = e.id
            ORDER BY g.submitted_at DESC
        """)

    def _training(self):
        courses = self._query("SELECT * FROM training_courses ORDER BY mandatory DESC, title")
        enrollments = self._query("""
            SELECT et.*, tc.title, e.name as employee_name
            FROM employee_trainings et
            JOIN training_courses tc ON et.course_id = tc.id
            JOIN employees e ON et.employee_id = e.id
            ORDER BY et.enrollment_date DESC
        """)
        return {"courses": courses, "enrollments": enrollments}

    def _performance(self):
        reviews = self._query("""
            SELECT pr.*, e.name as employee_name, r.name as reviewer_name
            FROM performance_reviews pr
            JOIN employees e ON pr.employee_id = e.id
            LEFT JOIN employees r ON pr.reviewer_id = r.id
            ORDER BY pr.created_at DESC
        """)
        goals = self._query("""
            SELECT pg.*, e.name as employee_name
            FROM performance_goals pg
            JOIN employees e ON pg.employee_id = e.id
            ORDER BY pg.due_date
        """)
        return {"reviews": reviews, "goals": goals}

    def _policies(self):
        """Return all policies from the database, grouped by category."""
        return db.get_all_policies()

    def _approve(self, body):
        action_type = body.get("type")
        ref = body.get("ref")
        decision = body.get("decision")

        if not all([action_type, ref, decision]):
            return {"error": "Missing type, ref, or decision"}

        handlers = {
            "leave": lambda: db.approve_leave_request(ref, decision),
            "loan": lambda: db.approve_loan(ref, decision),
            "document": lambda: db.approve_document(ref, decision),
            "travel": lambda: db.approve_travel(ref, decision),
        }
        handler = handlers.get(action_type)
        if not handler:
            return {"error": f"Unknown type: {action_type}"}
        result = handler()
        return {"ok": True, "result": result} if result else {"error": "Not found"}

    def _reassign(self, body):
        emp_id = body.get("employeeId")
        new_mgr = body.get("newManagerId")
        if not emp_id or not new_mgr:
            return {"error": "Missing employeeId or newManagerId"}
        return db.reassign_employee(emp_id, new_mgr)

    def _update_policy(self, body):
        """Update a policy. Body: {category: "leave", config: {annual: 25, ...}}"""
        category = body.get("category")
        config = body.get("config")
        if not category or not config:
            return {"error": "Provide {category, config}"}
        return db.set_policy(category, config)

    def log_message(self, format, *args):
        pass


def start_admin_api(port=8082):
    server = HTTPServer(("0.0.0.0", port), AdminHandler)
    print(f"Admin API running on port {port}")
    server.serve_forever()


if __name__ == "__main__":
    start_admin_api()
