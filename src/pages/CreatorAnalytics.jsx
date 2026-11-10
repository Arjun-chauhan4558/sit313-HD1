import { useEffect, useState } from "react";
import { auth } from "../firebase";
import "./CreatorAnalytics.css";
function CreatorAnalytics() {
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    async function getAnalytics() {
      const user = auth.currentUser;

      if (!user) return;

      const token = await user.getIdToken();

      const response = await fetch("http://localhost:5000/api/analytics", {
        headers: {
          Authorization: "Bearer " + token
        }
      });

      const data = await response.json();
      setAnalytics(data);
    }

    getAnalytics();
  }, []);

  if (!analytics) {
    return <p>Loading analytics...</p>;
  }

  return (
    <div className="analytics-container">
      <h2>Creator Analytics</h2>

      <div className="analytics-cards">
        <div>
          <h3>Total Posts</h3>
          <p>{analytics.totalPosts}</p>
        </div>

        <div>
          <h3>Total Views</h3>
          <p>{analytics.totalViews}</p>
        </div>

        <div>
          <h3>Articles</h3>
          <p>{analytics.articleCount}</p>
        </div>

        <div>
          <h3>Questions</h3>
          <p>{analytics.questionCount}</p>
        </div>
      </div>

      <h3>Top Performing Posts</h3>

      {analytics.topPosts.length === 0 ? (
        <p>You haven't created any posts yet.</p>
      ) : (
        analytics.topPosts.map(post => (
          <div key={post.id} className="analytics-post">
            <h4>{post.title}</h4>
            <p>Type: {post.postType}</p>
            <p>Views: {post.views}</p>
          </div>
        ))
      )}
    </div>
  );
}

export default CreatorAnalytics;