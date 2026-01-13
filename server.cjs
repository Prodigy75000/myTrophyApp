// server.js
const {Buffer} = require("buffer");
const dns = require("dns");
dns.setServers([ "8.8.8.8", "1.1.1.1" ]);  // ✅ force reliable DNS

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const {
    exchangeNpssoForCode,
    exchangeCodeForAccessToken,
    getProfileFromUserName,
} = require("psn-api");
const fetch = (... args) => import("node-fetch").then(({default : fetch}) => fetch(... args));

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const NPSSO = process.env.PSN_NPSSO;
let accessCache = null;
const trophyCache = new Map();
async function getAccessToken() {
  if (accessCache && Date.now() < accessCache.expiresAt) {
    return accessCache.token;
  }
  const code = await exchangeNpssoForCode(NPSSO);
  const tokens = await exchangeCodeForAccessToken(code);
  accessCache = {
    token : tokens.accessToken,
    expiresAt : Date.now() + tokens.expiresIn * 1000,
  };
  return accessCache.token;
}

// ----- TEST ROUTE ----
app.get("/ping", (req, res) => {
  console.log("🏓 PING HIT");
  res.send("pong");
});

// ---------------- LOGIN ----------------
app.get("/api/login", async (req, res) => {
  try {
    const authorization = await exchangeNpssoForCode(NPSSO);
    const tokenData = await exchangeCodeForAccessToken(authorization);

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
    res.status(500).json({
      error: "Failed to retrieve PSN access token",
      details: err.message,
    });
  }
}); 
// ---------------- PROFILE ----------------
app.get("/api/profile/:username", async (req, res) => {
  try {
    const accessToken = await getAccessToken();
    const profile = await getProfileFromUserName(
      accessToken,
      req.params.username
    );
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
      if (!authHeader?.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Missing token" });
      }

      const accessToken = authHeader.split(" ")[1];
      const { accountId } = req.params;

      const baseUrl =
        `https://m.np.playstation.com/api/trophy/v1/users/${accountId}/trophyTitles`;

      let allTitles = [];
      let offset = 0;
      const limit = 100;

      while (true) {
        const url = `${baseUrl}?limit=${limit}&offset=${offset}`;

        const r = await fetch(url, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Accept-Language": "en-US",
          },
        });

        if (!r.ok) {
          const t = await r.text();
          return res.status(r.status).json({ error: t });
        }

        const json = await r.json();
        const page = json.trophyTitles ?? [];

        allTitles.push(...page);

        if (page.length < limit) break;
        offset += limit;
      }

      res.json({
        totalItemCount: allTitles.length,
        trophyTitles: allTitles,
      });

    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });
  // ---------------- GAME TROPHIES ----------------
app.get("/api/trophies/:accountId/:npCommunicationId", async (req, res) => {
  console.log("🔥 GAME TROPHIES ROUTE HIT", req.params);
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing token" });
    }

    const accessToken = authHeader.split(" ")[1];
    const { accountId, npCommunicationId } = req.params;

    const url =
      `https://m.np.playstation.com/api/trophy/v1/users/${accountId}` +
      `/npCommunicationIds/${npCommunicationId}` +
      `/trophyGroups/all/trophies`;

    const r = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Accept-Language": "en-US",
      },
    });

    if (!r.ok) {
      const t = await r.text();
      return res.status(r.status).json({ error: t });
    }

    const json = await r.json();

    // IMPORTANT: normalize for frontend
    res.json({
      trophies: json.trophies ?? [],
    });

  } catch (err) {
    console.error(err);
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

app.listen(4000, "0.0.0.0", () =>
  console.log("Trophy Hub proxy running on port 4000")
);