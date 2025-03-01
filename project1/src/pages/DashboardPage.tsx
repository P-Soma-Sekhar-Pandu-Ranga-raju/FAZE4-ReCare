import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getUserDocuments } from '../lib/supabase';
import { format } from 'date-fns';
import { ActivitySquare, FileText, Upload, Activity, AlertTriangle, CheckCircle, Stethoscope } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';

export default function DashboardPage() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDocuments() {
      if (user) {
        try {
          const { data, error } = await getUserDocuments(user.id);
          if (error) throw error;
          setDocuments(data || []);
        } catch (error) {
          console.error('Error fetching documents:', error);
        } finally {
          setLoading(false);
        }
      }
    }

    fetchDocuments();
  }, [user]);

  // Calculate stats
  const stats = {
    totalDocuments: documents.length,
    analyzedDocuments: documents.filter(doc => doc.document_analysis && doc.document_analysis.length > 0).length,
    highRiskDocuments: documents.filter(doc => 
      doc.document_analysis && 
      doc.document_analysis.length > 0 && 
      (doc.document_analysis[0].readmission_risk === 'high' || doc.document_analysis[0].risk_level === 'High')
    ).length,
    recentUploads: documents.slice(0, 5)
  };

  return (
    <DashboardLayout>
      <div className="px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 bg-gradient-to-r from-blue-700 via-cyan-700 to-teal-600 bg-clip-text text-transparent">
            Readmission Dashboard
          </h1>
          <Link
            to="/upload"
            className="inline-flex items-center gap-2 rounded-md bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-blue-200/50"
          >
            <Upload className="h-4 w-4" />
            Upload Document
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
          <div className="bg-white rounded-lg border border-blue-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-medium text-slate-700">Total Patients</h2>
              <FileText className="h-5 w-5 text-blue-500" />
            </div>
            <div className="text-3xl font-bold text-slate-900">{stats.totalDocuments}</div>
            <div className="mt-2 text-sm text-slate-500">
              {stats.analyzedDocuments} analyzed
            </div>
          </div>

          <div className="bg-white rounded-lg border border-blue-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-medium text-slate-700">High Risk Patients</h2>
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            </div>
            <div className="text-3xl font-bold text-slate-900">{stats.highRiskDocuments}</div>
            <div className="mt-2 text-sm text-slate-500">
              high readmission risk detected
            </div>
          </div>

          <div className="bg-white rounded-lg border border-blue-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-medium text-slate-700">Activity Status</h2>
              <Activity className="h-5 w-5 text-green-500" />
            </div>
            <div className="text-3xl font-bold text-slate-900">Active</div>
            <div className="mt-2 text-sm text-slate-500">
              Last upload: {documents.length > 0 ? format(new Date(documents[0].created_at), 'MMM d, yyyy') : 'Never'}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-blue-100 shadow-sm mb-6">
          <div className="border-b border-blue-100 px-6 py-4">
            <h2 className="text-lg font-semibold text-slate-900">Recent Patient Records</h2>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              </div>
            ) : stats.recentUploads.length > 0 ? (
              <div className="space-y-4">
                {stats.recentUploads.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between rounded-lg border border-blue-100 p-4 hover:bg-blue-50 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="rounded-lg bg-blue-100 p-2">
                        <Stethoscope className="h-6 w-6 text-blue-700" />
                      </div>
                      <div className="grid gap-1">
                        <div className="font-medium text-slate-900">{doc.name}</div>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <span>{doc.file_type.toUpperCase()}</span>
                          <span>•</span>
                          <span>{(doc.file_size / 1024).toFixed(2)} KB</span>
                          <span>•</span>
                          <span>{format(new Date(doc.created_at), 'MMM d, yyyy')}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {doc.document_analysis && doc.document_analysis.length > 0 ? (
                        <div className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          (doc.document_analysis[0].readmission_risk === 'high' || doc.document_analysis[0].risk_level === 'High')
                            ? 'bg-rose-100 text-rose-700' 
                            : (doc.document_analysis[0].readmission_risk === 'medium' || doc.document_analysis[0].risk_level === 'Medium')
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-green-100 text-green-700'
                        }`}>
                          {(doc.document_analysis[0].readmission_risk === 'high' || doc.document_analysis[0].risk_level === 'High') ? (
                            <AlertTriangle className="mr-1 h-3 w-3" />
                          ) : (doc.document_analysis[0].readmission_risk === 'low' || doc.document_analysis[0].risk_level === 'Low') ? (
                            <CheckCircle className="mr-1 h-3 w-3" />
                          ) : null}
                          {doc.document_analysis[0].readmission_risk || doc.document_analysis[0].risk_level} Risk
                        </div>
                      ) : (
                        <div className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                          Processing
                        </div>
                      )}
                      <Link
                        to={`/results/${doc.id}`}
                        className="inline-flex items-center rounded-md bg-white px-3 py-1 text-sm font-medium text-blue-700 border border-blue-200 hover:bg-blue-50"
                      >
                        View
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
                  <FileText className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-medium text-slate-900 mb-2">No patient records yet</h3>
                <p className="text-slate-500 mb-4">Upload your first patient record to get started</p>
                <Link
                  to="/upload"
                  className="inline-flex items-center gap-2 rounded-md bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-blue-200/50"
                >
                  <Upload className="h-4 w-4" />
                  Upload Document
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}