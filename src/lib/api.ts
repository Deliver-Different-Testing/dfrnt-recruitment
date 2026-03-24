const BASE = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  // Don't set Content-Type for FormData
  if (!(options?.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  const res = await fetch(`${BASE}${url}`, {
    ...options,
    headers: { ...headers, ...options?.headers },
  });
  if (!res.ok) throw new Error(await res.text());
  const text = await res.text();
  return text ? JSON.parse(text) : ({} as T);
}

// Portal config (public)
export interface PortalConfig {
  companyName: string; welcomeTitle: string; welcomeSubtitle: string;
  showVehicleStep: boolean; showQuizStep: boolean; primaryColor: string;
  documentTypes: DocumentType[]; quiz: Quiz | null;
}
export const getPortalConfig = () => request<PortalConfig>('/settings/portal');
export const getSettings = () => request<any>('/settings');
export const updateSettings = (data: any) => request<any>('/settings', { method: 'PUT', body: JSON.stringify(data) });

// Auth
export const login = (username: string, password: string) =>
  request<{ token: string; user: { username: string; role: string } }>('/auth/login', {
    method: 'POST', body: JSON.stringify({ username, password }),
  });

// Applicants
export const getApplicants = () => request<Applicant[]>('/applicant');
export const getApplicant = (id: number) => request<Applicant>(`/applicant/${id}`);
export const getApplicantByEmail = (email: string) => request<Applicant>(`/applicant/status/${encodeURIComponent(email)}`);
export const applyAsApplicant = (data: Partial<Applicant>) =>
  request<Applicant>('/applicant', { method: 'POST', body: JSON.stringify(data) });
export const updateApplicantStatus = (id: number, status: string, notes?: string) =>
  request<Applicant>(`/applicant/${id}/status`, { method: 'PUT', body: JSON.stringify({ status, notes }) });

// Pipeline
export const getPipeline = () => request<Record<string, Applicant[]>>('/recruitment/pipeline');
export const addNote = (applicantId: number, content: string) =>
  request('/recruitment/' + applicantId + '/notes', { method: 'POST', body: JSON.stringify({ content }) });
export const getHistory = (applicantId: number) => request<StageEntry[]>(`/recruitment/${applicantId}/history`);

// Documents
export const getDocumentTypes = () => request<DocumentType[]>('/document/types');
export const createDocumentType = (data: Partial<DocumentType>) =>
  request<DocumentType>('/document/types', { method: 'POST', body: JSON.stringify(data) });
export const updateDocumentType = (id: number, data: Partial<DocumentType>) =>
  request<DocumentType>(`/document/types/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const uploadDocument = async (applicantId: number, documentTypeId: number, file: File) => {
  const token = localStorage.getItem('token');
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${BASE}/document/upload/${applicantId}/${documentTypeId}`, {
    method: 'POST',
    body: form,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};
export const verifyDocument = (id: number, approved: boolean, reason?: string) =>
  request(`/document/${id}/verify`, { method: 'PUT', body: JSON.stringify({ approved, reason }) });
export const getApplicantDocuments = (applicantId: number) => request<ApplicantDocument[]>(`/document/applicant/${applicantId}`);

// Quizzes
export const getQuizzes = () => request<Quiz[]>('/quiz');
export const getQuiz = (id: number) => request<Quiz>(`/quiz/${id}`);
export const getActiveQuiz = () => request<Quiz>('/quiz/active');
export const createQuiz = (data: Partial<Quiz>) =>
  request<Quiz>('/quiz', { method: 'POST', body: JSON.stringify(data) });
export const updateQuiz = (id: number, data: Partial<Quiz>) =>
  request<Quiz>(`/quiz/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const addQuestion = (quizId: number, data: Partial<QuizQuestion>) =>
  request<QuizQuestion>(`/quiz/${quizId}/questions`, { method: 'POST', body: JSON.stringify(data) });
export const submitQuiz = (data: { applicantId: number; quizId: number; startedDate?: string; timeTaken?: number; answers: { questionId: number; answer: string }[] }) =>
  request<{ id: number; score: number; passed: boolean; totalQuestions: number }>('/quiz/submit', { method: 'POST', body: JSON.stringify(data) });

// Types
export interface Applicant {
  id: number; firstName: string; lastName: string; email: string; phone?: string;
  address?: string; city?: string; region?: string; status: string;
  appliedDate: string; statusChangedDate: string;
  vehicleType?: string; hasOwnVehicle: boolean; licenseType?: string; licenseExpiry?: string;
  preferredRegions?: string; notes?: string; source?: string;
  documents?: ApplicantDocument[]; stages?: StageEntry[]; recruitmentNotes?: RecruitmentNote[];
  quizAttempts?: QuizAttempt[];
}

export interface ApplicantDocument {
  id: number; applicantId: number; documentTypeId: number;
  fileName: string; filePath: string; fileSize: number; contentType: string;
  uploadedDate: string; expiryDate?: string; status: string;
  verifiedBy?: string; verifiedDate?: string; rejectionReason?: string;
  documentType?: DocumentType;
}

export interface DocumentType {
  id: number; name: string; description?: string; isRequired: boolean;
  appliesTo: string; validityMonths?: number; sortOrder: number; isActive: boolean;
}

export interface StageEntry { id: number; applicantId: number; stage: string; notes?: string; createdBy?: string; createdDate: string; }
export interface RecruitmentNote { id: number; applicantId: number; content: string; createdBy?: string; createdDate: string; }

export interface Quiz {
  id: number; title: string; description?: string; passingScore: number;
  isActive: boolean; timeLimit?: number; createdDate: string; questions?: QuizQuestion[];
}
export interface QuizQuestion {
  id: number; quizId: number; questionText: string; questionType: string;
  options?: string; correctAnswer: string; points: number; sortOrder: number;
}
export interface QuizAttempt {
  id: number; applicantId: number; quizId: number; startedDate: string;
  completedDate?: string; score: number; passed: boolean; timeTaken?: number;
  answers?: QuizAnswer[];
}
export interface QuizAnswer {
  id: number; questionId: number; answer: string; isCorrect: boolean; points: number;
}
