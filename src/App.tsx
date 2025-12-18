import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import ShopCodeEntry from './pages/ShopCodeEntry'
import Customer from './pages/Customer'
import Operator from './pages/CyberOperator'
import CreateShop from './pages/CreateShop'
import OperatorLogin from './pages/OperatorLogin'
import ResetPassword from './pages/ResetPassword'
import './App.css'

function App() {
  return (
    <Router>
      <div className="App">
        <nav>
          <Link to="/">Home</Link> | <Link to="/operator/login">Operator Login</Link> | <Link to="/create-shop">Create Shop</Link>
        </nav>
        <Routes>
          <Route path="/" element={<ShopCodeEntry />} />
          <Route path="/upload" element={<Customer />} />
          <Route path="/operator" element={<Operator />} />
          <Route path="/operator/login" element={<OperatorLogin />} />
          <Route path="/create-shop" element={<CreateShop />} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
