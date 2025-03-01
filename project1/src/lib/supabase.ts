import { createClient } from '@supabase/supabase-js';

// Debug flag for detailed logging
const DEBUG = true;

// Helper functions for debugging
function logApiRequest(method, url, body) {
  if (DEBUG) {
    console.log(`API ${method} ${url}`, body || '');
  }
}

function logApiResponse(method, url, response) {
  if (DEBUG) {
    console.log(`API Response ${method} ${url}:`, response);
  }
}

// Custom fetch with timeout and better error handling
const customFetch = (url, options) => {
  const timeout = 30000; // 30 second timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  return fetch(url, {
    ...options,
    signal: controller.signal
  }).then(response => {
    clearTimeout(timeoutId);
    return response;
  }).catch(error => {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout: The server took too long to respond');
    }
    throw error;
  });
};

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please connect to Supabase.');
}

export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || '',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true
    },
    global: {
      fetch: customFetch
    }
  }
);

// Wrapper function to handle common Supabase errors
async function safeSupabaseOperation(operation, errorMessage) {
  try {
    logApiRequest('OPERATION', errorMessage || 'Supabase operation', null);
    const result = await operation();
    logApiResponse('OPERATION', errorMessage || 'Supabase operation', result);
    
    // Check for empty response
    if (result === null || result === undefined) {
      throw new Error('Empty response received from server');
    }
    
    return result;
  } catch (error) {
    // Check if it's a JSON parsing error
    if (error.message && error.message.includes('JSON')) {
      console.error('JSON parsing error:', error);
      throw new Error('Invalid response format from server. Please try again later.');
    }
    
    console.error(errorMessage || 'Supabase operation failed:', error);
    throw error;
  }
}

// Auth functions
export async function signUp(email: string, password: string, fullName: string) {
  try {
    // Validate inputs
    if (!email || !password || !fullName) {
      throw new Error('Email, password, and full name are required');
    }
    
    const { data, error } = await safeSupabaseOperation(
      () => supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      }),
      'Error signing up'
    );

    if (error) throw error;

    // Create profile entry
    if (data.user) {
      const { error: profileError } = await safeSupabaseOperation(
        () => supabase
          .from('profiles')
          .upsert([
            {
              id: data.user.id,
              email: email,
              full_name: fullName,
            },
          ]),
        'Error creating user profile'
      );

      if (profileError) throw profileError;
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error signing up:', error);
    return { data: null, error };
  }
}

export async function signIn(email: string, password: string) {
  try {
    // Validate inputs
    if (!email || !password) {
      throw new Error('Email and password are required');
    }
    
    const { data, error } = await safeSupabaseOperation(
      () => supabase.auth.signInWithPassword({
        email,
        password,
      }),
      'Error signing in'
    );

    if (error) throw error;

    // Ensure profile exists for the user
    if (data.user) {
      try {
        // Check if profile exists
        const { data: profileData, error: profileCheckError } = await safeSupabaseOperation(
          () => supabase
            .from('profiles')
            .select('id')
            .eq('id', data.user.id)
            .single(),
          'Error checking user profile'
        );
        
        if (profileCheckError && profileCheckError.code !== 'PGRST116') {
          // If error is not "no rows returned", it's an actual error
          throw profileCheckError;
        }
        
        // Create profile if it doesn't exist
        if (!profileData) {
          const { error: profileCreateError } = await safeSupabaseOperation(
            () => supabase
              .from('profiles')
              .upsert([
                {
                  id: data.user.id,
                  email: data.user.email,
                  full_name: data.user.user_metadata?.full_name || null,
                },
              ]),
            'Error creating user profile during sign in'
          );
          
          if (profileCreateError) throw profileCreateError;
        }
        
        // Log user activity
        await logUserActivity(data.user.id, 'login', {});
      } catch (profileError) {
        console.error('Profile operation failed during sign in:', profileError);
        // Continue with sign in even if profile operations fail
      }
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error signing in:', error);
    return { data: null, error };
  }
}

export async function signOut() {
  try {
    const { error } = await safeSupabaseOperation(
      () => supabase.auth.signOut(),
      'Error signing out'
    );
    
    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error signing out:', error);
    return { error };
  }
}

// Ensure user profile exists
export async function ensureUserProfile(userId: string, email: string, fullName?: string) {
  try {
    if (!userId) {
      throw new Error('User ID is required to ensure profile');
    }
    
    // Check if profile exists
    const { data: profile, error: profileError } = await safeSupabaseOperation(
      () => supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single(),
      'Error checking profile existence'
    );
      
    if (profileError && profileError.code !== 'PGRST116') {
      // If error is not "no rows returned", it's an actual error
      throw profileError;
    }
    
    // Create profile if it doesn't exist
    if (!profile) {
      const { error: createError } = await safeSupabaseOperation(
        () => supabase
          .from('profiles')
          .upsert([
            {
              id: userId,
              email: email,
              full_name: fullName || null,
            },
          ]),
        'Error creating user profile'
      );
        
      if (createError) throw createError;
    }
    
    return { success: true, error: null };
  } catch (error) {
    console.error('Error ensuring user profile:', error);
    return { success: false, error };
  }
}

// Document functions
export async function uploadDocument(file) {
  try {
    // More robust file validation
    if (!file) {
      throw new Error('Invalid file: File is undefined');
    }
    
    // Check if file is a proper File object
    if (!(file instanceof File)) {
      throw new Error('Invalid file: Not a proper File object');
    }
    
    // Check for file name with fallback
    const fileName = file.name || `unnamed_file_${Date.now()}`;
    
    if (file.size === 0) {
      throw new Error('Invalid file: File is empty (0 bytes)');
    }
    
    // Get current user with better error handling
    let userData;
    try {
      const { data, error } = await safeSupabaseOperation(
        () => supabase.auth.getUser(),
        'Error getting current user'
      );
      
      if (error) throw error;
      userData = data;
    } catch (authError) {
      console.error('Auth error detail:', authError);
      throw new Error('Authentication failed. Please sign in again.');
    }

    if (!userData || !userData.user) {
      throw new Error('No authenticated user found');
    }
    
    const user = userData.user;
    
    // Ensure profile exists
    const { success: profileSuccess, error: profileError } = 
      await ensureUserProfile(user.id, user.email || '', user.user_metadata?.full_name);
    
    if (!profileSuccess) throw profileError;
    
    // Extract file extension with better error handling
    let fileExt = '';
    try {
      const nameParts = fileName.split('.');
      if (nameParts.length > 1) {
        fileExt = nameParts[nameParts.length - 1];
      }
    } catch (nameError) {
      console.error('Error extracting file extension:', nameError);
      fileExt = '';
    }
    
    const uniqueFileName = `${user.id}/${Date.now()}${fileExt ? '.' + fileExt : ''}`;
    const filePath = `documents/${uniqueFileName}`;

    console.log('Uploading file:', { 
      originalName: fileName,
      size: file.size,
      type: file.type,
      path: filePath
    });

    const { data: uploadData, error: uploadError } = await safeSupabaseOperation(
      () => supabase.storage
        .from('documents')
        .upload(filePath, file),
      'Error uploading file to storage'
    );

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: urlData } = await safeSupabaseOperation(
      () => supabase.storage
        .from('documents')
        .getPublicUrl(filePath),
      'Error getting public URL'
    );

    if (!urlData || !urlData.publicUrl) {
      throw new Error('Failed to get public URL for uploaded file');
    }

    // Insert document record
    const { data: documentData, error: documentError } = await safeSupabaseOperation(
      () => supabase
        .from('documents')
        .insert([
          {
            user_id: user.id,
            name: fileName,
            file_type: fileExt || file.type || '',
            file_size: file.size,
            file_url: urlData.publicUrl,
          },
        ])
        .select()
        .single(),
      'Error inserting document record'
    );

    if (documentError) throw documentError;

    // Log user activity
    await logUserActivity(user.id, 'document_upload', {
      document_id: documentData.id,
      document_name: fileName,
    });

    return { data: documentData, error: null };
  } catch (error) {
    console.error('Error uploading document:', error);
    return { data: null, error };
  }
}

