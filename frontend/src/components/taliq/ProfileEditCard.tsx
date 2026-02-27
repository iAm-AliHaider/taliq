"use client";

import { useState } from "react";

interface Props {
  name: string;
  nameAr?: string;
  position: string;
  department: string;
  email: string;
  phone: string;
  joinDate: string;
  employeeId: string;
  grade?: string;
  manager?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  bankIban?: string;
  maritalStatus?: string;
  nationality?: string;
  onAction?: (action: string, payload: Record<string, unknown>) => void;
}

export function ProfileEditCard({
  name, nameAr, position, department, email, phone, joinDate, employeeId,
  grade, manager, emergencyContact, emergencyPhone, bankIban, maritalStatus, nationality,
  onAction,
}: Props) {
  const [editPhone, setEditPhone] = useState(phone);
  const [editEmail, setEditEmail] = useState(email);
  const [editEmergencyContact, setEditEmergencyContact] = useState(emergencyContact || "");
  const [editEmergencyPhone, setEditEmergencyPhone] = useState(emergencyPhone || "");
  const [editIban, setEditIban] = useState(bankIban || "");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const initials = name.split(" ").map(n => n[0]).join("").slice(0, 2);
  const hasChanges = editPhone !== phone || editEmail !== email ||
    editEmergencyContact !== (emergencyContact || "") ||
    editEmergencyPhone !== (emergencyPhone || "") ||
    editIban !== (bankIban || "");

  const handleSave = () => {
    setSaving(true);
    onAction?.("update_profile", {
      phone: editPhone, email: editEmail,
      emergency_contact: editEmergencyContact, emergency_phone: editEmergencyPhone,
      bank_iban: editIban,
    });
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      setEditing(false);
      setTimeout(() => setSaved(false), 3000);
    }, 800);
  };

  return (
    <div className="card overflow-hidden">
      {/* Profile header */}
      <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 px-5 py-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
            <span className="text-xl font-bold text-white">{initials}</span>
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-white">{name}</h3>
            {nameAr && <p className="text-emerald-100 text-xs rtl">{nameAr}</p>}
            <p className="text-emerald-100 text-xs mt-0.5">{position}</p>
          </div>
          <span className="px-2 py-1 rounded-lg bg-white/20 text-white text-[10px] font-medium">{employeeId}</span>
        </div>
      </div>

      {/* Read-only info */}
      <div className="grid grid-cols-2 gap-px bg-gray-100">
        <InfoCell label="Department" value={department} />
        <InfoCell label="Grade" value={grade || "N/A"} />
        <InfoCell label="Join Date" value={joinDate} />
        <InfoCell label="Manager" value={manager || "N/A"} />
        {nationality && <InfoCell label="Nationality" value={nationality} />}
        {maritalStatus && <InfoCell label="Status" value={maritalStatus} />}
      </div>

      {/* Success banner */}
      {saved && (
        <div className="mx-4 mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
          <p className="text-xs font-semibold text-emerald-700">Profile updated successfully!</p>
        </div>
      )}

      {/* Editable section */}
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Personal Details</p>
          <button
            onClick={() => setEditing(!editing)}
            className={`px-3 py-1 rounded-lg text-[10px] font-semibold transition-all ${
              editing ? "bg-gray-100 text-gray-500" : "bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100"
            }`}
          >
            {editing ? "Cancel" : "Edit"}
          </button>
        </div>

        {editing ? (
          <div className="space-y-3 animate-slide-up">
            <EditField label="Phone" value={editPhone} onChange={setEditPhone} type="tel" placeholder="+966 5XX XXX XXXX" />
            <EditField label="Email" value={editEmail} onChange={setEditEmail} type="email" placeholder="name@company.com" />
            <EditField label="Emergency Contact" value={editEmergencyContact} onChange={setEditEmergencyContact} placeholder="Contact name" />
            <EditField label="Emergency Phone" value={editEmergencyPhone} onChange={setEditEmergencyPhone} type="tel" placeholder="+966 5XX XXX XXXX" />
            <EditField label="Bank IBAN" value={editIban} onChange={setEditIban} placeholder="SA..." />

            <button
              onClick={handleSave}
              disabled={!hasChanges || saving}
              className={`w-full py-2.5 rounded-xl text-xs font-semibold transition-all active:scale-[0.98] ${
                hasChanges && !saving
                  ? "bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/20"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <DisplayField label="Phone" value={phone} />
            <DisplayField label="Email" value={email} />
            {emergencyContact && <DisplayField label="Emergency" value={emergencyContact} />}
            {bankIban && <DisplayField label="IBAN" value={`...${bankIban.slice(-4)}`} />}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="px-4 pb-4 flex gap-2">
        <button
          onClick={() => onAction?.("show_pay_slip", {})}
          className="flex-1 py-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold hover:bg-blue-100 active:scale-[0.98] transition-all"
        >
          Pay Slip
        </button>
        <button
          onClick={() => onAction?.("check_leave_balance", {})}
          className="flex-1 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold hover:bg-emerald-100 active:scale-[0.98] transition-all"
        >
          Leave
        </button>
        <button
          onClick={() => onAction?.("request_document", { document_type: "Salary Certificate" })}
          className="flex-1 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold hover:bg-amber-100 active:scale-[0.98] transition-all"
        >
          Documents
        </button>
      </div>
    </div>
  );
}

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white p-3">
      <p className="text-[10px] text-gray-400 uppercase tracking-wider">{label}</p>
      <p className="text-xs font-semibold text-gray-800 mt-0.5">{value}</p>
    </div>
  );
}

function DisplayField({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <p className="text-[10px] text-gray-400 uppercase">{label}</p>
      <p className="text-xs font-medium text-gray-700 truncate">{value}</p>
    </div>
  );
}

function EditField({ label, value, onChange, type = "text", placeholder }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string;
}) {
  return (
    <div>
      <label className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold block mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-800 placeholder:text-gray-300 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-200 transition-all"
      />
    </div>
  );
}
