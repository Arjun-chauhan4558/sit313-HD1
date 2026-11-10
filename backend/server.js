
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const { auth, db } = require("./firebaseAdmin");
const { FieldValue } = require("firebase-admin/firestore");

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173"
}));

app.use(express.json());


// Get logged-in user
async function getUser(req) {
  const token = req.headers.authorization?.split(" ")[1];
  const decoded = await auth.verifyIdToken(token);
  const user = await db.collection("users").doc(decoded.uid).get();

  return {
    uid: decoded.uid,
    plan: user.data()?.plan || "Free"
  };
}


// Home
app.get("/", (req, res) => {
  res.send("Backend is running");
});


// Create post
app.post("/api/posts", async (req, res) => {
  try {
    const user = await getUser(req);
    const { title, postType, description, abstract, articleText } = req.body;
    const tags = (req.body.tags || "").split(",").map(t => t.trim()).filter(t => t);

    if (!title || !postType || tags.length < 1 || tags.length > 3) {
      return res.status(400).json({ message: "Complete all required fields." });
    }

    if (postType === "Question" && !description) {
      return res.status(400).json({ message: "Enter a description." });
    }

    if (postType === "Article" && (!abstract || !articleText)) {
      return res.status(400).json({ message: "Enter the abstract and article." });
    }

    await db.collection("posts").add({
      title, postType,
      description: description || "",
      abstract: abstract || "",
      articleText: articleText || "",
      tags,
      userId: user.uid,
      plan: user.plan,
      views: 0,
      createdAt: FieldValue.serverTimestamp()
    });

    res.json({ message: "Post submitted successfully!" });
  } catch (error) {
    res.status(500).json({ message: "Could not submit post." });
  }
});


// Browse posts
app.get("/api/posts", async (req, res) => {
  try {
    let plan = "Free";

    if (req.headers.authorization) {
      plan = (await getUser(req)).plan;
    }

    const snapshot = plan === "Paid"
      ? await db.collection("posts").get()
      : await db.collection("posts").where("plan", "==", "Free").get();

    const posts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      views: doc.data().views || 0,
      createdAt: doc.data().createdAt?.toDate().toISOString()
    }));

    res.json({ posts });
  } catch (error) {
    res.status(500).json({ message: "Could not load posts." });
  }
});


// Count views
app.post("/api/posts/:id/view", async (req, res) => {
  try {
    const user = await getUser(req);
    const post = db.collection("posts").doc(req.params.id);
    const data = await post.get();

    if (!data.exists) {
      return res.status(404).json({ message: "Post not found." });
    }

    if (data.data().userId !== user.uid) {
      await post.update({ views: FieldValue.increment(1) });
    }

    res.json({ message: "View counted." });
  } catch (error) {
    res.status(500).json({ message: "Could not count view." });
  }
});


// Save bookmark
app.post("/api/bookmarks/:postId", async (req, res) => {
  try {
    const user = await getUser(req);
    const post = await db.collection("posts").doc(req.params.postId).get();

    if (!post.exists) {
      return res.status(404).json({ message: "Post not found." });
    }

    await db.collection("users").doc(user.uid)
      .collection("bookmarks").doc(req.params.postId)
      .set({
        postId: req.params.postId,
        createdAt: FieldValue.serverTimestamp()
      });

    res.json({ message: "Post bookmarked." });
  } catch (error) {
    res.status(500).json({ message: "Could not save bookmark." });
  }
});


// Get bookmarks
app.get("/api/bookmarks", async (req, res) => {
  try {
    const user = await getUser(req);

    const snapshot = await db.collection("users").doc(user.uid)
      .collection("bookmarks").get();

    const posts = [];

    for (const bookmark of snapshot.docs) {
      const post = await db.collection("posts").doc(bookmark.id).get();

      if (post.exists) {
        posts.push({
          id: post.id,
          ...post.data(),
          views: post.data().views || 0,
          createdAt: post.data().createdAt?.toDate().toISOString()
        });
      }
    }

    res.json({ posts });
  } catch (error) {
    res.status(500).json({ message: "Could not load bookmarks." });
  }
});


