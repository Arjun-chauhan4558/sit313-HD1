
import { useEffect, useState, useMemo, useCallback } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import "./Bookmarks.css";

function Bookmarks() {
  const [posts, setPosts] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const token = await user.getIdToken();

        const response = await fetch("http://localhost:5000/api/bookmarks", {
          headers: {
            Authorization: "Bearer " + token
          }
        });

        const data = await response.json();
        setPosts(data.posts || []);
      } else {
        setPosts([]);
      }
    });

    return () => unsubscribe();
  }, []);

  const removeBookmark = useCallback(async (postId) => {
    const user = auth.currentUser;

    if (!user) return;

    const token = await user.getIdToken();

    await fetch(`http://localhost:5000/api/bookmarks/${postId}`, {
      method: "DELETE",
      headers: {
        Authorization: "Bearer " + token
      }
    });

    setPosts(previousPosts =>
      previousPosts.filter(post => post.id !== postId)
    );
  }, []);

  const filteredPosts = useMemo(() => {
    return posts.filter(post =>
      post.title.toLowerCase().includes(search.toLowerCase())
    );
  }, [posts, search]);

  return (
    <div className="bookmarks-container">
      <h2>My Bookmarks</h2>

      <input
  className="bookmark-search"
  type="text"
  placeholder="Search your bookmarks..."
  value={search}
  onChange={(e) => setSearch(e.target.value)}
/>

      {filteredPosts.length === 0 ? (
        <p>No bookmarked posts found.</p>
      ) : (
        <div className="bookmarks-list">
          {filteredPosts.map(post => (
            <div className="bookmark-card" key={post.id}>
              <h3>{post.title}</h3>
              <p>Type: {post.postType}</p>

              <p>
                {post.description || post.abstract || post.articleText}
              </p>

              <button onClick={() => removeBookmark(post.id)}>
                Remove Bookmark
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Bookmarks;
