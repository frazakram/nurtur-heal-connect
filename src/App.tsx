import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "./components/layout/Layout";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { AuthProvider } from "./admin/context/AuthContext";
import { HospitalProvider } from "./admin/context/HospitalContext";
import { AdminLayout } from "./admin/components/AdminLayout";
import { Protected } from "./admin/components/Protected";

// Route components are lazy-loaded so the public site ships a small bundle
// and the heavy admin app is only fetched when staff actually open it.
const Home = lazy(() => import("./pages/Home.tsx"));
const About = lazy(() => import("./pages/About.tsx"));
const Services = lazy(() => import("./pages/Services.tsx"));
const Doctors = lazy(() => import("./pages/Doctors.tsx"));
const Blog = lazy(() => import("./pages/Blog.tsx"));
const Contact = lazy(() => import("./pages/Contact.tsx"));
const Portal = lazy(() => import("./pages/Portal.tsx"));
const Privacy = lazy(() => import("./pages/Privacy.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));
const AdminLogin = lazy(() => import("./admin/pages/Login"));
const Dashboard = lazy(() => import("./admin/pages/Dashboard"));
const Patients = lazy(() => import("./admin/pages/Patients"));
const PatientDetail = lazy(() => import("./admin/pages/PatientDetail"));
const Appointments = lazy(() => import("./admin/pages/Appointments"));
const Beds = lazy(() => import("./admin/pages/Beds"));
const StaffPage = lazy(() => import("./admin/pages/Staff"));
const Expenses = lazy(() => import("./admin/pages/Expenses"));
const Billing = lazy(() => import("./admin/pages/Billing"));
const Invoice = lazy(() => import("./admin/pages/Invoice"));
const Inventory = lazy(() => import("./admin/pages/Inventory"));
const Reports = lazy(() => import("./admin/pages/Reports"));
const AdminSettings = lazy(() => import("./admin/pages/Settings"));
const BlogAdmin = lazy(() => import("./admin/pages/BlogAdmin"));
const Messages = lazy(() => import("./admin/pages/Messages"));
const Followups = lazy(() => import("./admin/pages/Followups"));

const queryClient = new QueryClient();

const Loading = () => (
  <div className="min-h-screen grid place-items-center text-primary-deep font-semibold">
    Loading…
  </div>
);

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <ErrorBoundary>
          <AuthProvider>
            <HospitalProvider>
              <BrowserRouter>
                <Suspense fallback={<Loading />}>
                  <Routes>
                    <Route element={<Layout />}>
                      <Route path="/" element={<Home />} />
                      <Route path="/about" element={<About />} />
                      <Route path="/services" element={<Services />} />
                      <Route path="/doctors" element={<Doctors />} />
                      <Route path="/blog" element={<Blog />} />
                      <Route path="/contact" element={<Contact />} />
                      <Route path="/portal" element={<Portal />} />
                      <Route path="/privacy" element={<Privacy />} />
                    </Route>

                    <Route path="/admin/login" element={<AdminLogin />} />
                    <Route path="/admin" element={<Protected><AdminLayout /></Protected>}>
                      <Route index element={<Protected page="dashboard"><Dashboard /></Protected>} />
                      <Route path="dashboard" element={<Protected page="dashboard"><Dashboard /></Protected>} />
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
                      <Route path="blog-admin" element={<Protected page="blogPosts"><BlogAdmin /></Protected>} />
                      <Route path="messages" element={<Protected page="messages"><Messages /></Protected>} />
                      <Route path="followups" element={<Protected page="followups"><Followups /></Protected>} />
                    </Route>

                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </BrowserRouter>
            </HospitalProvider>
          </AuthProvider>
        </ErrorBoundary>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
