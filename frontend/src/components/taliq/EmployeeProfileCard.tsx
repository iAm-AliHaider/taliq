"use client";

interface EmployeeProfileCardProps {
  name: string;
  nameAr: string;
  position: string;
  department: string;
  email: string;
  phone: string;
  joinDate: string;
  employeeId: string;
}

export function EmployeeProfileCard({ name, nameAr, position, department, email, phone, joinDate, employeeId }: EmployeeProfileCardProps) {
  return (
    <div className="p-5">
      {/* Avatar + Name */}
      <div className="flex items-center gap-4 mb-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-amber-500/20 border border-emerald-500/20 flex items-center justify-center">
          <span className="text-xl font-bold text-emerald-400">{name.charAt(0)}</span>
        </div>
        <div>
          <h3 className="text-white font-semibold text-sm">{name}</h3>
          <p className="text-zinc-500 text-xs font-arabic rtl">{nameAr}</p>
          <p className="text-emerald-400 text-xs mt-0.5">{position}</p>
        </div>
      </div>

      {/* Details */}
      <div className="space-y-2.5">
        <InfoRow icon="🏢" label="Department" value={department} />
        <InfoRow icon="🪪" label="Employee ID" value={employeeId} />
        <InfoRow icon="📧" label="Email" value={email} />
        <InfoRow icon="📱" label="Phone" value={phone} />
        <InfoRow icon="📅" label="Joined" value={joinDate} />
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/5">
      <span className="text-sm">{icon}</span>
      <span className="text-[10px] text-zinc-500 w-20">{label}</span>
      <span className="text-xs text-zinc-200 ml-auto text-right">{value}</span>
    </div>
  );
}
