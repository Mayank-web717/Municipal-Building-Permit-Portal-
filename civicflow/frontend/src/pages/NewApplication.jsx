import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, 
  User, 
  MapPin, 
  Upload, 
  Check, 
  ChevronRight, 
  ChevronLeft, 
  AlertCircle,
  FileCheck,
  FileText,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const STEPS = [
  { id: 1, title: 'Applicant Details' },
  { id: 2, title: 'Property Information' },
  { id: 3, title: 'Document Upload' },
  { id: 4, title: 'Review & Submit' }
];

export default function NewApplication() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    projectName: '',
    applicantType: 'ARCHITECT',
    propertyAddress: '',
    city: 'Metro City',
    pinCode: '560001',
    surveyNumber: 'SURVEY-789-Z',
    plotArea: 1200,
    buildingType: 'RESIDENTIAL',
    numberOfFloors: 4,
    proposedBuildingArea: 2500,
  });

  // Optional uploaded drawing file
  const [drawingFile, setDrawingFile] = useState(null);
  const fileInputRef = useRef(null);

  // Mock file names for UI step 3
  const [documents, setDocuments] = useState({
    blueprint: 'Architectural_Master_Blueprint_v1.dwg.pdf',
    ownership: 'Registered_Sale_Deed_Title_Certificate.pdf',
    sitePlan: 'Topographical_Site_Ingress_Plan.pdf',
    structural: 'Licensed_Structural_Stability_Certificate.pdf',
    identityProof: 'Architect_Council_License_ID.pdf'
  });

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setDrawingFile(file);
    }
  };

  const handleRemoveFile = () => {
    setDrawingFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: (name === 'plotArea' || name === 'proposedBuildingArea' || name === 'numberOfFloors') 
        ? Number(value) 
        : value
    }));
  };

  const handleNext = () => {
    if (currentStep === 1 && !formData.projectName) {
      setError('Please provide a Project Name.');
      return;
    }
    if (currentStep === 2 && (!formData.propertyAddress || !formData.surveyNumber)) {
      setError('Please complete all property details.');
      return;
    }
    setError('');
    setCurrentStep(prev => prev + 1);
  };

  const handleBack = () => {
    setError('');
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');

    try {
      const payload = {
        applicantId: user?.id || 6,
        projectName: formData.projectName,
        applicantType: formData.applicantType,
        propertyAddress: formData.propertyAddress,
        city: formData.city,
        pinCode: formData.pinCode,
        surveyNumber: formData.surveyNumber,
        plotArea: Number(formData.plotArea),
        buildingType: formData.buildingType,
        numberOfFloors: Number(formData.numberOfFloors),
        proposedBuildingArea: Number(formData.proposedBuildingArea)
      };

      const res = await api.post('/applications', payload);
      const newApp = res.data;

      // If applicant attached an optional drawing/blueprint file, upload it immediately
      if (drawingFile) {
        try {
          const fileData = new FormData();
          fileData.append('file', drawingFile);
          fileData.append('documentType', 'BUILDING_BLUEPRINT');
          await api.post(`/applications/${newApp.id}/upload`, fileData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
        } catch (uploadErr) {
          console.warn('Optional drawing upload skipped/failed:', uploadErr);
        }
      }

      // Automatically redirect to the detail view where Camunda workflow can be tracked
      navigate(`/applications/${newApp.id}`);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to submit application to Camunda workflow.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">New Building Permit Application</h1>
        <p className="text-sm text-slate-500">
          Submit statutory blueprints and details to begin automated departmental reviews.
        </p>
      </div>

      {/* Progress Steps */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between">
          {STEPS.map((step, idx) => {
            const isCompleted = currentStep > step.id;
            const isCurrent = currentStep === step.id;

            return (
              <React.Fragment key={step.id}>
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition ${
                    isCompleted ? 'bg-emerald-600 text-white' :
                    isCurrent ? 'bg-teal-600 text-white ring-4 ring-teal-100' :
                    'bg-slate-100 text-slate-500 border border-slate-200'
                  }`}>
                    {isCompleted ? <Check className="w-4 h-4" /> : step.id}
                  </div>
                  <span className={`text-xs font-semibold hidden md:inline ${
                    isCurrent ? 'text-teal-900 font-bold' : 'text-slate-600'
                  }`}>
                    {step.title}
                  </span>
                </div>
                {idx < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-3 ${
                    currentStep > idx + 1 ? 'bg-emerald-500' : 'bg-slate-200'
                  }`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Form Content */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden p-6">
        {error && (
          <div className="mb-6 p-3 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* STEP 1: Applicant Details */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-800 border-b pb-2">Step 1: Project & Applicant Category</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Project Name *</label>
                <input
                  type="text"
                  name="projectName"
                  placeholder="e.g. Royal Orchid Grand Towers"
                  value={formData.projectName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Applicant Type</label>
                <select
                  name="applicantType"
                  value={formData.applicantType}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                >
                  <option value="INDIVIDUAL">Individual Owner</option>
                  <option value="ARCHITECT">Licensed Architect</option>
                  <option value="COMPANY">Real Estate Developer / Firm</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Name</label>
                <input
                  type="text"
                  value={user?.fullName || 'Ar. Vikram Mehta'}
                  disabled
                  className="w-full px-3 py-2 bg-slate-50 border rounded-lg text-sm text-slate-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email ID</label>
                <input
                  type="email"
                  value={user?.email || 'vikram.mehta@studioarch.com'}
                  disabled
                  className="w-full px-3 py-2 bg-slate-50 border rounded-lg text-sm text-slate-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Property Information */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-800 border-b pb-2">Step 2: Property & Building Specs</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Property Site Address *</label>
                <textarea
                  name="propertyAddress"
                  rows="2"
                  placeholder="Plot 105, Sector 4, Outer Ring Highway"
                  value={formData.propertyAddress}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">PIN Code</label>
                <input
                  type="text"
                  name="pinCode"
                  value={formData.pinCode}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Revenue Cadastral Survey Number *
                </label>
                <input
                  type="text"
                  name="surveyNumber"
                  placeholder="e.g. SURVEY-789-Z (or test: SURVEY-999-DISPUTED)"
                  value={formData.surveyNumber}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none font-mono"
                  required
                />
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  Tip: Include "DISPUTED" to simulate Land Registry rejection scenario.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Building Category</label>
                <select
                  name="buildingType"
                  value={formData.buildingType}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                >
                  <option value="RESIDENTIAL">Residential (INR 20/sq.m)</option>
                  <option value="COMMERCIAL">Commercial (INR 40/sq.m)</option>
                  <option value="INDUSTRIAL">Industrial (INR 30/sq.m)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Plot Land Area (sq. meters) *</label>
                <input
                  type="number"
                  name="plotArea"
                  value={formData.plotArea}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Number of Proposed Floors *</label>
                <input
                  type="number"
                  name="numberOfFloors"
                  value={formData.numberOfFloors}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Proposed Construction Area (sq.m) *</label>
                <input
                  type="number"
                  name="proposedBuildingArea"
                  value={formData.proposedBuildingArea}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Document Uploads */}
        {currentStep === 3 && (
          <div className="space-y-5">
            <div>
              <h3 className="text-base font-bold text-slate-800 border-b pb-2">Step 3: Statutory Blueprints & Certificates</h3>
              <p className="text-xs text-slate-500 mt-1">
                You can attach your custom architectural drawing / blueprint now, or let the portal attach the standard municipal file set.
              </p>
            </div>

            {/* Optional Drawing Upload Box */}
            <div className="p-4 rounded-xl border-2 border-dashed border-teal-300 bg-teal-50/40 hover:bg-teal-50/70 transition space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center text-teal-700 flex-shrink-0">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-slate-800">Upload Architectural Drawing / Plan</h4>
                      <span className="text-[10px] font-bold text-teal-700 bg-teal-100 px-2 py-0.5 rounded-full border border-teal-200 uppercase">
                        Optional
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Supports PDF, DWG, DXF, PNG, JPG. You can upload your blueprint now or replace it anytime after submission.
                    </p>
                  </div>
                </div>

                <input 
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".pdf,.dwg,.dxf,.png,.jpg,.jpeg"
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-sm transition flex-shrink-0 self-start sm:self-auto"
                >
                  {drawingFile ? 'Change File' : 'Browse Drawing'}
                </button>
              </div>

              {drawingFile && (
                <div className="p-2.5 rounded-lg bg-white border border-teal-200 flex items-center justify-between text-xs shadow-sm">
                  <div className="flex items-center gap-2 font-mono text-teal-900 font-semibold truncate">
                    <FileText className="w-4 h-4 text-teal-600 flex-shrink-0" />
                    <span className="truncate">{drawingFile.name}</span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      ({(drawingFile.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="p-1 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition"
                    title="Remove selected file"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Statutory Compliance File Manifest (Standard Set)
              </h4>
              {[
                { label: 'Building Architectural Blueprint (PDF/DWG)', file: drawingFile ? drawingFile.name : documents.blueprint, custom: !!drawingFile },
                { label: 'Land Ownership / Sale Deed Certificate', file: documents.ownership },
                { label: 'Topographical Site & Ingress Plan', file: documents.sitePlan },
                { label: 'Structural Stability Certificate', file: documents.structural },
                { label: 'Identity Proof / Council Registration', file: documents.identityProof },
              ].map((doc, idx) => (
                <div key={idx} className="p-3.5 border rounded-lg bg-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileCheck className="w-5 h-5 text-teal-600" />
                    <div>
                      <p className="text-xs font-bold text-slate-800">{doc.label}</p>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">{doc.file}</p>
                    </div>
                  </div>
                  <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${
                    doc.custom ? 'text-teal-700 bg-teal-100 border border-teal-200' : 'text-emerald-700 bg-emerald-100'
                  }`}>
                    {doc.custom ? 'Custom Attached' : 'Ready'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 4: Review and Submit */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-800 border-b pb-2">Step 4: Review Application & Start Camunda Workflow</h3>

            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-500">Project:</span>{' '}
                  <span className="font-bold text-slate-800">{formData.projectName}</span>
                </div>
                <div>
                  <span className="text-slate-500">Applicant Category:</span>{' '}
                  <span className="font-bold text-slate-800">{formData.applicantType}</span>
                </div>
                <div>
                  <span className="text-slate-500">Survey No:</span>{' '}
                  <span className="font-mono font-bold text-teal-700">{formData.surveyNumber}</span>
                </div>
                <div>
                  <span className="text-slate-500">Building Type:</span>{' '}
                  <span className="font-bold text-slate-800">{formData.buildingType}</span>
                </div>
                <div>
                  <span className="text-slate-500">Total Plot Area:</span>{' '}
                  <span className="font-bold text-slate-800">{formData.plotArea} sq.m</span>
                </div>
                <div>
                  <span className="text-slate-500">Proposed Built Area:</span>{' '}
                  <span className="font-bold text-slate-800">{formData.proposedBuildingArea} sq.m ({formData.numberOfFloors} floors)</span>
                </div>
                <div className="col-span-2 pt-1 border-t border-slate-200">
                  <span className="text-slate-500">Architectural Plan:</span>{' '}
                  <span className="font-semibold text-teal-800">
                    {drawingFile ? `Custom Drawing Attached (${drawingFile.name})` : 'Standard Statutory Schematic (Auto-provisioned)'}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-teal-50/60 border border-teal-200 text-xs text-teal-900 leading-relaxed">
              <p className="font-bold mb-1">Orchestration Process Flow on Submission:</p>
              1. Auto-start Camunda 8 Zeebe Process Instance.<br />
              2. Document Integrity verification worker check.<br />
              3. Mock GIS Land Registry REST API verification.<br />
              4. Parallel distribution to Fire, Water, Zoning, and Environmental department user tasks.
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-8 pt-4 border-t border-slate-200 flex items-center justify-between">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center gap-1.5 px-4 py-2 border rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-100 transition"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
          ) : <div />}

          {currentStep < 4 ? (
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold shadow-sm transition"
            >
              Next Step
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={submitting}
              onClick={handleSubmit}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold shadow-md transition disabled:opacity-50"
            >
              {submitting ? 'Starting Camunda 8 Process...' : 'Confirm & Submit Application'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

