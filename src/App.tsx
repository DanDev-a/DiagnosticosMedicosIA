import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import HomePage from './pages/HomePage'
import ExplorePage from './pages/ExplorePage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/explorar" element={<ExplorePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
