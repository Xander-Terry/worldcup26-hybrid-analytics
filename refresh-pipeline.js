const { execSync } = require("child_process");
const path = require("path");

const PYTHON_SCRIPT_DIR = "scripts";

// Configuration: List your scripts exactly in the order they need to execute
const pipeline = [
  { script: "download_fifa_stats.py", desc: "Downloading raw JSON from FIFA API" },
  { script: "parse_fifa_tabs.py",     desc: "Parsing JSON into individual tab CSVs" },
  { script: "merge_fifa_tabs.py",     desc: "Merging tabs into master_fifa_stats.csv" },
  { script: "clean_master_dataset.py", desc: "Cleaning master dataset" },
  { script: "derive_features.py",     desc: "Calculating per-90s, axis scores, and Blue Lock grades" },
  { script: "ingest.py",              desc: "Ingesting and upserting data to Supabase" },
  { script: "cluster_global.py",      desc: "Running Global K-Means + UMAP calculations" },
  { script: "cluster_bluelock.py",    desc: "Running Blue Lock K-Means calculations" },
];

async function runPipeline() {
  console.log("Starting World Cup Hybrid Analytics Data Pipeline...\n");
  const startTime = Date.now();

  for (let i = 0; i < pipeline.length; i++) {
    const step = pipeline[i];
    console.log(`[Step ${i + 1}/${pipeline.length}] ⏳ ${step.desc}...`);
    
    const scriptPath = path.join(__dirname, PYTHON_SCRIPT_DIR, step.script);

    try {
      // execSync runs the command and streams the output directly to your terminal
      execSync(`python ${scriptPath}`, { stdio: "inherit" });
      console.log(`✅ Step ${i + 1} completed successfully.\n`);
    } catch (error) {
      console.error(`\n CRITICAL ERROR at step ${i + 1} (${step.script})`);
      console.error("Pipeline execution halted to prevent corrupting database states.");
      process.exit(1);
    }
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`🎉 Success! Data pipeline fully refreshed in ${duration}s.`);
}

runPipeline();