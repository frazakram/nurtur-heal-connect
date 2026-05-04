import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "./components/layout/Layout";
import Home from "./pages/Home.tsx";
import About from "./pages/About.tsx";
import Services from "./pages/Services.tsx";
import Doctors from "./pages/Doctors.tsx";
import Blog from "./pages/Blog.tsx";
import Contact from "./pages/Contact.tsx";
import Portal from "./pages/Portal.tsx";
import NotFound from "./pages/NotFound.tsx";
import { AuthProvider } from "./admin/context/AuthContext";
import { HospitalProvider } from "./admin/context/HospitalContext";
import { AdminLayout } from "./admin/components/AdminLayout";
import { Protected } from "./admin/components/Protected";
import AdminLogin from "./admin/pages/Login";
import Dashboard from "./admin/pages/Dashboard";
import Patients from "./admin/pages/Patients";
import PatientDetail from "./admin/pages/PatientDetail";
import Appointments from "./admin/pages/Appointments";
import Beds from "./admin/pages/Beds";
import StaffPage from "./admin/pages/Staff";
import Expenses from "./admin/pages/Expenses";
import Billing from "./admin/pages/Billing";
import Invoice from "./admin/pages/Invoice";
import Inventory from "./admin/pages/Inventory";
import Reports from "./admin/pages/Reports";
import AdminSettings from "./admin/pages/Settings";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthProvider>
          <HospitalProvider>
            <BrowserRouter>
              <Routes>
                <Route element={<Layout />}>
                  <Route path="/" element={<Home />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/services" element={<Services />} />
                  <Route path="/doctors" element={<Doctors />} />
                  <Route path="/blog" element={<Blog />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/portal" element={<Portal />} />
                </Route>

                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin" element={<Protected><AdminLayout /></Protected>}>
                  <Route index element={<Dashboard />} />
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="patients" element={<Protected page="patients"><Patients /></Protected>} />
                  <Route path="patients/:id" element={<Protected page="patients"><PatientDetail /></Protected>} />
                  <Route path="appointments" element={<Protected page="appointments"><Appointments /></Protected>} />
                  <Route path="beds" element={<Protected page="beds"><Beds /></Protected>} />
                  <Route path="staff" element={<Protected page="staff"><StaffPage /></Protected>} />
                  <Route path="expenses" element={<Protected page="expenses"><Expenses /></Protected>} />
                  <Route path="billing" element={<Protected page="billing"><Billing /></Protected>} />
                  <Route path="billing/:id" element={<Protected page="billing"><Invoice /></Protected>} />
                  <Route path="inventory" element={<Protected page="inventory"><Inventory /></Protected>} />
                  <Route path="reports" element={<Protected page="reports"><Reports /></Protected>} />
                  <Route path="settings" element={<Protected page="settings"><AdminSettings /></Protected>} />
                </Route>

                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </HospitalProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
