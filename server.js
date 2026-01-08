const express = require("express");

const app = express();
app.use(express.json({ limit: "10mb" }));

// Request log (helps debugging in EasyPanel)
app.use((req, _res, next) => {
  console.log(`[REQ] ${req.method} ${req.path}`);
  next();
});

// Root endpoint
app.get("/", (_req, res) => {
  res.status(200).send("ok");
});

// Healthcheck endpoint
app.get("/health", (_req, res) => {
  res.status(200).json({ ok: true });
});

// ChartJS lazy initialization
const WIDTH = 600;
const HEIGHT = 400;

let chartJSNodeCanvas;

function getCanvas() {
  if (!chartJSNodeCanvas) {
    const { ChartJSNodeCanvas } = require("chartjs-node-canvas");
    chartJSNodeCanvas = new ChartJSNodeCanvas({
      width: WIDTH,
      height: HEIGHT,
      backgroundColour: "white"
    });
  }
  return chartJSNodeCanvas;
}

async function renderChart(config) {
  const canvas = getCanvas();
  const buffer = await canvas.renderToBuffer(config);
  return `data:image/png;base64,${buffer.toString("base64")}`;
}

// Render endpoint
app.post("/render", async (req, res) => {
  try {
    const { challenge, impact, investment, roi } = req.body;

    const challenge_png = await renderChart({
      type: "doughnut",
      data: {
        labels: challenge.labels,
        datasets: [{ data: challenge.data }]
      }
    });

    const impact_png = await renderChart({
      type: "radar",
      data: {
        labels: impact.labels,
        datasets: [
          { label: "Actual", data: impact.current },
          { label: "NeuraSolutions", data: impact.target }
        ]
      }
    });

    const investment_png = await renderChart({
      type: "bar",
      data: {
        labels: investment.labels,
        datasets: [{ data: investment.data }]
      }
    });

    const roi_png = await renderChart({
      type: "line",
      data: {
        labels: roi.labels,
        datasets: [
          { label: "Manual", data: roi.manual },
          { label: "NeuraSolutions", data: roi.neura }
        ]
      }
    });

    res.json({
      challenge_png,
      impact_png,
      investment_png,
      roi_png
    });
  } catch (err) {
    console.error("Render error:", err);
    res.status(500).json({
      error: "Render failed",
      detail: String(err?.message || err)
    });
  }
});

// Start server
const PORT = Number(process.env.PORT || 80);
const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`chart-renderer listening on port ${PORT}`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down...");
  server.close(() => {
    process.exit(0);
  });
});
