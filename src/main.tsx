import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { Suspense } from 'react'
import { PageLoading } from './components/PageLoading'

const container = document.getElementById('root') as HTMLDivElement
const root = createRoot(container)

root.render(
  <Suspense fallback={<PageLoading />}>
    <App />
  </Suspense>
)
