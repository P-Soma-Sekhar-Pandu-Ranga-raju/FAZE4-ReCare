-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  file_type text NOT NULL,
  file_size integer NOT NULL,
  file_url text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create document_analysis table
CREATE TABLE IF NOT EXISTS document_analysis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid REFERENCES documents(id) ON DELETE CASCADE NOT NULL,
  risk_score integer NOT NULL,
  risk_level text NOT NULL,
  extracted_text text,
  findings jsonb,
  recommendations jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_analysis ENABLE ROW LEVEL SECURITY;

-- Create policies for documents
CREATE POLICY "Users can read own documents"
  ON documents
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own documents"
  ON documents
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own documents"
  ON documents
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own documents"
  ON documents
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for document_analysis
CREATE POLICY "Users can read own document analysis"
  ON document_analysis
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM documents
    WHERE documents.id = document_analysis.document_id
    AND documents.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own document analysis"
  ON document_analysis
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM documents
    WHERE documents.id = document_analysis.document_id
    AND documents.user_id = auth.uid()
  ));

-- Create a trigger to update the updated_at column for documents
CREATE TRIGGER update_documents_updated_at
BEFORE UPDATE ON documents
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();