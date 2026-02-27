"use client";

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
}

export function EmployeeProfileCard({ name, nameAr, position, department, email, phone, joinDate, employeeId, grade, manager }: Props) {
  const initials = name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  
  return (
    <div className="card overflow-hidden">
      {/* Header with gradient */}
      <div className="h-20 bg-gradient-to-r from-emerald-500 to-emerald-600 relative">
        <div className="absolute -bottom-8 left-5">
          <div className="w-16 h-16 rounded-2xl bg-white border-4 border-white shadow-lg flex items-center justify-center">
            <span className="text-lg font-bold text-emerald-600">{initials}</span>
          </div>
        </div>
      </div>

      <div className="pt-12 pb-5 px-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-gray-900">{name}</h3>
            {nameAr && <p className="text-xs text-gray-400 font-arabic rtl">{nameAr}</p>}
            <p className="text-sm text-emerald-600 font-medium mt-0.5">{position}</p>
          </div>
          <span className="badge badge-emerald">{employeeId}</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <InfoRow icon="🏢" label="Department" value={department} />
          <InfoRow icon="📧" label="Email" value={email} />
          <InfoRow icon="📱" label="Phone" value={phone} />
          <InfoRow icon="📅" label="Joined" value={joinDate} />
          {grade && <InfoRow icon="📊" label="Grade" value={grade} />}
          {manager && <InfoRow icon="👤" label="Manager" value={manager} />}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2 p-2 rounded-lg bg-gray-50">
      <span className="text-sm">{icon}</span>
      <div className="min-w-0">
        <p className="text-[10px] text-gray-400 uppercase tracking-wider">{label}</p>
        <p className="text-xs font-medium text-gray-700 truncate">{value}</p>
      </div>
    </div>
  );
}
