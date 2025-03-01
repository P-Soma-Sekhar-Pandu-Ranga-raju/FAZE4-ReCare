// This file handles text extraction from different document types

// Function to extract text from an image using Tesseract.js
export async function extractTextFromImage(file: File): Promise<string> {
  try {
    const { createWorker } = await import('tesseract.js');
    const worker = await createWorker('eng');
    
    // Convert file to image data URL
    const imageUrl = URL.createObjectURL(file);
    
    // Recognize text
    const { data: { text } } = await worker.recognize(imageUrl);
    
    // Terminate worker and revoke URL
    await worker.terminate();
    URL.revokeObjectURL(imageUrl);
    
    return text;
  } catch (error) {
    console.error('Error extracting text from image:', error);
    return `Error extracting text: ${error instanceof Error ? error.message : String(error)}`;
  }
}

// Function to extract text from a PDF
export async function extractTextFromPdf(file: File): Promise<string> {
  try {
    const { PDFExtract } = await import('pdf.js-extract');
    const pdfExtract = new PDFExtract();
    
    // Convert file to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Extract text
    const data = await pdfExtract.extractBuffer(arrayBuffer);
    
    // Combine text from all pages
    const text = data.pages
      .map(page => page.content.map(item => item.str).join(' '))
      .join('\n');
    
    return text;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    return `Error extracting text: ${error instanceof Error ? error.message : String(error)}`;
  }
}

// Function to extract text from a DOCX file
export async function extractTextFromDocx(file: File): Promise<string> {
  try {
    const mammoth = await import('mammoth');
    
    // Convert file to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Extract text
    const result = await mammoth.extractRawText({ arrayBuffer });
    
    return result.value;
  } catch (error) {
    console.error('Error extracting text from DOCX:', error);
    return `Error extracting text: ${error instanceof Error ? error.message : String(error)}`;
  }
}

// Main function to extract text based on file type
export async function extractTextFromFile(file: File): Promise<string> {
  const fileType = file.name.split('.').pop()?.toLowerCase();
  
  switch (fileType) {
    case 'jpg':
    case 'jpeg':
    case 'png':
      return extractTextFromImage(file);
    case 'pdf':
      return extractTextFromPdf(file);
    case 'docx':
    case 'doc':
      return extractTextFromDocx(file);
    default:
      return `Unsupported file type: ${fileType}`;
  }
}

// Function to analyze text for readmission risk
export async function analyzeReadmissionRisk(text: string): Promise<{
  riskLevel: string;
  riskScore: number;
  readmissionRisk: string;
  readmissionExplanation: string;
  findings: any[];
  recommendations: string[];
}> {
  // This is a simplified version - in a real app, you would call an AI API
  // For now, we'll use a simple keyword-based approach
  
  const lowerText = text.toLowerCase();
  
  // Keywords that might indicate higher readmission risk
  const highRiskKeywords = [
    'readmitted', 'previous admission', 'chronic', 'diabetes', 'heart failure',
    'copd', 'pneumonia', 'sepsis', 'renal failure', 'multiple admissions'
  ];
  
  const mediumRiskKeywords = [
    'hypertension', 'elderly', 'medication', 'follow-up', 'discharge',
    'treatment', 'therapy', 'recovery', 'monitoring'
  ];
  
  // Count keyword matches
  const highRiskCount = highRiskKeywords.filter(keyword => lowerText.includes(keyword)).length;
  const mediumRiskCount = mediumRiskKeywords.filter(keyword => lowerText.includes(keyword)).length;
  
  // Calculate risk score (0-100)
  const riskScore = Math.min(100, Math.round((highRiskCount * 15 + mediumRiskCount * 5)));
  
  // Determine risk level
  let readmissionRisk = 'low';
  if (riskScore >= 70) {
    readmissionRisk = 'high';
  } else if (riskScore >= 30) {
    readmissionRisk = 'medium';
  }
  
  // Generate explanation
  let readmissionExplanation = '';
  if (readmissionRisk === 'high') {
    readmissionExplanation = 'Patient shows multiple high-risk factors including ' + 
      highRiskKeywords.filter(keyword => lowerText.includes(keyword)).slice(0, 3).join(', ') + 
      '. Close monitoring and follow-up recommended.';
  } else if (readmissionRisk === 'medium') {
    readmissionExplanation = 'Patient has some risk factors that may increase readmission likelihood. ' +
      'Regular follow-up appointments advised.';
  } else {
    readmissionExplanation = 'Patient shows few risk factors for readmission. Standard follow-up procedures recommended.';
  }
  
  // Generate findings
  const findings = [];
  if (lowerText.includes('diabetes')) {
    findings.push({ type: 'Diabetes', value: 'Present', status: 'Monitor' });
  }
  if (lowerText.includes('hypertension')) {
    findings.push({ type: 'Hypertension', value: 'Present', status: 'Monitor' });
  }
  if (lowerText.includes('heart') && (lowerText.includes('failure') || lowerText.includes('disease'))) {
    findings.push({ type: 'Heart Condition', value: 'Present', status: 'High Risk' });
  }
  if (lowerText.includes('medication')) {
    findings.push({ type: 'Medication Adherence', value: 'Needs Review', status: 'Monitor' });
  }
  
  // If no specific findings, add a general one
  if (findings.length === 0) {
    findings.push({ type: 'General Health', value: 'Needs Assessment', status: 'Review' });
  }
  
  // Generate recommendations
  const recommendations = [];
  if (readmissionRisk === 'high') {
    recommendations.push('Schedule follow-up appointment within 7 days');
    recommendations.push('Review medication adherence and potential interactions');
    recommendations.push('Consider home health services for monitoring');
    recommendations.push('Coordinate with specialist for comprehensive care plan');
  } else if (readmissionRisk === 'medium') {
    recommendations.push('Schedule follow-up appointment within 14 days');
    recommendations.push('Review medication regimen');
    recommendations.push('Provide patient education on warning signs');
    recommendations.push('Consider telehealth check-in between appointments');
  } else {
    recommendations.push('Schedule routine follow-up appointment');
    recommendations.push('Provide educational materials on maintaining health');
    recommendations.push('Ensure patient has clear discharge instructions');
  }
  
  return {
    riskLevel: readmissionRisk,
    riskScore,
    readmissionRisk,
    readmissionExplanation,
    findings,
    recommendations
  };
}