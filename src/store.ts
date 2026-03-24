import { create } from 'zustand'
import type { Applicant, DocumentType, Quiz } from './lib/api'

interface AppState {
  // Auth
  token: string | null
  isAdmin: boolean
  setAuth: (token: string) => void
  logout: () => void

  // Data
  applicants: Applicant[]
  setApplicants: (a: Applicant[]) => void
  documentTypes: DocumentType[]
  setDocumentTypes: (d: DocumentType[]) => void
  quizzes: Quiz[]
  setQuizzes: (q: Quiz[]) => void

  // Current applicant (for apply flow)
  currentApplicantId: number | null
  setCurrentApplicantId: (id: number | null) => void
}

export const useStore = create<AppState>((set) => ({
  token: localStorage.getItem('token'),
  isAdmin: !!localStorage.getItem('token'),
  setAuth: (token) => { localStorage.setItem('token', token); set({ token, isAdmin: true }); },
  logout: () => { localStorage.removeItem('token'); set({ token: null, isAdmin: false }); },

  applicants: [],
  setApplicants: (applicants) => set({ applicants }),
  documentTypes: [],
  setDocumentTypes: (documentTypes) => set({ documentTypes }),
  quizzes: [],
  setQuizzes: (quizzes) => set({ quizzes }),

  currentApplicantId: null,
  setCurrentApplicantId: (id) => set({ currentApplicantId: id }),
}))
