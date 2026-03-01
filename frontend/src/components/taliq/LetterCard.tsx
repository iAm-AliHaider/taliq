"use client";

import { generateLetterPDFFromTemplate } from "@/lib/pdf";

interface Props {
  ref?: string;
  letterType: string;
  employeeName: string;
  employeeId: string;
  position: string;
  department: string;
  joinDate: string;
  nationality?: string;
  totalSalary: number;
  basicSalary: number;
  housingAllowance: number;
  transportAllowance: number;
  grade?: string;
  letterDate: string;
  purpose?: string;
  addressedTo?: string;
  onAction?: (action: string, payload: Record<string, unknown>) => void;
}

const TYPE_LABELS: Record<string, string> = {
  employment_certificate: "Employment Certificate",
  salary_certificate: "Salary Certificate",
  experience_letter: "Experience Letter",
  noc_letter: "No Objection Certificate (NOC)",
  bank_letter: "Bank Letter",
  promotion_letter: "Promotion Letter",
};

const LETTER_BODIES: Record<string, (p: Props) => string> = {
  employment_certificate: (p) => `This is to certify that <strong>${p.employeeName}</strong> (Employee ID: ${p.employeeId}) has been employed at our organization as <strong>${p.position}</strong> in the <strong>${p.department}</strong> department since <strong>${p.joinDate}</strong>.<br/><br/>This certificate is issued upon the employee's request${p.purpose ? ` for the purpose of ${p.purpose}` : ""}.`,
  salary_certificate: (p) => `This is to certify that <strong>${p.employeeName}</strong> (Employee ID: ${p.employeeId}) is employed as <strong>${p.position}</strong> in the <strong>${p.department}</strong> department.<br/><br/>The employee's monthly compensation is as follows:<br/>Basic Salary: <strong>${p.basicSalary?.toLocaleString()} SAR</strong><br/>Housing Allowance: <strong>${p.housingAllowance?.toLocaleString()} SAR</strong><br/>Transport Allowance: <strong>${p.transportAllowance?.toLocaleString()} SAR</strong><br/>Total Monthly Salary: <strong>${p.totalSalary?.toLocaleString()} SAR</strong><br/><br/>This certificate is issued upon the employee's request${p.purpose ? ` for the purpose of ${p.purpose}` : ""}.`,
  experience_letter: (p) => `This is to certify that <strong>${p.employeeName}</strong> (Employee ID: ${p.employeeId}) has been working with our organization since <strong>${p.joinDate}</strong> as <strong>${p.position}</strong> in the <strong>${p.department}</strong> department.<br/><br/>During their tenure, they have demonstrated excellent professional conduct and competence. We wish them continued success in their future endeavors.`,
  noc_letter: (p) => `This is to confirm that we have No Objection to <strong>${p.employeeName}</strong> (Employee ID: ${p.employeeId}), currently employed as <strong>${p.position}</strong> in the <strong>${p.department}</strong> department${p.purpose ? `, for the purpose of ${p.purpose}` : ""}.<br/><br/>This NOC is issued at the employee's request and does not relieve them of their contractual obligations.`,
  bank_letter: (p) => `This is to confirm that <strong>${p.employeeName}</strong> (Employee ID: ${p.employeeId}) is a full-time employee of our organization, serving as <strong>${p.position}</strong> in the <strong>${p.department}</strong> department since <strong>${p.joinDate}</strong>.<br/><br/>Their total monthly salary is <strong>${p.totalSalary?.toLocaleString()} SAR</strong>, credited directly to their bank account via WPS.<br/><br/>This letter is issued for banking purposes at the employee's request.`,
  promotion_letter: (p) => `We are pleased to confirm that <strong>${p.employeeName}</strong> (Employee ID: ${p.employeeId}) has been promoted to the position of <strong>${p.position}</strong> in the <strong>${p.department}</strong> department, effective immediately.<br/><br/>We recognize their dedication and contributions to the organization.`,
};

export function LetterCard(props: Props) {
  const label = TYPE_LABELS[props.letterType] || props.letterType;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden animate-[slideUp_0.2s_ease-out]">
      <div className="px-5 py-4 bg-gradient-to-r from-indigo-50 to-blue-50 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">{label}</h3>
              {props.ref && <p className="text-[10px] text-gray-400">{props.ref}</p>}
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-medium text-emerald-700">Generated</span>
        </div>
      </div>

      <div className="p-5 space-y-4">
        <div className="text-right text-xs text-gray-500">{props.letterDate}</div>
        {props.addressedTo && (
          <div><p className="text-xs text-gray-400">To</p><p className="text-sm font-medium text-gray-800">{props.addressedTo}</p></div>
        )}
        <div className="bg-gray-50 rounded-xl p-4 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div><span className="text-[10px] text-gray-400 block">Employee</span><span className="text-sm font-semibold text-gray-900">{props.employeeName}</span></div>
            <div><span className="text-[10px] text-gray-400 block">ID</span><span className="text-sm font-semibold text-gray-900">{props.employeeId}</span></div>
            <div><span className="text-[10px] text-gray-400 block">Position</span><span className="text-sm text-gray-700">{props.position}</span></div>
            <div><span className="text-[10px] text-gray-400 block">Department</span><span className="text-sm text-gray-700">{props.department}</span></div>
            <div><span className="text-[10px] text-gray-400 block">Join Date</span><span className="text-sm text-gray-700">{props.joinDate}</span></div>
            {props.nationality && <div><span className="text-[10px] text-gray-400 block">Nationality</span><span className="text-sm text-gray-700">{props.nationality}</span></div>}
          </div>
          {(props.letterType === "salary_certificate" || props.letterType === "bank_letter") && (
            <div className="border-t border-gray-200 pt-2 mt-2">
              <p className="text-[10px] text-gray-400 uppercase font-semibold mb-1">Salary Details</p>
              <div className="grid grid-cols-2 gap-2">
                <div><span className="text-[10px] text-gray-400">Basic</span><span className="text-sm font-bold text-gray-900 block">{props.basicSalary?.toLocaleString()} SAR</span></div>
                <div><span className="text-[10px] text-gray-400">Housing</span><span className="text-sm font-bold text-gray-900 block">{props.housingAllowance?.toLocaleString()} SAR</span></div>
                <div><span className="text-[10px] text-gray-400">Transport</span><span className="text-sm font-bold text-gray-900 block">{props.transportAllowance?.toLocaleString()} SAR</span></div>
                <div><span className="text-[10px] text-gray-400">Total</span><span className="text-sm font-bold text-emerald-600 block">{props.totalSalary?.toLocaleString()} SAR</span></div>
              </div>
            </div>
          )}
        </div>
        {props.purpose && <div className="text-xs text-gray-500"><span className="font-medium">Purpose:</span> {props.purpose}</div>}
        <button onClick={() => generateLetterPDFFromTemplate(props)} className="w-full py-2.5 rounded-xl bg-indigo-500 text-white text-sm font-semibold hover:bg-indigo-600 transition-colors flex items-center justify-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          Download PDF
        </button>
      </div>
    </div>
  );
}
