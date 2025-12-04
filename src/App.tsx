import { Suspense } from 'react'
import './App.css'
import { RouterProvider } from 'react-router-dom'
import ThemeContext from './pages/Context'
import { PageLoading } from './components/PageLoading'
import { routers } from './router'
import Providers from 'proviers'

const App = () => {
  return (
    <ThemeContext.Provider value="light">
      <Providers>
        <Suspense fallback={<PageLoading></PageLoading>}>
          <RouterProvider router={routers}></RouterProvider>
        </Suspense>
      </Providers>
    </ThemeContext.Provider>
  )
}

export default App
