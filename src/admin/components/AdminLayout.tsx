import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

export const AdminLayout = () => {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen flex bg-secondary/40">
      <div className="print:hidden">
        <Sidebar open={open} onClose={() => setOpen(false)} />
      </div>
      <div className="flex-1 flex flex-col min-w-0">
        <div className="print:hidden">
          <TopBar onMenu={() => setOpen(true)} />
        </div>
        <main className="flex-1 p-4 lg:p-6 print:p-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
};