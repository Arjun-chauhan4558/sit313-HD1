const { auth, db } = require("./firebaseAdmin");
const { FieldValue } = require("firebase-admin/firestore");
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173"
}));

app.use(express.json());

// Test backend
app.get("/", function (req, res) {
  res.send("Backend is running");
});

// Get logged-in user
async function getUser(req) {
  const token = req.headers.authorization.split(" ")[1];
  const decoded = await auth.verifyIdToken(token);

  const userDoc = await db.collection("users").doc(decoded.uid).get();

  return {
    uid: decoded.uid,
    plan: userDoc.data()?.plan || "Free"
  };
}

// Submit post
app.post("/api/posts", async function (req, res) {
  try {
    const user = await getUser(req);

    const {
      title,
      postType,
      description,
      abstract,
      articleText
    } = req.body;

    const tags = req.body.tags.split(",").map(tag => tag.trim());

    if (!title || !postType || tags.length < 1 || tags.length > 3) {
      return res.status(400).json({ message: "Please complete all required fields." });
    }

    if (postType === "Question" && !description) {
      return res.status(400).json({ message: "Enter a description." });
    }

    if (postType === "Article" && (!abstract || !articleText)) {
      return res.status(400).json({ message: "Enter the abstract and article." });
    }

    await db.collection("posts").add({
      title,
      postType,
      description: description || "",
      abstract: abstract || "",
      articleText: articleText || "",
      tags,
      userId: user.uid,
      plan: user.plan,
      createdAt: FieldValue.serverTimestamp()
    });

    res.status(201).json({ message: "Post submitted successfully!" });

  } catch (error) {
    res.status(500).json({ message: "Could not submit post." });
  }
});

// Browse posts
app.get("/api/posts", async function (req, res) {
  try {
    let plan = "Free";

    if (req.headers.authorization) {
      const user = await getUser(req);
      plan = user.plan;
    }

    let snapshot;

    if (plan === "Paid") {
      snapshot = await db.collection("posts").get();
    } else {
      snapshot = await db.collection("posts")
        .where("plan", "==", "Free")
        .get();
    }

    const posts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate().toISOString()
    }));

    res.json({ posts });

  } catch (error) {
    res.status(500).json({ message: "Could not load posts." });
  }
});

// Newsletter subscription
app.post("/api/newsletter", async function (req, res) {
  try {
    const email = req.body.email;

    if (!email) {
      return res.status(400).json({ message: "Enter your email." });
    }

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": process.env.BREVO_API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        sender: {
          name: "Newsletter",
          email: process.env.BREVO_FROM_EMAIL
        },
        to: [{ email }],
        subject: "Welcome to our newsletter!",
        htmlContent: "<h2>Welcome!</h2><p>Thank you for subscribing.</p>"
      })
    });

    if (!response.ok) {
      return res.status(500).json({ message: "Could not send email." });
    }

    res.json({ message: "Subscription successful!" });

  } catch (error) {
    res.status(500).json({ message: "Something went wrong." });
  }
});

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, function () {
  console.log("Server running on port " + PORT);
});