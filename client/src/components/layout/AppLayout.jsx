import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../common/Navbar';
import Sidebar from '../common/Sidebar';

const AppLayout = () => {
  return (
    <div className="min-h-screen bg-[#f4f5fa] text-slate-900 flex flex-col font-sans antialiased selection:bg-slate-900 selection:text-white">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
