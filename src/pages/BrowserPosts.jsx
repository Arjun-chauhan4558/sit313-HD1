
import { useEffect, useState } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import "./BrowserPosts.css";

function BrowsePosts() {
  const [posts, setPosts] = useState([]);
  const [hiddenPosts, setHiddenPosts] = useState([]);
  const [expandedPost, setExpandedPost] = useState("");
  const [postType, setPostType] = useState("All");
  const [plan, setPlan] = useState("All");
  const [date, setDate] = useState("");
  const [tag, setTag] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      let headers = {};

      if (user) {
        const token = await user.getIdToken();
        headers.Authorization = "Bearer " + token;
      }

      const response = await fetch("http://localhost:5000/api/posts", {
        headers
      });

      const data = await response.json();
      setPosts(data.posts);
    });

    return () => unsubscribe();
  }, []);

  function hidePost(id) {
    setHiddenPosts([...hiddenPosts, id]);
  }

  function resetFilters() {
    setPostType("All");
    setPlan("All");
    setDate("");
    setTag("");
    setHiddenPosts([]);
  }

  const filteredPosts = posts.filter((post) => {
    return (
      !hiddenPosts.includes(post.id) &&
      (postType === "All" || post.postType === postType) &&
      (plan === "All" || post.plan === plan) &&
      (!date || post.createdAt?.startsWith(date)) &&
      (!tag || post.tags?.some(item =>
        item.toLowerCase().includes(tag.toLowerCase())
      ))
    );
  });

  return (
    <div className="browse-container">
      <h2>Browse Posts</h2>

      <div className="browse-filters">
        <select value={postType} onChange={(e) => setPostType(e.target.value)}>
          <option value="All">All Types</option>
          <option value="Question">Questions</option>
          <option value="Article">Articles</option>
        </select>

        <select value={plan} onChange={(e) => setPlan(e.target.value)}>
          <option value="All">All Plans</option>
          <option value="Free">Free</option>
          <option value="Paid">Paid</option>
        </select>

        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />

        <input
          type="text"
          placeholder="Search by tag"
          value={tag}
          onChange={(e) => setTag(e.target.value)}
        />

        <button onClick={resetFilters}>Reset</button>
      </div>

      {filteredPosts.length === 0 && <p>No posts found.</p>}

      <div className="browse-posts">
        {filteredPosts.map((post) => (
          <div className="browse-post-card" key={post.id}>
            <div className="post-heading">
              <h3>{post.title}</h3>
              <button onClick={() => hidePost(post.id)}>Hide</button>
            </div>

            <p>
              {post.postType} | {post.plan} |{" "}
              {post.createdAt
                ? new Date(post.createdAt).toLocaleDateString()
                : "Date unavailable"}
            </p>

            <p>Tags: {post.tags?.join(", ")}</p>

            {post.postType === "Question" ? (
              <p>{post.description}</p>
            ) : (
              <p>{post.abstract}</p>
            )}

            {expandedPost === post.id && post.postType === "Article" && (
              <p>{post.articleText}</p>
            )}

            <button
              onClick={() =>
                setExpandedPost(
                  expandedPost === post.id ? "" : post.id
                )
              }
            >
              {expandedPost === post.id ? "Show Less" : "Expand"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default BrowsePosts;
