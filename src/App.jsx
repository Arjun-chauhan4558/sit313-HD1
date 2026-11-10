
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Articles from "./components/Articles";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Post from "./pages/Post";
import BrowsePosts from "./pages/BrowserPosts";
import Pricing from "./pages/Pricing";
import VerifyOTP from "./pages/VerifyOTP";
import CreatorAnalytics from "./pages/CreatorAnalytics";
import Bookmarks from "./pages/Bookmarks";
import { AuthProvider } from "./context/AuthContext";
import "./App.css";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />

        <div className="post-navigation">
          <Link to="/post">Create Post</Link>
          <Link to="/browse-posts">Browse Posts</Link>
          <Link to="/analytics">Creator Analytics</Link>
          <Link to="/bookmarks">My Bookmarks</Link>
        </div>

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/verify-otp" element={<VerifyOTP />} />
          <Route path="/post" element={<Post />} />
          <Route path="/browse-posts" element={<BrowsePosts />} />
          <Route path="/Article" element={<Articles />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/analytics" element={<CreatorAnalytics />} />
          <Route path="/bookmarks" element={<Bookmarks />} />
        </Routes>

        <Footer />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
