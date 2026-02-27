"""Admin API bridge — exposes SQLite data for the admin frontend.
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
            if section == "overview":
                self._json(self._overview())
            elif section == "employees":
                self._json(self._employees())
            elif section == "leaves":
                self._json(self._leaves())
            elif section == "loans":
                self._json(self._all_loans())
            elif section == "documents":
                self._json(self._documents())
            elif section == "announcements":
                self._json(self._announcements())
            elif section == "grievances":
                self._json(self._grievances())
            elif section == "training":
                self._json(self._training())
            elif section == "performance":
                self._json(self._performance())
            elif section == "policies":
                self._json(self._policies())
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
    
    def _overview(self):
        conn = db.get_db()
        total_emp = conn.execute("SELECT COUNT(*) FROM employees").fetchone()[0]
        depts = conn.execute("SELECT department, COUNT(*) as count FROM employees GROUP BY department ORDER BY count DESC").fetchall()
        pending_leaves = conn.execute("SELECT COUNT(*) FROM leave_requests WHERE status='pending'").fetchone()[0]
        active_loans = conn.execute("SELECT COUNT(*) FROM loans WHERE status IN ('active','pending')").fetchone()[0]
        pending_docs = conn.execute("SELECT COUNT(*) FROM document_requests WHERE status IN ('requested','processing')").fetchone()[0]
        anns = conn.execute("SELECT COUNT(*) FROM announcements").fetchone()[0]
        grievances = conn.execute("SELECT COUNT(*) FROM grievances WHERE status NOT IN ('resolved','closed')").fetchone()[0]
        pending_travel = conn.execute("SELECT COUNT(*) FROM travel_requests WHERE status='pending'").fetchone()[0]
        conn.close()
        return {
            "totalEmployees": total_emp,
            "departments": [{"name": d["department"], "count": d["count"]} for d in depts],
            "pendingLeaves": pending_leaves,
            "activeLoans": active_loans,
            "pendingDocuments": pending_docs,
            "announcements": anns,
            "openGrievances": grievances,
            "pendingTravel": pending_travel,
        }
    
    def _employees(self):
        conn = db.get_db()
        rows = conn.execute("SELECT * FROM employees ORDER BY id").fetchall()
        result = []
        for r in rows:
            d = dict(r)
            mgr = conn.execute("SELECT name FROM employees WHERE id=?", (d["manager_id"],)).fetchone() if d["manager_id"] else None
            reports = conn.execute("SELECT id, name FROM employees WHERE manager_id=?", (d["id"],)).fetchall()
            result.append({
                "id": d["id"], "name": d["name"], "nameAr": d["name_ar"],
                "position": d["position"], "department": d["department"],
                "email": d["email"], "phone": d["phone"],
                "joinDate": d["join_date"], "grade": d["grade"],
                "managerId": d["manager_id"],
                "managerName": mgr["name"] if mgr else None,
                "nationality": d["nationality"],
                "annualLeave": d["annual_leave"], "sickLeave": d["sick_leave"],
                "emergencyLeave": d["emergency_leave"], "studyLeave": d["study_leave"],
                "salary": d["basic_salary"], "housing": d["housing_allowance"],
                "transport": d["transport_allowance"],
                "totalSalary": d["basic_salary"] + d["housing_allowance"] + d["transport_allowance"],
                "directReports": [{"id": rr["id"], "name": rr["name"]} for rr in reports],
                "isManager": len(reports) > 0,
            })
        conn.close()
        return result
    
    def _leaves(self):
        conn = db.get_db()
        rows = conn.execute("""
            SELECT lr.*, e.name as employee_name, e.department,
                   m.name as approver_name
            FROM leave_requests lr
            JOIN employees e ON lr.employee_id = e.id
            LEFT JOIN employees m ON lr.approver_id = m.id
            ORDER BY lr.created_at DESC
        """).fetchall()
        conn.close()
        return [{
            "ref": r["ref"], "employeeId": r["employee_id"],
            "employeeName": r["employee_name"], "department": r["department"],
            "leaveType": r["leave_type"], "startDate": r["start_date"],
            "endDate": r["end_date"], "days": r["days"],
            "reason": r["reason"], "status": r["status"],
            "approverId": r["approver_id"], "approverName": r["approver_name"],
        } for r in rows]
    
    def _all_loans(self):
        conn = db.get_db()
        rows = conn.execute("""
            SELECT l.*, e.name as employee_name, e.department
            FROM loans l JOIN employees e ON l.employee_id = e.id
            ORDER BY l.created_at DESC
        """).fetchall()
        conn.close()
        return [{
            "ref": r["ref"], "employeeId": r["employee_id"],
            "employeeName": r["employee_name"], "department": r["department"],
            "loanType": r["loan_type"], "amount": r["amount"],
            "remaining": r["remaining"],
            "monthlyInstallment": r["monthly_installment"],
            "installmentsLeft": r["installments_left"],
            "status": r["status"],
        } for r in rows]
    
    def _documents(self):
        conn = db.get_db()
        rows = conn.execute("""
            SELECT d.*, e.name as employee_name
            FROM document_requests d JOIN employees e ON d.employee_id = e.id
            ORDER BY d.created_at DESC
        """).fetchall()
        conn.close()
        return [{
            "ref": r["ref"], "employeeId": r["employee_id"],
            "employeeName": r["employee_name"],
            "documentType": r["document_type"],
            "status": r["status"],
            "estimatedDate": r["estimated_date"],
        } for r in rows]
    
    def _announcements(self):
        conn = db.get_db()
        rows = conn.execute("SELECT * FROM announcements ORDER BY created_at DESC").fetchall()
        conn.close()
        return [{
            "id": r["id"], "title": r["title"], "content": r["content"],
            "author": r["author"], "priority": r["priority"],
            "date": r["created_at"],
        } for r in rows]
    
    def _grievances(self):
        conn = db.get_db()
        rows = conn.execute("""
            SELECT g.*, e.name as employee_name, e.department
            FROM grievances g JOIN employees e ON g.employee_id = e.id
            ORDER BY g.submitted_at DESC
        """).fetchall()
        conn.close()
        return [{
            "ref": r["ref"], "employeeId": r["employee_id"],
            "employeeName": r["employee_name"], "department": r["department"],
            "category": r["category"], "subject": r["subject"],
            "description": r["description"], "severity": r["severity"],
            "status": r["status"], "assignedTo": r["assigned_to"],
            "resolution": r["resolution"],
            "submittedAt": r["submitted_at"], "resolvedAt": r["resolved_at"],
        } for r in rows]
    
    def _training(self):
        conn = db.get_db()
        courses = conn.execute("SELECT * FROM training_courses ORDER BY mandatory DESC, title").fetchall()
        enrollments = conn.execute("""
            SELECT et.*, tc.title, e.name as employee_name
            FROM employee_trainings et
            JOIN training_courses tc ON et.course_id = tc.id
            JOIN employees e ON et.employee_id = e.id
            ORDER BY et.enrollment_date DESC
        """).fetchall()
        conn.close()
        return {
            "courses": [dict(c) for c in courses],
            "enrollments": [{
                "employeeName": e["employee_name"], "courseTitle": e["title"],
                "status": e["status"], "score": e["score"],
                "enrollmentDate": e["enrollment_date"],
            } for e in enrollments],
        }
    
    def _performance(self):
        conn = db.get_db()
        reviews = conn.execute("""
            SELECT pr.*, e.name as employee_name, r.name as reviewer_name
            FROM performance_reviews pr
            JOIN employees e ON pr.employee_id = e.id
            LEFT JOIN employees r ON pr.reviewer_id = r.id
            ORDER BY pr.created_at DESC
        """).fetchall()
        goals = conn.execute("""
            SELECT pg.*, e.name as employee_name
            FROM performance_goals pg
            JOIN employees e ON pg.employee_id = e.id
            ORDER BY pg.due_date
        """).fetchall()
        conn.close()
        return {
            "reviews": [{
                "employeeName": r["employee_name"], "reviewerName": r["reviewer_name"],
                "period": r["period"], "rating": r["rating"],
                "goalsMet": r["goals_met"], "totalGoals": r["total_goals"],
                "strengths": r["strengths"], "improvements": r["improvements"],
                "status": r["status"],
            } for r in reviews],
            "goals": [{
                "employeeName": g["employee_name"], "goal": g["goal"],
                "target": g["target"], "progress": g["progress"],
                "status": g["status"], "dueDate": g["due_date"],
            } for g in goals],
        }
    
    def _policies(self):
        """Return HR policies/configuration."""
        return {
            "leavePolicy": {
                "annual": {"default": 30, "description": "Annual leave entitlement per year"},
                "sick": {"default": 30, "description": "Sick leave per year"},
                "emergency": {"default": 5, "description": "Emergency leave per year"},
                "study": {"default": 15, "description": "Study leave per year"},
                "maxCarryOver": 5,
                "minNoticeDays": 3,
                "approvalRequired": True,
            },
            "loanPolicy": {
                "maxAmountMultiplier": 2,
                "maxEmiPercent": 33,
                "minServiceYears": 1,
                "approvalRequired": True,
                "types": ["Interest-Free", "Advance Salary", "Personal", "Emergency"],
            },
            "attendancePolicy": {
                "workStart": "08:00",
                "workEnd": "17:00",
                "lateThreshold": "08:30",
                "maxOvertimeHours": 4,
                "overtimeApproval": True,
            },
            "travelPolicy": {
                "perDiem": {
                    "chairman": {"international": 3500, "local": 2000},
                    "cLevel": {"international": 1750, "local": 1200},
                    "other": {"international": 1350, "local": 900},
                },
                "maxDays": 30,
                "approvalRequired": True,
            },
            "grievancePolicy": {
                "categories": ["harassment", "discrimination", "safety", "policy", "compensation", "other"],
                "severityLevels": ["low", "medium", "high", "critical"],
                "slaHours": {"low": 168, "medium": 72, "high": 24, "critical": 4},
            },
        }
    
    def _approve(self, body):
        """Handle approval actions from admin UI."""
        action_type = body.get("type")  # leave, loan, document, travel
        ref = body.get("ref")
        decision = body.get("decision")  # approved/rejected/ready
        
        if not all([action_type, ref, decision]):
            return {"error": "Missing type, ref, or decision"}
        
        if action_type == "leave":
            result = db.approve_leave_request(ref, decision)
        elif action_type == "loan":
            result = db.approve_loan(ref, decision)
        elif action_type == "document":
            result = db.approve_document(ref, decision)
        elif action_type == "travel":
            result = db.approve_travel(ref, decision)
        else:
            return {"error": f"Unknown type: {action_type}"}
        
        return {"ok": True, "result": result} if result else {"error": "Not found"}
    
    def _reassign(self, body):
        emp_id = body.get("employeeId")
        new_mgr = body.get("newManagerId")
        if not emp_id or not new_mgr:
            return {"error": "Missing employeeId or newManagerId"}
        return db.reassign_employee(emp_id, new_mgr)
    
    def _update_policy(self, body):
        # Policies are hardcoded for now - in production would be in a config table
        return {"ok": True, "message": "Policy updates would be saved to config table"}
    
    def log_message(self, format, *args):
        pass  # Suppress request logging


def start_admin_api(port=8082):
    server = HTTPServer(("0.0.0.0", port), AdminHandler)
    print(f"Admin API running on port {port}")
    server.serve_forever()


if __name__ == "__main__":
    start_admin_api()
