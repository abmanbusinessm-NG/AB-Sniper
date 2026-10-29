import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import PrivateRoute from "./components/PrivateRoute";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import EmptyPage from "./pages/EmptyPage";
import Certificate from "./pages/Certificate";
import Payout from "./pages/Payout";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected routes */}
        <Route
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route path="/dashboard" element={<EmptyPage />} />
          <Route path="/learn" element={<EmptyPage />} />
          <Route path="/weekly-analysis" element={<EmptyPage />} />
          <Route path="/journal" element={<EmptyPage />} />
          <Route path="/certificate" element={<Certificate />} />
          <Route path="/payout" element={<EmptyPage />} />
          <Route path="/payout" element={<Payout />} />
          <Route path="/contact-social-media" element={<EmptyPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;