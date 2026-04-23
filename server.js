const express = require("express");
const axios = require("axios");
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "544220144669-dm29cjddvbb0e3tgh0gom57me9rha79b.apps.googleusercontent.com";
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET; 
const REDIRECT_URI = process.env.REDIRECT_URI || "http://localhost:5173";
const JWT_SECRET = process.env.JWT_SECRET || "uside-super-secret-key";

console.log("-----------------------------------------");
console.log("US IDE AUTH SERVER STARTING");
console.log(`Client ID: ${CLIENT_ID}`);
console.log(`Redirect URI: ${REDIRECT_URI}`);
console.log("-----------------------------------------");

app.post("/auth/google", async (req, res) => {
    const { code, web_redirect_uri } = req.body;

    if (!code) {
        return res.status(400).json({ error: "Missing authorization code" });
    }

    // Use the redirect URI provided by the web client, or fall back to the default
    const finalRedirectUri = web_redirect_uri || REDIRECT_URI;

    try {
        console.log("Exchanging code for token...");
        const tokenRes = await axios.post("https://oauth2.googleapis.com/token", {
            code,
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            redirect_uri: finalRedirectUri,
            grant_type: "authorization_code"
        });

        const { access_token } = tokenRes.data;
        console.log("Token received, fetching user info...");

        const userRes = await axios.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            {
                headers: {
                    Authorization: `Bearer ${access_token}`
                }
            }
        );

        const user = userRes.data;
        console.log(`Successfully authenticated user: ${user.email}`);

        // Generate a session token
        const sessionToken = jwt.sign(
            { email: user.email, name: user.name },
            JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.json({
            token: sessionToken,
            user: {
                name: user.name,
                email: user.email,
                picture: user.picture
            }
        });

    } catch (err) {
        const errorDetail = err.response ? JSON.stringify(err.response.data) : err.message;
        console.error("Google Auth API Error:", errorDetail);
        res.status(500).json({ 
            error: "Google Authentication Failed", 
            details: errorDetail 
        });
    }
});

// ─── AI Chat (Proxy to Python Backend) ──────
app.post("/api/ai-chat", async (req, res) => {
    try {
        console.log("[Proxy] Forwarding AI request to Python backend...");
        const pythonRes = await axios.post("http://localhost:8000/api/ai-chat", req.body);
        res.json(pythonRes.data);
    } catch (err) {
        console.error("[Proxy Error] AI Backend unreachable:", err.message);
        res.status(503).json({ 
            error: "Could not reach AI. Check if the backend is running and the Groq API key is set.",
            details: err.message 
        });
    }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
