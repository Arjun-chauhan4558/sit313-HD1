
import { useState } from "react";
import { auth } from "../firebase";
import "./Post.css";

function Post() {
  const [postType, setPostType] = useState("Question");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [abstract, setAbstract] = useState("");
  const [articleText, setArticleText] = useState("");
  const [tags, setTags] = useState("");

  async function handlePost(e) {
    e.preventDefault();

    if (!auth.currentUser) {
      alert("Please log in before submitting.");
      return;
    }

    const token = await auth.currentUser.getIdToken();

    const response = await fetch("http://localhost:5000/api/posts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      },
      body: JSON.stringify({
        title: title,
        postType: postType,
        description: description,
        abstract: abstract,
        articleText: articleText,
        tags: tags
      })
    });

    const data = await response.json();

    alert(data.message);

    if (response.ok) {
      setTitle("");
      setDescription("");
      setAbstract("");
      setArticleText("");
      setTags("");
    }
  }

  return (
    <div className="post-container">
      <h2>Create a Post</h2>

      <form onSubmit={handlePost}>

        <div className="post-type">
          <label>
            <input
              type="radio"
              checked={postType === "Question"}
              onChange={() => setPostType("Question")}
            />
            Question
          </label>

          <label>
            <input
              type="radio"
              checked={postType === "Article"}
              onChange={() => setPostType("Article")}
            />
            Article
          </label>
        </div>

        <input
          type="text"
          placeholder="Enter post title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        {postType === "Question" ? (
          <textarea
            placeholder="Describe your question..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        ) : (
          <>
            <textarea
              placeholder="Article abstract"
              value={abstract}
              onChange={(e) => setAbstract(e.target.value)}
              required
            />

            <textarea
              placeholder="Write your article..."
              value={articleText}
              onChange={(e) => setArticleText(e.target.value)}
              required
            />
          </>
        )}

        <input
          type="text"
          placeholder="Tags (separate with commas, maximum 3)"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          required
        />

        <button type="submit">Submit Post</button>

      </form>
    </div>
  );
}

export default Post;
