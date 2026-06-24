import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import LandingPage from './pages/LandingPage';
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
import FoodCostPage from './pages/FoodCostPage';
import ClientStatementsPage from './pages/ClientStatementsPage';
import DispatchDashboardPage from './pages/DispatchDashboardPage';
import SalesmenPage from './pages/SalesmenPage';
import PNLReportPage from './pages/PNLReportPage';
import StorePNLReportPage from './pages/StorePNLReportPage';
import ExpensesPage from './pages/ExpensesPage';
import AssetsManagementPage from './pages/AssetsManagementPage';
import BalanceSheetPage from './pages/BalanceSheetPage';
import RoleManagementPage from './pages/RoleManagementPage';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import TenantManagement from './pages/TenantManagement';
import POSPage from './pages/POSPage';
import POSCountersPage from './pages/POSCountersPage';
import BillingPage from './pages/BillingPage';
import BranchManagement from './pages/BranchManagement';
import BrandManagement from './pages/BrandManagement';
import StockTransfer from './pages/StockTransfer';
import PrintSettingsPage from './pages/PrintSettingsPage';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { LanguageProvider, useLanguage } from './hooks/useLanguage';

function AppContent() {
  const { isAuthenticated } = useAuthStore();
  const { isRTL } = useLanguage();

  return (
    <>
      <ToastContainer
        position={isRTL ? "top-left" : "top-right"}
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={isRTL}
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
            <ProtectedRoute requiredPermission="dashboard">
              <DashboardPage />
            </ProtectedRoute>
          } 
        />

        <Route path="/pos" element={<ProtectedRoute requiredPermission="sales"><POSPage /></ProtectedRoute>} />

        <Route path="/inventory" element={<ProtectedRoute requiredPermission="inventory"><InventoryPage /></ProtectedRoute>} />
        <Route path="/categories" element={<ProtectedRoute requiredPermission="inventory"><CategoriesPage /></ProtectedRoute>} />
        <Route path="/vendors" element={<ProtectedRoute requiredPermission="inventory"><VendorsPage /></ProtectedRoute>} />
        <Route path="/purchases" element={<ProtectedRoute requiredPermission="inventory"><PurchaseOrdersPage /></ProtectedRoute>} />
        <Route path="/menu" element={<ProtectedRoute requiredPermission="inventory"><MenuPage /></ProtectedRoute>} />
        <Route path="/wastage" element={<ProtectedRoute requiredPermission="inventory"><WastagePage /></ProtectedRoute>} />
        
        <Route path="/sales" element={<ProtectedRoute requiredPermission="sales"><SalesPage /></ProtectedRoute>} />
        <Route path="/salesmen" element={<ProtectedRoute requiredPermission="sales"><SalesmenPage /></ProtectedRoute>} />
        <Route path="/pos-counters" element={<ProtectedRoute requiredPermission="settings"><POSCountersPage /></ProtectedRoute>} />
        <Route path="/billing" element={<ProtectedRoute requiredPermission="settings"><BillingPage /></ProtectedRoute>} />
        
        <Route path="/accounts" element={<ProtectedRoute requiredPermission="accounts"><AccountsPage /></ProtectedRoute>} />
        <Route path="/assets-management" element={<ProtectedRoute requiredPermission="assets"><AssetsManagementPage /></ProtectedRoute>} />
        <Route path="/balance-sheet" element={<ProtectedRoute requiredPermission="balance-sheet"><BalanceSheetPage /></ProtectedRoute>} />
        <Route path="/pnl-report" element={<ProtectedRoute requiredPermission="accounts"><PNLReportPage /></ProtectedRoute>} />
        <Route path="/client-statements" element={<ProtectedRoute requiredPermission="accounts"><ClientStatementsPage /></ProtectedRoute>} />
        
        <Route path="/store-pnl" element={<ProtectedRoute requiredPermission="accounts"><StorePNLReportPage /></ProtectedRoute>} />
        <Route path="/expenses" element={<ProtectedRoute requiredPermission="accounts"><ExpensesPage /></ProtectedRoute>} />

        <Route path="/administration" element={<ProtectedRoute requiredPermission="users"><AdministrationPage /></ProtectedRoute>} />
        <Route path="/roles-management" element={<ProtectedRoute requiredPermission="roles"><RoleManagementPage /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute requiredPermission="settings"><SettingsPage /></ProtectedRoute>} />
        
        <Route path="/factory-dispatch" element={<ProtectedRoute requiredPermission="inventory"><FactoryDispatchPage /></ProtectedRoute>} />
        <Route path="/dispatch-dashboard" element={<ProtectedRoute requiredPermission="inventory"><DispatchDashboardPage /></ProtectedRoute>} />
        
        <Route path="/analytics" element={<ProtectedRoute requiredPermission="analytics"><AnalyticsPage /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute requiredPermission="reports"><ReportsPage /></ProtectedRoute>} />
        <Route path="/food-cost" element={<ProtectedRoute requiredPermission="inventory"><FoodCostPage /></ProtectedRoute>} />
        <Route path="/branch-management" element={<ProtectedRoute requiredPermission="settings"><BranchManagement /></ProtectedRoute>} />
        <Route path="/brand-management" element={<ProtectedRoute requiredPermission="settings"><BrandManagement /></ProtectedRoute>} />
        <Route path="/stock-transfer" element={<ProtectedRoute requiredPermission="inventory"><StockTransfer /></ProtectedRoute>} />
        <Route path="/print-settings" element={<ProtectedRoute requiredPermission="settings"><PrintSettingsPage /></ProtectedRoute>} />

        {/* Super Admin Routes */}
        <Route path="/superadmin/dashboard" element={<ProtectedRoute><SuperAdminDashboard /></ProtectedRoute>} />
        <Route path="/superadmin/tenants" element={<ProtectedRoute><TenantManagement /></ProtectedRoute>} />

        <Route path="/" element={<LandingPage />} />
      </Routes>
      </Router>
    </>
  );
}

function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}

export default App;
