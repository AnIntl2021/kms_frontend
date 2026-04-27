import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuthStore } from './store/useAuthStore';
import InventoryPage from './pages/InventoryPage';
import CategoriesPage from './pages/CategoriesPage';
import VendorsPage from './pages/VendorsPage';
import PurchaseOrdersPage from './pages/PurchaseOrdersPage';
import MenuPage from './pages/MenuPage';
import SalesPage from './pages/SalesPage';
import AccountsPage from './pages/AccountsPage';
import WastagePage from './pages/WastagePage';
import AdministrationPage from './pages/AdministrationPage';
import FactoryDispatchPage from './pages/FactoryDispatchPage';
import SettingsPage from './pages/SettingsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import ReportsPage from './pages/ReportsPage';
import SalesmenPage from './pages/SalesmenPage';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      <Router>
      <Routes>
        <Route path="/login" element={!isAuthenticated ? <LoginPage /> : <Navigate to="/dashboard" />} />
        
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          } 
        />

        <Route path="/inventory" element={<ProtectedRoute><InventoryPage /></ProtectedRoute>} />
        <Route path="/categories" element={<ProtectedRoute><CategoriesPage /></ProtectedRoute>} />
        <Route path="/vendors" element={<ProtectedRoute><VendorsPage /></ProtectedRoute>} />
        <Route path="/purchases" element={<ProtectedRoute><PurchaseOrdersPage /></ProtectedRoute>} />
        <Route path="/menu" element={<ProtectedRoute><MenuPage /></ProtectedRoute>} />
        <Route path="/wastage" element={<ProtectedRoute><WastagePage /></ProtectedRoute>} />
        <Route path="/sales" element={<ProtectedRoute><SalesPage /></ProtectedRoute>} />
        <Route path="/accounts" element={<ProtectedRoute><AccountsPage /></ProtectedRoute>} />
        <Route path="/administration" element={<ProtectedRoute><AdministrationPage /></ProtectedRoute>} />
        <Route path="/factory-dispatch" element={<ProtectedRoute><FactoryDispatchPage /></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
        <Route path="/salesmen" element={<ProtectedRoute><SalesmenPage /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />

        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
      </Router>
    </>
  );
}

export default App;
