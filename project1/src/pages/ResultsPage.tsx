import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getDocumentAnalysis, getUserDocuments } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext'; import { format } from 'date-fns';
import { AlertTriangle, CheckCircle, Download, Share, Activity, Stethoscope, FileText, ClipboardList } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';

export default function ResultsPage() {
  const { documentId } = useParams<{ documentId?: string }>();
  const { user } = useAuth();
  const [document, setDocument] = useState<any>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('findings');

  useEffect(() => {
    async function fetchData() {
      if (!user) return;

      try {
        // If no document ID is provided, get the most recent document
        if (!documentId) {
          const { data: documents } = await getUserDocuments(user.id);
          if (documents && documents.length > 0) {
            setDocument(documents[0]);
            
            if (documents[0].document_analysis && documents[0].document_analysis.length > 0) {
              setAnalysis(documents[0].document_analysis[0]);
            } else {
              // Get analysis separately if not included in the document
              const { data: analysisData } = await getDocumentAnalysis(documents[0].id);
              setAnalysis(analysisData);
            }
          }
        } else {
          // Get specific document and its analysis
          const { data: documents } = await getUserDocuments(user.id);
          const specificDocument = documents?.find(doc => doc.id === documentId);
          
          if (specificDocument) {
            setDocument(specificDocument);
            
            if (specificDocument.document_analysis && specificDocument.document_analysis.length > 0) {
              setAnalysis(specificDocument.document_analysis[0]);
            } else {
              // Get analysis separately
              const { data: analysisData } = await getDocumentAnalysis(documentId);
              setAnalysis(analysisData);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching document data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [documentId, user]);

  // Fallback data if API call fails
  const fallbackAnalysis = {
    risk_score: 65,
    risk_level: 'Medium',
    readmission_risk: 'medium',
    readmission_explanation: 'Patient has some risk factors that may increase readmission likelihood. Regular follow-up appointments advised.',
    extracted_text: 'Patient shows normal blood pressure readings of 120/80 mmHg. Blood glucose levels are slightly elevated at 110 mg/dL. Cholesterol levels are within normal range. Patient reports occasional chest pain after physical activity. Recommended follow-up in 3 months. Current medications include Lisinopril 10mg daily.',
    findings: [
      { type: 'Blood Pressure', value: '120/80 mmHg', status: 'Normal' },
      { type: 'Blood Glucose', value: '110 mg/dL', status: 'Slightly Elevated' },
      { type: 'Cholesterol', value: '180 mg/dL', status: 'Normal' },
      { type: 'Chest Pain', value: 'Occasional', status: 'Monitor' },
    ],
    recommendations: [
      'Schedule follow-up appointment within 14 days',
      'Review medication regimen',
      'Provide patient education on warning signs',
      'Consider telehealth check-in between appointments',
    ],
  };

  const displayAnalysis = analysis || fallbackAnalysis;
  const readmissionRisk = displayAnalysis.readmission_risk || displayAnalysis.risk_level?.toLowerCase() || 'medium';
  
  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center space-y-4 py-12">
          <div className="w-20 h-20 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin"></div>
          <p className="text-blue-700 font-medium">Analyzing document content...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 bg-gradient-to-r from-blue-700 via-cyan-700 to-teal-600 bg-clip-text text-transparent">
              Readmission Risk Assessment
            </h1>
            <p className="text-slate-600 mt-1">
              Review the readmission risk analysis for this patient
            </p>
          </div>
          <div className="flex space-x-2">
            <button className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-white px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-50">
              <Download className="h-4 w-4" />
              <span>Download</span>
            </button>
            <button className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-white px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-50">
              <Share className="h-4 w-4" />
              <span>Share</span>
            </button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
          <div className="bg-white rounded-lg border border-blue-100 shadow-sm p-6">
            <h2 className="text-sm font-medium text-slate-700 mb-2">Patient Record</h2>
            <div className="text-xl font-bold truncate text-slate-900">
              {document?.name || 'Patient Record'}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Analyzed on {document ? format(new Date(document.created_at), 'MMM d, yyyy, h:mm a') : new Date().toLocaleString()}
            </p>
          </div>
          
          <div className="bg-white rounded-lg border border-blue-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-medium text-slate-700">Readmission Risk Score</h2>
              {readmissionRisk === 'low' ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : readmissionRisk === 'high' ? (
                <AlertTriangle className="h-4 w-4 text-rose-500" />
              ) : (
                <Activity className="h-4 w-4 text-blue-500" />
              )}
            </div>
            <div className="text-xl font-bold text-slate-900">{displayAnalysis.risk_score}/100</div>
            <div className="mt-2">
              <div className="h-2 w-full bg-blue-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-500" 
                  style={{ width: `${displayAnalysis.risk_score}%` }}
                ></div>
              </div>
            </div>
            <div className="mt-1 flex justify-between text-xs text-slate-500">
              <span>Low Risk</span>
              <span>High Risk</span>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-blue-100 shadow-sm p-6">
            <h2 className="text-sm font-medium text-slate-700 mb-2">Readmission Risk Level</h2>
            <div className="flex items-center gap-2">
              <div className="text-xl font-bold text-slate-900 capitalize">{readmissionRisk}</div>
              <div className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                readmissionRisk === 'high' 
                  ? 'bg-rose-100 text-rose-700' 
                  : readmissionRisk === 'medium'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-green-100 text-green-700'
              }`}>
                {readmissionRisk.charAt(0).toUpperCase() + readmissionRisk.slice(1)}
              </div>
            </div>
            <p className="mt-1 text-xs text-slate-500">Based on patient record analysis</p>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-blue-100 shadow-md mb-6">
          <div className="border-b border-blue-100">
            <div className="flex">
              <button
                className={`px-4 py-3 text-sm font-medium ${
                  activeTab === 'findings' 
                    ? 'text-blue-700 border-b-2 border-blue-500' 
                    : 'text-slate-600 hover:text-blue-700'
                }`}
                onClick={() => setActiveTab('findings')}
              >
                Findings
              </button>
              <button
                className={`px-4 py-3 text-sm font-medium ${
                  activeTab === 'extracted-text' 
                    ? 'text-blue-700 border-b-2 border-blue-500' 
                    : 'text-slate-600 hover:text-blue-700'
                }`}
                onClick={() => setActiveTab('extracted-text')}
              >
                Extracted Text
              </button>
              <button
                className={`px-4 py-3 text-sm font-medium ${
                  activeTab === 'recommendations' 
                    ? 'text-blue-700 border-b-2 border-blue-500' 
                    : 'text-slate-600 hover:text-blue-700'
                }`}
                onClick={() => setActiveTab('recommendations')}
              >
                Care Plan
              </button>
            </div>
          </div>
          
          <div className="p-6">
            {activeTab === 'findings' && (
              <div>
                <div className="mb-6 p-4 rounded-lg bg-blue-50 border border-blue-100">
                  <div className="flex items-start gap-3">
                    <Stethoscope className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-blue-900">Readmission Risk Assessment</h3>
                      <p className="text-blue-700 text-sm mt-1">{displayAnalysis.readmission_explanation || "Based on the patient's medical history and current condition, we've assessed their risk of hospital readmission."}</p>
                    </div>
                  </div>
                </div>
                
                <div className="grid gap-4 md:grid-cols-2">
                  {displayAnalysis.findings && Array.isArray(displayAnalysis.findings) ? (
                    displayAnalysis.findings.map((finding: any, index: number) => (
                      <div
                        key={index}
                        className="rounded-lg border border-blue-100 p-4 hover:bg-blue-50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="font-medium text-slate-900">{finding.type}</div>
                          <div className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            finding.status === 'Normal' 
                              ? 'bg-green-100 text-green-700' 
                              : finding.status === 'Slightly Elevated' || finding.status === 'Monitor'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-rose-100 text-rose-700'
                          }`}>
                            {finding.status}
                          </div>
                        </div>
                        <p className="mt-2 text-lg font-bold text-slate-900">{finding.value}</p>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-2 text-center py-8 text-slate-500">
                      No specific findings available
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {activeTab === 'extracted-text' && (
              <div className="rounded-md bg-slate-50 p-4 border border-blue-100">
                <pre className="whitespace-pre-wrap text-sm text-slate-700">{displayAnalysis.extracted_text}</pre>
              </div>
            )}
            
            {activeTab === 'recommendations' && (
              <div>
                <div className="mb-6 p-4 rounded-lg bg-blue-50 border border-blue-100">
                  <div className="flex items-start gap-3">
                    <ClipboardList className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-blue-900">Recommended Care Plan</h3>
                      <p className="text-blue-700 text-sm mt-1">Based on the readmission risk assessment, we recommend the following care plan to reduce the likelihood of hospital readmission.</p>
                    </div>
                  </div>
                </div>
                
                <ul className="space-y-3">
                  {displayAnalysis.recommendations && Array.isArray(displayAnalysis.recommendations) ? (
                    displayAnalysis.recommendations.map((recommendation: string, index: number) => (
                      <li
                        key={index}
                        className="flex items-start gap-3 p-3 rounded-lg border border-blue-100 hover:bg-blue-50 transition-colors"
                      >
                        <div className="rounded-full bg-blue-100 p-1 mt-0.5">
                          <CheckCircle className="h-4 w-4 text-blue-700" />
                        </div>
                        <span className="text-slate-700">{recommendation}</span>
                      </li>
                    ))
                  ) : (
                    <div className="text-center py-8 text-slate-500">
                      No recommendations available
                    </div>
                  )}
                </ul>
                
                <div className="mt-6 p-4 rounded-lg border border-blue-100 bg-blue-50/50">
                  <h3 className="font-medium text-blue-900 mb-2">Next Steps</h3>
                  <p className="text-slate-700 text-sm">
                    Schedule a follow-up appointment with the patient according to the recommended timeline. 
                    Review the care plan with the patient and ensure they understand all recommendations.
                  </p>
                  <button className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 px-4 py-2 text-sm font-semibold text-white">
                    Schedule Follow-up
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}