import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.js'
import './assets/globals.css'

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: any }> {
  constructor(props: any) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error }
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("ErrorBoundary caught an error", error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 bg-red-50 text-red-800 min-h-screen font-mono text-xs overflow-auto flex flex-col justify-center items-center">
          <div className="w-full max-w-lg bg-white border border-red-200 p-6 rounded-lg shadow-sm">
            <h1 className="text-sm font-bold mb-3 text-red-700">Application Error (React Render Crash)</h1>
            <pre className="bg-red-50/40 border border-red-100 p-4 rounded text-[10px] text-red-950 font-mono overflow-auto max-h-60 whitespace-pre-wrap leading-relaxed">
              {this.state.error?.stack || this.state.error?.toString()}
            </pre>
            <div className="mt-6 flex justify-end gap-3 font-sans">
              <button 
                onClick={() => { localStorage.clear(); window.location.reload() }}
                className="h-9 px-4 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-semibold cursor-pointer shadow-sm transition-colors"
              >
                Clear Cache & Reload App
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
)
