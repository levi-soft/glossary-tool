import { useState } from 'react'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🎮 Glossary Tool
          </h1>
          <p className="text-gray-600">
            Game Translation Tool with AI Support
          </p>
        </header>

        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-4">Welcome!</h2>
          <p className="text-gray-700 mb-4">
            This is a placeholder. The full application will include:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 mb-6">
            <li>Project management</li>
            <li>Sheet-like translation interface</li>
            <li>Glossary management</li>
            <li>AI translation suggestions</li>
            <li>Team collaboration</li>
          </ul>
          
          <div className="text-center">
            <button
              onClick={() => setCount((count) => count + 1)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition-colors"
            >
              Count is {count}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App