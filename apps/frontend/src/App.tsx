import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'

// Pages
import ProjectsPage from './pages/ProjectsPage'
import ProjectDetailPage from './pages/ProjectDetailPage'
import GlossaryPage from './pages/GlossaryPage'

// Components
import Layout from './components/Layout'
import { ErrorBoundary } from './components/ErrorBoundary'

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<Navigate to="/projects" replace />} />
              <Route path="/projects" element={<ProjectsPage />} />
              <Route path="/projects/:id" element={<ProjectDetailPage />} />
              <Route path="/projects/:id/glossary" element={<GlossaryPage />} />
              <Route path="*" element={<Navigate to="/projects" replace />} />
            </Routes>
          </Layout>
        </BrowserRouter>
        <Toaster position="top-right" />
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default App