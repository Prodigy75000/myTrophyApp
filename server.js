// server.js
const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]); // ✅ force reliable DNS

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const {
  exchangeNpssoForCode,
  exchangeCodeForAccessToken,
  getProfileFromUserName,
} = require("psn-api");
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const NPSSO = process.env.PSN_NPSSO;
let accessCache = null;

async function getAccessToken() {
  if (accessCache && Date.now() < accessCache.expiresAt) {
    return accessCache.token;
  }
  const code = await exchangeNpssoForCode(NPSSO);
  const tokens = await exchangeCodeForAccessToken(code);
  accessCache = {
    token: tokens.accessToken,
    expiresAt: Date.now() + tokens.expiresIn * 1000,
  };
  return accessCache.token;
}

// ---------------- LOGIN ----------------
app.get("/api/login", async (req, res) => {
  try {
    const authorization = await exchangeNpssoForCode(NPSSO);
    const tokenData = await exchangeCodeForAccessToken(authorization);

    // decode account_id
    let decodedPayload;
    try {
      const base64Payload = tokenData.accessToken.split(".")[1];
      const normalized = base64Payload.replace(/-/g, "+").replace(/_/g, "/");
      decodedPayload = JSON.parse(
        Buffer.from(normalized, "base64").toString("utf8")
      );
    } catch (e) {
      console.error("⚠️ Failed to decode accessToken:", e.message);
    }

    const accountId =
      decodedPayload?.account_id ||
      decodedPayload?.accountId ||
      tokenData.accountId ||
      tokenData.user_id ||
      null;

    console.log("✅ PSN access token retrieved for:", accountId);
    res.json({
      accessToken: tokenData.accessToken,
      refreshToken: tokenData.refreshToken,
      expiresIn: tokenData.expiresIn,
      accountId,
      tokenType: tokenData.tokenType || "Bearer",
    });
  } catch (err) {
    console.error("❌ Login error:", err.message);
    res
      .status(500)
      .json({ error: "Failed to retrieve PSN access token", details: err.message });
  }
});

// ---------------- PROFILE ----------------
app.get("/api/profile/:username", async (req, res) => {
  try {
    const accessToken = await getAccessToken();
    const profile = await getProfileFromUserName(accessToken, req.params.username);
    res.json(profile);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ---------------- TROPHIES ----------------
app.get("/api/trophies/:accountId", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ error: "Missing or invalid Authorization header" });
    }

    const accessToken = authHeader.split(" ")[1];
    const accountId = req.params.accountId;
    const url = `https://m.np.playstation.com/api/trophy/v1/users/${accountId}/trophyTitles`;

    console.log("🌐 Fetching trophies from:", url);

    const psnRes = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Accept-Language": "en-US",
      },
    }).catch((err) => {
      // handle network/DNS errors
      console.error("❌ Fetch network error:", err.message);
      return { ok: false, status: 0, text: async () => err.message };
    });

    if (!psnRes.ok) {
      const errorText = await psnRes.text();
      console.error("❌ Sony API error:", psnRes.status, errorText);
      if (psnRes.status === 0 && /ENOTFOUND/i.test(errorText)) {
        return res
          .status(503)
          .json({ error: "DNS lookup failed for Sony API", details: errorText });
      }
      if (psnRes.status === 401) {
        return res.status(401).json({ error: "Invalid or expired token" });
      }
      return res.status(psnRes.status).json({
        error: `Sony API returned ${psnRes.status}`,
        details: errorText,
      });
    }

    const data = await psnRes.json();
    console.log("📡 Sony response 200 OK, items:", data?.totalItemCount);
    res.json(data);
  } catch (err) {
    console.error("❌ /api/trophies error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ---------------- MISC TEST ----------------
app.get("/api/test-npsso", async (req, res) => {
  try {
    const code = await exchangeNpssoForCode(process.env.PSN_NPSSO);
    res.json({ status: "valid", code });
  } catch (err) {
    res.status(400).json({ status: "invalid", message: err.message });
  }
});

app.listen(4000, () => console.log("Trophy Hub proxy running on port 4000"));