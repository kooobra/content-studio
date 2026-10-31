// Route all browser requests through Node fetch (Node verifies TLS with the proxy CA bundle).
export async function proxyRoutes(ctx) {
  await ctx.route("**/*", async route => {
    const req = route.request();
    const url = req.url();
    if (!url.startsWith("http")) return route.continue();
    try {
      const headers = { ...req.headers() }; delete headers["host"];
      const r = await fetch(url, { method: req.method(), headers, body: ["GET","HEAD"].includes(req.method()) ? undefined : req.postDataBuffer(), redirect: "manual" });
      const body = Buffer.from(await r.arrayBuffer());
      const h = {}; r.headers.forEach((v, k) => { if (!["content-encoding","content-length","transfer-encoding"].includes(k)) h[k] = v; });
      await route.fulfill({ status: r.status, headers: h, body });
    } catch (e) { await route.abort(); }
  });
}
