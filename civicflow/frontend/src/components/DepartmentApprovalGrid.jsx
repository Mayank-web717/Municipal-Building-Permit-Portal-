import React, { useState } from 'react';
import { Flame, Droplets, Compass, Trees, CheckCircle, XCircle, Clock, AlertTriangle, ShieldCheck } from 'lucide-react';

const DEPARTMENTS = [
  { key: 'FIRE_SAFETY', label: 'Fire Safety Dept', icon: Flame, color: 'text-orange-500', bg: 'bg-orange-50' },
  { key: 'WATER', label: 'Water Works Dept', icon: Droplets, color: 'text-cyan-500', bg: 'bg-cyan-50' },
  { key: 'ZONING', label: 'Zoning & Master Plan', icon: Compass, color: 'text-amber-500', bg: 'bg-amber-50' },
  { key: 'ENVIRONMENTAL', label: 'Environmental Board', icon: Trees, color: 'text-emerald-500', bg: 'bg-emerald-50' }
];

export default function DepartmentApprovalGrid({ reviews = [], onReviewAction, isActionable = true, allowedDepartment = null }) {
  const [loadingDept, setLoadingDept] = useState(null);

  const getReviewForDept = (deptKey) => {
    return reviews.find(r => r.department === deptKey);
  };

  const handleAction = async (deptKey, action) => {
    if (!onReviewAction) return;
    setLoadingDept(deptKey + '_' + action);
    try {
      await onReviewAction(deptKey, action);
    } finally {
      setLoadingDept(null);
    }
  };

  const getStatusBadge = (review) => {
    if (!review || review.status === 'PENDING') {
      return (
        <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
          <Clock className="w-3 h-3 text-slate-400" /> Pending Review
        </span>
      );
    }
    if (review.status === 'APPROVED') {
      return (
        <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
          <CheckCircle className="w-3 h-3 text-emerald-600" /> Cleared
        </span>
      );
    }
    if (review.status === 'REJECTED') {
      return (
        <span className="flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
          <XCircle className="w-3 h-3 text-rose-600" /> Rejected
        </span>
      );
    }
    if (review.status === 'REVISION_REQUESTED') {
      return (
        <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
          <AlertTriangle className="w-3 h-3 text-amber-600" /> Revision Requested
        </span>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {DEPARTMENTS.map((dept) => {
        const review = getReviewForDept(dept.key);
        const Icon = dept.icon;
        const isPending = !review || review.status === 'PENDING';
        const isCurrentLoading = loadingDept?.startsWith(dept.key);

        return (
          <div 
            key={dept.key} 
            className={`border rounded-xl p-4 bg-white shadow-sm flex flex-col justify-between transition-all ${
              review?.status === 'APPROVED' ? 'border-emerald-200 bg-emerald-50/20' :
              review?.status === 'REJECTED' ? 'border-rose-200 bg-rose-50/20' :
              review?.status === 'REVISION_REQUESTED' ? 'border-amber-200 bg-amber-50/20' :
              review?.isOverdue ? 'border-rose-400 ring-1 ring-rose-200' : 'border-slate-200'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className={`w-8 h-8 rounded-lg ${dept.bg} flex items-center justify-center`}>
                  <Icon className={`w-4 h-4 ${dept.color}`} />
                </div>
                {getStatusBadge(review)}
              </div>

              <h4 className="font-bold text-sm text-slate-800">{dept.label}</h4>

              {review?.officerName && (
                <p className="text-xs text-slate-500 mt-1">
                  Reviewed by: <span className="font-medium text-slate-700">{review.officerName}</span>
                </p>
              )}

              {review?.comments && (
                <div className="mt-3 p-2 bg-slate-50 rounded-lg text-xs text-slate-600 border border-slate-100 italic">
                  "{review.comments}"
                </div>
              )}
            </div>

            {/* Direct Frontend Clearance Action Buttons */}
            {isActionable && isPending && onReviewAction && (!allowedDepartment || allowedDepartment === 'ALL' || allowedDepartment === dept.key) && (
              <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  {allowedDepartment && allowedDepartment !== 'ALL' ? 'Department Action' : 'Admin Clearance Action'}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleAction(dept.key, 'approve')}
                    disabled={isCurrentLoading}
                    className="flex-1 py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 shadow-sm disabled:opacity-50"
                    title="Clear statutory requirements for this department"
                  >
                    <CheckCircle className="w-3 h-3" /> Approve
                  </button>
                  <button
                    onClick={() => handleAction(dept.key, 'revision')}
                    disabled={isCurrentLoading}
                    className="py-1.5 px-2 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg text-xs font-semibold transition"
                    title="Request applicant to revise blueprint"
                  >
                    Revision
                  </button>
                  <button
                    onClick={() => handleAction(dept.key, 'reject')}
                    disabled={isCurrentLoading}
                    className="py-1.5 px-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold transition"
                    title="Reject permit submission"
                  >
                    Reject
                  </button>
                </div>
              </div>
            )}

            {review?.isOverdue && (
              <div className="mt-3 pt-2 border-t border-rose-100 text-[11px] font-semibold text-rose-600 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> Overdue (SLA Exceeded)
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
