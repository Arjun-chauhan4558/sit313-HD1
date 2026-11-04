
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Articles from "./components/Articles";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Post from "./pages/Post";
import BrowsePosts from "./pages/BrowserPosts";
import "./App.css";

function App() {
  return (
    <AuthProviderWrapper />
  );
}

function AuthProviderWrapper() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />

        <div className="post-navigation">
          <Link to="/post">Create Post</Link>
          <Link to="/browse-posts">Browse Posts</Link>
        </div>

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/post" element={<Post />} />
          <Route path="/browse-posts" element={<BrowsePosts />} />
          <Route path="/Article" element={<Articles />} />
        </Routes>

        <Footer />
      </BrowserRouter>
    </AuthProvider>
  );
}

import { AuthProvider } from "./context/AuthContext";

export default App;
