"""Tool modules — all tools are imported here for agent.py."""

from tools.core import (
    get_current_employee_id_from_context,
    set_current_employee_id,
    set_room_ref,
    get_room_ref,
    set_session_ref,
    get_session_ref,
    _send_ui,
    DEFAULT_EMPLOYEE_ID,
)

from tools.forms import (
    show_leave_form,
    show_document_form,
    show_loan_form,
    show_travel_form,
    show_profile_edit,
)

from tools.employee import (
    check_leave_balance,
    show_my_leave_requests,
    show_my_profile,
    show_pay_slip,
    check_loan_eligibility,
    show_loan_balance,
    show_my_documents,
    show_announcements,
    show_team_attendance,
    show_status,
    apply_for_leave,
    apply_for_loan,
    request_document,
    create_travel_request,
    show_my_requests,
)

from tools.attendance import (
    clock_me_in,
    clock_me_out,
    show_my_attendance,
    request_overtime_approval,
)

from tools.interview import (
    start_new_interview,
    score_current_answer,
    show_interview_results,
)

from tools.performance import (
    show_training_calendar,
    show_course_materials,
    show_my_performance,
    create_performance_review,
    show_my_goals,
    set_new_goal,
    update_goal,
    show_available_trainings,
    enroll_in_training,
    show_my_trainings,
    file_grievance,
    show_my_grievances,
    show_notifications,
    acknowledge_announcement,
)

from tools.manager import (
    show_pending_approvals,
    approve_leave,
    show_team_overview,
    show_department_stats,
    show_leave_calendar,
    show_dashboard,
    show_leave_history,
    approve_loan_request,
    approve_travel_request,
    approve_overtime_request,
    approve_document_request,
    show_team_grievances,
    resolve_team_grievance,
    show_team_performance,
    show_team_training_compliance,
    show_all_pending_approvals,
    show_leave_analytics,
    show_headcount_report,
    reassign_team_member,
    show_employee_details,
)

from tools.expenses import (
    submit_expense,
    show_my_expenses,
    show_expense_form,
    approve_expense_request,
    show_pending_expenses,
    submit_claim,
    show_my_claims,
    show_claim_form,
    approve_claim_request,
    show_pending_claims,
    show_my_payments,
    show_all_payments_admin,
)

from tools.gosi import (
    show_gosi_breakdown,
    show_end_of_service,
)

from tools.modules import (
    generate_letter,
    show_my_letters,
    show_my_contract,
    show_expiring_contracts,
    show_my_assets,
    show_all_assets,
    show_my_shift,
    show_team_shifts,
    show_hr_report,
    show_payroll_summary,
    search_directory,
    show_org_chart,
    show_my_iqama_visa,
    show_expiring_documents,
    initiate_exit_request,
    show_exit_status,
    show_all_exits,
)

from tools.admin_ops import (
    view_audit_log,
    bulk_approve_pending_leaves,
    bulk_approve_pending_expenses,
    send_pending_notifications,
)

from tools.recruitment import (
    list_job_postings,
    view_job_details,
    create_job_posting,
    list_applications,
    advance_candidate,
    show_recruitment_stats,
    close_job_posting,
)

from tools.geofencing import (
    clock_in_gps,
    clock_out_gps,
    list_office_locations,
    manage_geofence,
)

from tools.approvals import (
    view_pending_approvals,
    approve_request,
    reject_request,
    view_approval_chain,
    show_approval_workflows,
)
