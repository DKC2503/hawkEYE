import React, { useState, useEffect } from 'react';
import { AuthorityShell } from '../components/layout/AuthorityShell';
import type { MunicipalEmployee } from '../types/authority';
import { GlassDropdown, type GlassDropdownOption } from '../../components/ui/GlassDropdown';

import { API_BASE_URL } from '../../config/api';

const MUNICIPAL_DEPARTMENTS = [
  "Roads & Infrastructure",
  "Sanitation & Waste Management",
  "Water Supply & Drainage",
  "Public Lighting & Electrical",
  "Traffic & Transit Works",
  "Parks & Public Spaces",
  "General Municipal Services",
];

const availabilityOptions: GlassDropdownOption[] = [
  { value: 'all', label: 'All Availability Statuses' },
  { value: 'AVAILABLE', label: 'Available for Dispatch' },
  { value: 'ASSIGNED', label: 'On Duty / Assigned' },
  { value: 'ON_LEAVE', label: 'On Leave' },
  { value: 'INACTIVE', label: 'Inactive / Deactivated' },
];

export const WorkersPage: React.FC = () => {
  const [employees, setEmployees] = useState<MunicipalEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [availabilityFilter, setAvailabilityFilter] = useState('all');

  // Form state for Add Employee
  const [fullName, setFullName] = useState('');
  const [employeeCode, setEmployeeCode] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState(MUNICIPAL_DEPARTMENTS[0]);
  const [role, setRole] = useState('Senior Asphalt Specialist');
  const [shiftName, setShiftName] = useState('Morning Shift');
  const [shiftStart, setShiftStart] = useState('06:00 AM');
  const [shiftEnd, setShiftEnd] = useState('02:00 PM');
  const [serviceArea, setServiceArea] = useState('Madhurawada Zone');
  const [skillInput, setSkillInput] = useState('pothole_repair, road_patching');

  const fetchEmployees = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/employees?active_only=false`);
      if (res.ok) {
        const data = await res.json();
        setEmployees(data.employees || []);
      }
    } catch {
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    try {
      const skillsArray = skillInput.split(',').map((s) => s.trim()).filter(Boolean);
      const res = await fetch(`${API_BASE_URL}/api/employees`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Authority-Role': 'authority',
        },
        body: JSON.stringify({
          fullName,
          employeeCode,
          email,
          phone,
          department,
          role,
          skills: skillsArray,
          shift: {
            name: shiftName,
            startTime: shiftStart,
            endTime: shiftEnd,
          },
          serviceArea,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to register employee.');
      }

      setFullName('');
      setEmployeeCode('');
      setEmail('');
      setPhone('');
      setShowAddModal(false);
      fetchEmployees();
    } catch (err: any) {
      setFormError(err.message || 'Employee registration failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (emp: MunicipalEmployee) => {
    try {
      const targetId = emp.employeeId || emp.employeeCode;
      const nextActive = !emp.isActive;
      const res = await fetch(`${API_BASE_URL}/api/employees/${targetId}/status?isActive=${nextActive}`, {
        method: 'PATCH',
        headers: {
          'X-Authority-Role': 'authority',
        },
      });
      if (res.ok) {
        fetchEmployees();
      }
    } catch {
      // Handled cleanly
    }
  };

  const filteredEmployees = employees.filter((emp) => {
    const nameStr = (emp.fullName || emp.name || '').toLowerCase();
    const codeStr = (emp.employeeCode || '').toLowerCase();
    const roleStr = (emp.role || emp.jobRole || '').toLowerCase();
    const matchesSearch =
      nameStr.includes(searchTerm.toLowerCase()) ||
      codeStr.includes(searchTerm.toLowerCase()) ||
      roleStr.includes(searchTerm.toLowerCase());

    const matchesDept = departmentFilter === 'all' || emp.department === departmentFilter;
    const matchesAvail = availabilityFilter === 'all' || (emp.status || '').toUpperCase() === availabilityFilter.toUpperCase();

    return matchesSearch && matchesDept && matchesAvail;
  });

  return (
    <AuthorityShell>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Municipal Employee & Workforce Management
            </h1>
            <p className="text-xs text-slate-400">
              Register field technicians, manage department availability, and monitor active work order dispatching
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-1.5 self-start sm:self-auto"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>+ Add Municipal Employee</span>
          </button>
        </div>

        {/* Search & Filter Controls Bar */}
        <div className="relative z-[100] auth-glass-surface p-4 rounded-2xl border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search Box */}
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, employee code, or role..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 placeholder:text-slate-500 outline-none"
            />
            <svg className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Department Filter */}
          <div>
            <GlassDropdown
              options={[
                { value: 'all', label: 'All Departments' },
                ...MUNICIPAL_DEPARTMENTS.map((dept) => ({ value: dept, label: dept })),
              ]}
              value={departmentFilter}
              onChange={setDepartmentFilter}
              variant="dark"
              ariaLabel="Filter by Department"
            />
          </div>

          {/* Availability Filter */}
          <div>
            <GlassDropdown
              options={availabilityOptions}
              value={availabilityFilter}
              onChange={setAvailabilityFilter}
              variant="dark"
              ariaLabel="Filter by Availability"
            />
          </div>
        </div>

        {/* Directory Grid */}
        {loading ? (
          <div className="relative z-1 p-12 text-center auth-glass-surface rounded-2xl border border-slate-800 text-xs font-mono text-slate-400">
            Loading municipal employee records from Cloud Firestore...
          </div>
        ) : filteredEmployees.length > 0 ? (
          <div className="relative z-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEmployees.map((emp) => {
              const statusStr = (emp.status || 'AVAILABLE').toUpperCase();
              const isAvailable = statusStr === 'AVAILABLE' && emp.isActive;
              const shiftText = typeof emp.shift === 'object' ? `${emp.shift.name} (${emp.shift.startTime} - ${emp.shift.endTime})` : emp.shift;
              const activeCount = emp.activeWorkOrderIds?.length || emp.activeAssignmentCount || 0;

              return (
                <div
                  key={emp.employeeId || emp.employeeCode}
                  className="auth-glass-surface rounded-2xl p-5 border border-slate-800 space-y-3.5 hover:border-amber-500/40 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-slate-100">{emp.fullName || emp.name}</h4>
                        <span className="text-[11px] font-mono text-amber-400 font-bold">
                          {emp.employeeCode}
                        </span>
                      </div>

                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                        isAvailable
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : emp.isActive
                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}>
                        {emp.isActive ? statusStr : 'INACTIVE'}
                      </span>
                    </div>

                    <div className="space-y-1 text-xs">
                      <div className="text-slate-400">Department: <strong className="text-slate-200">{emp.department}</strong></div>
                      <div className="text-slate-400">Role: <strong className="text-slate-200">{emp.role || emp.jobRole || 'Field Specialist'}</strong></div>
                      <div className="text-slate-400">Shift: <strong className="text-slate-200">{shiftText}</strong></div>
                      <div className="text-slate-400">Official Email: <strong className="text-slate-300 font-mono text-[11px]">{emp.email}</strong></div>
                      <div className="text-slate-400">Active Work Orders: <strong className="text-amber-400 font-mono">{activeCount}</strong></div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 font-mono">
                      {emp.serviceArea || 'Visakhapatnam Zone'}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleToggleActive(emp)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                        emp.isActive
                          ? 'bg-rose-500/20 text-rose-300 hover:bg-rose-500/40 border border-rose-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/40 border border-emerald-500/30'
                      }`}
                    >
                      {emp.isActive ? 'Deactivate' : 'Activate Employee'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-12 text-center auth-glass-surface rounded-2xl border border-slate-800 space-y-3">
            <svg className="w-12 h-12 text-slate-600 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5-3.512M9 20H4v-2a3 3 0 015-3.512M12 11a4 4 0 100-8 4 4 0 000 8zM16 11a3 3 0 100-6 3 3 0 000 6zM8 11a3 3 0 100-6 3 3 0 000 6z" />
            </svg>
            <h3 className="text-lg font-bold text-slate-200">No Employees Match Filter</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Add real municipal employees using the button above to enable automatic email work order dispatching.
            </p>
          </div>
        )}
      </div>

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <form onSubmit={handleAddEmployee} className="w-full max-w-lg auth-glass-elevated rounded-2xl p-6 space-y-4 border border-slate-800 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Register Municipal Employee</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white"
              >
                &times;
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-semibold">
                {formError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-mono text-slate-400 font-bold uppercase mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Rajesh Kumar"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-400 font-bold uppercase mb-1">
                  Employee Code
                </label>
                <input
                  type="text"
                  required
                  value={employeeCode}
                  onChange={(e) => setEmployeeCode(e.target.value)}
                  placeholder="e.g. EMP-4019"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 outline-none font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-mono text-slate-400 font-bold uppercase mb-1">
                  Official Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="rajesh.k@vizag.gov.in"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-400 font-bold uppercase mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98480 12345"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-mono text-slate-400 font-bold uppercase mb-1">
                  Department
                </label>
                <GlassDropdown
                  options={MUNICIPAL_DEPARTMENTS.map((dept) => ({ value: dept, label: dept }))}
                  value={department}
                  onChange={setDepartment}
                  variant="amber"
                  ariaLabel="Department"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-400 font-bold uppercase mb-1">
                  Job Role
                </label>
                <input
                  type="text"
                  required
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g. Senior Asphalt Specialist"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-mono text-slate-400 font-bold uppercase mb-1">
                  Shift Name
                </label>
                <input
                  type="text"
                  value={shiftName}
                  onChange={(e) => setShiftName(e.target.value)}
                  placeholder="Morning Shift"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-400 font-bold uppercase mb-1">
                  Shift Start
                </label>
                <input
                  type="text"
                  value={shiftStart}
                  onChange={(e) => setShiftStart(e.target.value)}
                  placeholder="06:00 AM"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-400 font-bold uppercase mb-1">
                  Shift End
                </label>
                <input
                  type="text"
                  value={shiftEnd}
                  onChange={(e) => setShiftEnd(e.target.value)}
                  placeholder="02:00 PM"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 outline-none font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-mono text-slate-400 font-bold uppercase mb-1">
                  Service Area / Zone
                </label>
                <input
                  type="text"
                  value={serviceArea}
                  onChange={(e) => setServiceArea(e.target.value)}
                  placeholder="e.g. Madhurawada Zone"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-400 font-bold uppercase mb-1">
                  Skills (Comma Separated)
                </label>
                <input
                  type="text"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  placeholder="pothole_repair, asphalt_patching"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 outline-none font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold"
              >
                Register Employee
              </button>
            </div>
          </form>
        </div>
      )}
    </AuthorityShell>
  );
};
