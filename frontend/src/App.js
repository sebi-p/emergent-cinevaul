import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { UserProvider, useUser } from "@/context/UserContext";
import { WatchlistProvider } from "@/context/WatchlistContext";
import { Navbar } from "@/components/layout/Navbar";
import { UserSelect } from "@/pages/UserSelect";
import { HomePage } from "@/pages/HomePage";
import { BrowsePage } from "@/pages/BrowsePage";
import { DetailPage } from "@/pages/DetailPage";
import { WatchlistsPage } from "@/pages/WatchlistsPage";

// Protected route wrapper
const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useUser();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  
  if (!currentUser) {
    return <UserSelect />;
  }
  
  return children;
};

// Main app layout with navbar
const AppLayout = ({ children }) => {
  return (
    <>
      <Navbar />
      <main className="pt-16">
        {children}
      </main>
    </>
  );
};

function AppContent() {
  return (
    <BrowserRouter>
      <WatchlistProvider>
        <Routes>
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <AppLayout>
                  <HomePage />
                </AppLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/browse" 
            element={
              <ProtectedRoute>
                <AppLayout>
                  <BrowsePage />
                </AppLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/movie/:id" 
            element={
              <ProtectedRoute>
                <AppLayout>
                  <DetailPage />
                </AppLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/tv/:id" 
            element={
              <ProtectedRoute>
                <AppLayout>
                  <DetailPage />
                </AppLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/watchlists" 
            element={
              <ProtectedRoute>
                <AppLayout>
                  <WatchlistsPage />
                </AppLayout>
              </ProtectedRoute>
            } 
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster 
          position="bottom-right" 
          theme="dark"
          toastOptions={{
            style: {
              background: '#0f172a',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#f8fafc'
            }
          }}
        />
      </WatchlistProvider>
    </BrowserRouter>
  );
}

function App() {
  return (
    <div className="App">
      <UserProvider>
        <AppContent />
      </UserProvider>
    </div>
  );
}

export default App;