// Remove bookmark
app.delete("/api/bookmarks/:postId", async (req, res) => {
  try {
    const user = await getUser(req);

    await db.collection("users").doc(user.uid)
      .collection("bookmarks").doc(req.params.postId).delete();

    res.json({ message: "Bookmark removed." });
  } catch (error) {
    res.status(500).json({ message: "Could not remove bookmark." });
  }
});


// Creator analytics
app.get("/api/analytics", async (req, res) => {
  try {
    const user = await getUser(req);

    const snapshot = await db.collection("posts")
      .where("userId", "==", user.uid).get();

    const posts = snapshot.docs.map(doc => ({
      id: doc.id,
      title: doc.data().title,
      postType: doc.data().postType,
      views: doc.data().views || 0
    }));

    const totalViews = posts.reduce((sum, p) => sum + p.views, 0);

    res.json({
      totalPosts: posts.length,
      totalViews,
      articleCount: posts.filter(p => p.postType === "Article").length,
      questionCount: posts.filter(p => p.postType === "Question").length,
      topPosts: [...posts].sort((a, b) => b.views - a.views).slice(0, 5)
    });
  } catch (error) {
    res.status(500).json({ message: "Could not load analytics." });
  }
});


// Send OTP
app.post("/api/auth/send-otp", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Please log in first." });
    }

    const user = await auth.verifyIdToken(token, true);
    const otp = crypto.randomInt(100000, 1000000).toString();

    const hash = crypto.createHmac("sha256", process.env.OTP_SECRET)
      .update(user.uid + ":" + otp).digest("hex");

    await db.collection("otpChallenges").doc(user.uid).set({
      otpHash: hash,
      expiresAt: Date.now() + 300000,
      attempts: 0
    });

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": process.env.BREVO_API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        sender: { name: "Login OTP", email: process.env.BREVO_FROM_EMAIL },
        to: [{ email: user.email }],
        subject: "Your Login OTP",
        htmlContent: `<h2>Your OTP is ${otp}</h2><p>Expires in 5 minutes.</p>`
      })
    });

    if (!response.ok) {
      await db.collection("otpChallenges").doc(user.uid).delete();
      return res.status(500).json({ message: "Could not send OTP." });
    }

    res.json({ message: "OTP sent successfully." });
  } catch (error) {
    res.status(500).json({ message: "Could not send OTP." });
  }
});


// Verify OTP
app.post("/api/auth/verify-otp", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Please log in first." });
    }

    const user = await auth.verifyIdToken(token, true);
    const ref = db.collection("otpChallenges").doc(user.uid);
    const doc = await ref.get();

    if (!doc.exists) {
      return res.status(400).json({ message: "OTP not found." });
    }

    const data = doc.data();

    if (Date.now() > data.expiresAt) {
      await ref.delete();
      return res.status(400).json({ message: "OTP expired." });
    }

    if (data.attempts >= 5) {
      await ref.delete();
      return res.status(429).json({ message: "Too many attempts." });
    }

    const hash = crypto.createHmac("sha256", process.env.OTP_SECRET)
      .update(user.uid + ":" + String(req.body.otp || ""))
      .digest("hex");

    const match = crypto.timingSafeEqual(
      Buffer.from(data.otpHash, "hex"),
      Buffer.from(hash, "hex")
    );

    if (!match) {
      await ref.update({ attempts: data.attempts + 1 });
      return res.status(400).json({ message: "Incorrect OTP." });
    }

    await ref.delete();

    const customToken = await auth.createCustomToken(user.uid, {
      mfaVerified: true
    });

    res.json({ message: "OTP verified.", customToken });
  } catch (error) {
    res.status(500).json({ message: "Verification failed." });
  }
});


// Newsletter
app.post("/api/newsletter", async (req, res) => {
  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": process.env.BREVO_API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        sender: { name: "Newsletter", email: process.env.BREVO_FROM_EMAIL },
        to: [{ email: req.body.email }],
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
app.listen(process.env.PORT || 5000, () => {
  console.log("Server running on port " + (process.env.PORT || 5000));
});
