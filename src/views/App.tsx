import { BrowserRouter, Routes, Route } from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import Books from "./pages/Books";
import Members from "./pages/Members";
import Checkout from "./pages/Checkout";
import Transactions from "./pages/Transactions";
import NotFound from "./pages/NotFound";
import Inventory from "./pages/Inventory";
import AddBook from "./pages/AddBook";
import ApiDocs from "./pages/ApiDocs";
import { SearchProvider } from "./contexts/SearchContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { SidebarProvider } from "./contexts/SidebarContext";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import { TutorialProvider } from "./contexts/TutorialContext";
import ZainabGuide from "./components/ZainabGuide";
import { Outlet } from "react-router-dom";

const DashboardLayout = () => (
  <ThemeProvider>
    <TutorialProvider>
      <SidebarProvider>
        <div className="flex h-screen bg-[#FDFBF7] dark:bg-slate-900 transition-colors duration-300 relative overflow-hidden">
          <Sidebar />
          {/* Responsive main content area */}
          <div className="flex-1 flex flex-col lg:ml-64 h-screen overflow-hidden relative z-10">
            <Header />
            <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 relative">
              <Outlet />
              <ZainabGuide />
            </main>
          </div>
        </div>
      </SidebarProvider>
    </TutorialProvider>
  </ThemeProvider>
);

// import Borrow from './pages/Borrow';

import { Toaster } from "react-hot-toast";

function App() {
  return (
    <SearchProvider>
      <BrowserRouter basename="/">
        <Toaster position="top-right" reverseOrder={false} />
        <Routes>
          <Route path="/" element={<DashboardLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="books" element={<Books />} />
            <Route path="add-books" element={<AddBook />} />
            <Route path="members" element={<Members />} />
            <Route path="checkout" element={<Checkout />} />
            <Route path="transactions" element={<Transactions />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="docs" element={<ApiDocs />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </SearchProvider>
  );
}

export default App;
