import { createClient } from '@supabase/supabase-js';

// Environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please connect to Supabase.');
}

export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || ''
);

// Interfaces for type safety
interface DocumentData {
  id: string;
  user_id: string;
  name: string;
  file_type: string;
  file_size: number;
  file_url: string;
  created_at: string;
  updated_at: string;
}

interface AnalysisData {
  id: string;
  document_id: string;
  risk_score: number;
  risk_level: 'low' | 'medium' | 'high';
  extracted_text: string;
  findings: Record<string, any>;
  recommendations: Record<string, any>;
  created_at: string;
}

// Auth functions
export async function signUp(email: string, password: string, fullName: string) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) throw error;

    if (data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          email,
          full_name: fullName,
        });

      if (profileError) throw profileError;
    }

    return { data, error: null };
  } catch (error: any) {
    console.error('Error signing up:', error.message || error);
    return { data: null, error };
  }
}

export async function signIn(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    if (data.user) {
      await logUserActivity(data.user.id, 'login', {});
    }

    return { data, error: null };
  } catch (error: any) {
    console.error('Error signing in:', error.message || error);
    return { data: null, error };
  }
}

export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { error: null };
  } catch (error: any) {
    console.error('Error signing out:', error.message || error);
    return { error };
  }
}

// Document functions
export async function uploadDocument(userId: string, file: File): Promise<{ data: DocumentData | null; error: any }> {
  try {
    const currentUser = await supabase.auth.getUser();
    if (!currentUser.data.user || currentUser.data.user.id !== userId) {
      throw new Error('Authenticated user ID does not match provided userId');
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;

    console.log('Uploading file:', { userId, fileName });

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      throw new Error(uploadError.message || 'Failed to upload file to "documents" bucket');
    }

    const { data: urlData } = supabase.storage.from('documents').getPublicUrl(fileName);

    const { data: documentData, error: documentError } = await supabase
      .from('documents')
      .insert({
        user_id: userId,
        name: file.name,
        file_type: fileExt,
        file_size: file.size,
        file_url: urlData.publicUrl,
      })
      .select()
      .single();

    if (documentError) {
      console.error('Documents table insert error:', documentError);
      throw new Error(documentError.message || 'Failed to save document metadata - RLS violation?');
    }

    await logUserActivity(userId, 'document_upload', {
      document_id: documentData.id,
      document_name: file.name,
    });

    return { data: documentData, error: null };
  } catch (error: any) {
    console.error('Error uploading document:', error.message || error);
    return { data: null, error };
  }
}

export async function analyzeDocument(
  documentId: string,
  extractedText: string,
  analysis: { riskScore?: number; riskLevel: 'low' | 'medium' | 'high'; explanation?: string; findings?: any; recommendations?: any }
): Promise<{ data: AnalysisData | null; error: any }> {
  try {
    const currentUser = await supabase.auth.getUser();
    if (!currentUser.data.user) {
      throw new Error('No authenticated user found');
    }

    const { data: docData, error: docError } = await supabase
      .from('documents')
      .select('user_id')
      .eq('id', documentId)
      .single();

    if (docError || !docData || docData.user_id !== currentUser.data.user.id) {
      throw new Error('Document does not belong to the authenticated user or does not exist');
    }

    console.log('Inserting analysis:', { documentId, riskLevel: analysis.riskLevel });

    const { data, error } = await supabase
      .from('document_analysis')
      .insert({
        document_id: documentId,
        risk_score: analysis.riskScore || 50,
        risk_level: analysis.riskLevel,
        extracted_text: extractedText,
        findings: analysis.findings || {},
        recommendations: analysis.recommendations || {},
      })
      .select()
      .single();

    if (error) {
      console.error('Document_analysis table insert error:', error);
      throw new Error(error.message || 'Failed to save document analysis - RLS violation?');
    }

    const { data: documentData } = await supabase
      .from('documents')
      .select('user_id, name')
      .eq('id', documentId)
      .single();

    if (documentData) {
      await logUserActivity(documentData.user_id, 'document_analysis', {
        document_id: documentId,
        document_name: documentData.name,
        risk_level: analysis.riskLevel,
      });
    }

    return { data, error: null };
  } catch (error: any) {
    console.error('Error analyzing document:', error.message || error);
    return { data: null, error };
  }
}

export async function getUserDocuments(userId: string) {
  try {
    const { data, error } = await supabase
      .from('documents')
      .select(`
        *,
        document_analysis (*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    console.error('Error getting user documents:', error.message || error);
    return { data: null, error };
  }
}

export async function getDocumentAnalysis(documentId: string) {
  try {
    const { data, error } = await supabase
      .from('document_analysis')
      .select('*')
      .eq('document_id', documentId)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    console.error('Error getting document analysis:', error.message || error);
    return { data: null, error };
  }
}

async function logUserActivity(userId: string, activityType: string, details: any) {
  try {
    const { error } = await supabase
      .from('user_activity')
      .insert({
        user_id: userId,
        activity_type: activityType,
        details,
      });

    if (error) {
      console.error('User_activity table insert error:', error);
      throw new Error(error.message || 'Failed to log user activity - RLS violation?');
    }
  } catch (error: any) {
    console.error('Error logging user activity:', error.message || error);
  }
}