export async function analyzeDocument(documentId: string, extractedText: string, analysis: any) {
  try {
    if (!documentId) {
      throw new Error('Document ID is required for analysis');
    }
    
    const { data, error } = await safeSupabaseOperation(
      () => supabase
        .from('document_analysis')
        .insert([
          {
            document_id: documentId,
            risk_score: analysis.riskScore,
            risk_level: analysis.riskLevel,
            extracted_text: extractedText,
            findings: analysis.findings,
            recommendations: analysis.recommendations,
            readmission_risk: analysis.readmissionRisk || null,
            readmission_explanation: analysis.readmissionExplanation || null
          },
        ])
        .select()
        .single(),
      'Error inserting document analysis'
    );

    if (error) throw error;

    // Get document to log user activity
    const { data: documentData } = await safeSupabaseOperation(
      () => supabase
        .from('documents')
        .select('user_id, name')
        .eq('id', documentId)
        .single(),
      'Error getting document for activity logging'
    );

    if (documentData) {
      await logUserActivity(documentData.user_id, 'document_analysis', {
        document_id: documentId,
        document_name: documentData.name,
        risk_level: analysis.riskLevel,
        readmission_risk: analysis.readmissionRisk || null
      });
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error analyzing document:', error);
    return { data: null, error };
  }
}

export async function getUserDocuments(userId?: string) {
  try {
    // If userId is not provided, get current user
    let currentUserId = userId;
    
    if (!currentUserId) {
      const { data, error: userError } = await safeSupabaseOperation(
        () => supabase.auth.getUser(),
        'Error getting current user'
      );
      
      if (userError) throw userError;
      if (!data || !data.user) throw new Error('No authenticated user found');
      currentUserId = data.user.id;
    }
    
    const { data, error } = await safeSupabaseOperation(
      () => supabase
        .from('documents')
        .select(`
          *,
          document_analysis (*)
        `)
        .eq('user_id', currentUserId)
        .order('created_at', { ascending: false }),
      'Error fetching user documents'
    );

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error getting user documents:', error);
    return { data: null, error };
  }
}

export async function getDocumentAnalysis(documentId: string) {
  try {
    if (!documentId) {
      throw new Error('Document ID is required to get analysis');
    }
    
    const { data, error } = await safeSupabaseOperation(
      () => supabase
        .from('document_analysis')
        .select('*')
        .eq('document_id', documentId)
        .single(),
      'Error fetching document analysis'
    );

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error getting document analysis:', error);
    return { data: null, error };
  }
}

// User activity logging
async function logUserActivity(userId: string, activityType: string, details: any) {
  try {
    if (!userId) {
      console.error('Cannot log activity: User ID is required');
      return;
    }
    
    const { error } = await safeSupabaseOperation(
      () => supabase
        .from('user_activity')
        .insert([
          {
            user_id: userId,
            activity_type: activityType,
            details,
          },
        ]),
      'Error logging user activity'
    );

    if (error) throw error;
  } catch (error) {
    console.error('Error logging user activity:', error);
    // We don't rethrow here since activity logging should not block main operations
  }
}