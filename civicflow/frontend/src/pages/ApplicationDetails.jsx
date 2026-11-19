import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Building2, 
  Download, 
  CreditCard, 
  AlertTriangle, 
  CheckCircle2, 
  Upload, 
  FileText, 
  RefreshCw,
  Clock,
  ShieldCheck,
  Zap
} from 'lucide-react';
import WorkflowTracker from '../components/WorkflowTracker';
import DepartmentApprovalGrid from '../components/DepartmentApprovalGrid';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import confetti from 'canvas-confetti';

export default function ApplicationDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const isOfficer = user?.role === 'OFFICER';
  const isStaff = isAdmin || isOfficer;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [approving, setApproving] = useState(false);
  const [uploadingRevision, setUploadingRevision] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadDetails();
  }, [id]);

  const loadDetails = async () => {
    try {
      const res = await api.get(`/applications/${id}`);
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewAction = async (department, action) => {
    setMessage('');
    try {
      await api.post(`/reviews/${id}/${action}`, {
        department,
        officerId: user?.id || 1,
        comments: action === 'approve' 
          ? `Statutory compliance verified and approved by ${user?.fullName || 'Municipal Administrator'}.` 
          : action === 'revision'
          ? 'Revisions required on architectural blueprint.'
          : 'Statutory clearance rejected due to non-compliance.'
      });

      setMessage(`Department ${department.replace('_', ' ')} successfully updated (${action.toUpperCase()})! BPMN token synchronized.`);
      loadDetails();
    } catch (err) {
      setMessage('Failed to process review: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleBatchApprove = async () => {
    setApproving(true);
    setMessage('');
    try {
      await api.post(`/reviews/${id}/batch-approve?officerId=${user?.id || 1}`);
      setMessage('One-Click Clearance granted! All 4 departments cleared in parallel. Moving to Fee Calculation...');
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
      loadDetails();
    } catch (err) {
      setMessage('Batch approval failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setApproving(false);
    }
  };

  const handleMockPayment = async (simulateFailure = false) => {
    setPaying(true);
    setMessage('');
    try {
      const res = await api.post('/payments', {
        applicationId: id,
        amount: data?.application?.calculatedFee || 15000,
        paymentMethod: 'NET_BANKING',
        simulateFailure
      });

      if (simulateFailure) {
        setMessage('Payment Gateway Error: Simulated transaction declined. You can retry payment.');
      } else {
        setMessage('Payment successful! Permit generated with digital signature.');
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      }
      loadDetails();
    } catch (err) {
      setMessage('Payment failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setPaying(false);
    }
  };

  const handleUploadRevision = async () => {
    setUploadingRevision(true);
    setMessage('');

    try {
      const blob = new Blob(["Revised blueprint CAD schematic v2"], { type: "text/plain" });
      const file = new File([blob], "Revised_Architectural_Plan_v2.pdf");

      const formData = new FormData();
      formData.append("file", file);
      formData.append("documentType", "REVISED_BLUEPRINT");

      await api.post(`/applications/${id}/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      setMessage('Revised blueprint uploaded! Workflow looped back to departmental review.');
      loadDetails();
    } catch (err) {
      setMessage('Upload failed: ' + (err.response?.data || err.message));
    } finally {
      setUploadingRevision(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Loading permit details...</div>;
  }

  if (!data?.application) {
    return <div className="p-8 text-center text-rose-500">Application not found.</div>;
  }

  const app = data.application;
  const reviews = data.reviews || [];
  const documents = data.documents || [];
  const hasPendingReviews = reviews.some(r => r.status === 'PENDING') || reviews.length < 4;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
              {app.applicationNumber}
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              {app.buildingType} PROJECT
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">{app.projectName}</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Applicant: {app.applicant?.fullName} ({app.applicant?.email}) | Filed on {new Date(app.createdAt).toLocaleDateString()}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={loadDetails} 
            className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition"
            title="Refresh Status"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {app.status === 'PERMIT_ISSUED' && (
            <a 
              href={`/civicflow-storage/permits/${app.permitNumber}.pdf`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg shadow-sm transition"
            >
              <Download className="w-4 h-4" />
              Download Permit PDF
            </a>
          )}
        </div>
      </div>

      {message && (
        <div className="p-4 rounded-xl bg-slate-900 text-white text-xs font-medium flex items-center justify-between shadow-lg">
          <span>{message}</span>
          <button onClick={() => setMessage('')} className="text-slate-400 hover:text-white font-bold ml-4">✕</button>
        </div>
      )}

      {/* Camunda 8 Workflow Visual Tracker */}
      <WorkflowTracker status={app.status} revisionCount={app.revisionCount} />

      {/* REVISION ACTION CALLOUT */}
      {app.status === 'REVISION_REQUIRED' && (
        <div className="p-5 rounded-xl border border-amber-300 bg-amber-50 shadow-sm space-y-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm text-amber-900">Departmental Revision Requested</h4>
              <p className="text-xs text-amber-800 mt-1">
                One or more municipal departments requested corrections on the architectural submission.
                {!isStaff 
                  ? ' Upload your updated blueprints below to loop the application back into review.'
                  : ' The applicant has been notified to upload a revised architectural blueprint.'}
              </p>
            </div>
          </div>
          {!isStaff ? (
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleUploadRevision}
                disabled={uploadingRevision}
                className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg shadow transition disabled:opacity-50"
              >
                <Upload className="w-4 h-4" />
                {uploadingRevision ? 'Uploading...' : 'Upload Corrected Blueprint'}
              </button>
            </div>
          ) : (
            <div className="pt-2 border-t border-amber-200 text-xs text-amber-800 flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-medium">
                <Clock className="w-4 h-4 text-amber-600" />
                Awaiting Applicant Blueprint Revision: Citizen notified of revision remarks.
              </span>
              <span className="font-semibold px-2.5 py-1 bg-white border border-amber-200 rounded-lg text-amber-900 text-[11px]">
                Staff View (Read-Only)
              </span>
            </div>
          )}
        </div>
      )}

      {/* PAYMENT CALLOUT */}
      {app.status === 'PENDING_PAYMENT' && (
        <div className="p-5 rounded-xl border border-indigo-200 bg-indigo-50/70 shadow-sm space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <CreditCard className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm text-indigo-950">Statutory Approvals Cleared – Fee Payable</h4>
                <p className="text-xs text-indigo-800 mt-1">
                  Permit fee has been automatically computed via Camunda Call Activity based on square footage & floor count.
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-indigo-600 font-semibold block">Calculated Fee</span>
              <span className="text-2xl font-black text-indigo-900 font-mono">
                INR {app.calculatedFee?.toLocaleString()}
              </span>
            </div>
          </div>

          {!isStaff ? (
            <div className="pt-2 border-t border-indigo-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => handleMockPayment(true)}
                disabled={paying}
                className="px-3.5 py-2 border border-dashed border-rose-300 bg-rose-50/50 hover:bg-rose-100/60 text-rose-700 font-semibold text-xs rounded-lg transition"
                title="Simulates a bank gateway transaction decline to demonstrate Camunda BPMN Scenario E (Payment Retry Loop)"
              >
                Simulate Gateway Decline (Demo Scenario E)
              </button>
              <button
                type="button"
                onClick={() => handleMockPayment(false)}
                disabled={paying}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg shadow-md transition disabled:opacity-50"
              >
                <CreditCard className="w-4 h-4" />
                {paying ? 'Processing Payment...' : 'Pay Permit Fee Now'}
              </button>
            </div>
          ) : (
            <div className="pt-2 border-t border-indigo-100 flex items-center justify-between text-xs text-indigo-800">
              <span className="flex items-center gap-1.5 font-medium">
                <Clock className="w-4 h-4 text-indigo-500" />
                Awaiting Applicant Payment: Notification has been dispatched to {app.applicant?.fullName || 'the citizen'}.
              </span>
              <span className="font-semibold px-2.5 py-1 bg-white border border-indigo-200 rounded-lg text-indigo-900 text-[11px]">
                Staff View (Read-Only)
              </span>
            </div>
          )}
        </div>
      )}

      {/* PARALLEL MULTI-INSTANCE DEPARTMENT REVIEWS (Direct Frontend Approval) */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-base text-slate-800 flex items-center gap-2">
              <span>Statutory Department Reviews</span>
              <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                Parallel Multi-Instance (|||)
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              {isStaff 
                ? 'Admin clearance desk: approve departments directly below without using external tasklists.'
                : 'Current status of statutory clearances across municipal departments.'}
            </p>
          </div>

          {isAdmin && hasPendingReviews && (
            <button
              onClick={handleBatchApprove}
              disabled={approving}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition disabled:opacity-50"
            >
              <Zap className="w-4 h-4" />
              {approving ? 'Clearing Departments...' : 'One-Click Approve All 4 Departments'}
            </button>
          )}
        </div>

        <DepartmentApprovalGrid 
          reviews={reviews} 
          onReviewAction={isStaff ? handleReviewAction : null}
          isActionable={isStaff}
          allowedDepartment={isAdmin ? 'ALL' : user?.department}
        />
      </div>

      {/* Property & Specs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
          <h3 className="font-bold text-sm text-slate-800 border-b pb-2">Property Specifications</h3>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-400 block">Survey Cadastral #</span>
              <span className="font-mono font-bold text-teal-700">{app.surveyNumber}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Land Registry Status</span>
              <span className="font-semibold text-emerald-700">{app.landVerificationStatus}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Building Type</span>
              <span className="font-semibold text-slate-800">{app.buildingType}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Floors</span>
              <span className="font-semibold text-slate-800">{app.numberOfFloors} Floors</span>
            </div>
            <div>
              <span className="text-slate-400 block">Proposed Floor Area</span>
              <span className="font-semibold text-slate-800">{app.proposedBuildingArea?.toLocaleString()} sq.ft</span>
            </div>
            <div>
              <span className="text-slate-400 block">Plot Area</span>
              <span className="font-semibold text-slate-800">{app.plotArea?.toLocaleString()} sq.ft</span>
            </div>
          </div>
        </div>

        {/* Uploaded Documents */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
          <h3 className="font-bold text-sm text-slate-800 border-b pb-2">Submitted Technical Drawings</h3>
          {documents.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">No documents uploaded.</p>
          ) : (
            <div className="space-y-2">
              {documents.map(doc => (
                <div key={doc.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-teal-600" />
                    <div>
                      <span className="font-semibold text-slate-800 block">{doc.fileName || doc.originalFilename}</span>
                      <span className="text-[10px] text-slate-400">{doc.documentType}</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">Verified</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
