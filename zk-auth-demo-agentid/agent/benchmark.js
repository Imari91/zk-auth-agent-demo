//generates automatic metrics for the zk-auth-demo-agentid project
const { execSync } = require("child_process");
const { performance } = require("perf_hooks");
const fs = require("fs");

const N_RUNS = 20;

const CIRCUIT_R1CS = "../circuit/artifacts_v3/zk_auth_policy_v3.r1cs";
const WASM_PATH = "../circuit/artifacts_v3/zk_auth_policy_v3_js/zk_auth_policy_v3.wasm";
const GENERATE_WITNESS_JS = "../circuit/artifacts_v3/zk_auth_policy_v3_js/generate_witness.js";
const ZKEY_PATH = "../circuit/artifacts_v3/zk_auth_final.zkey";
const VKEY_PATH = "../circuit/artifacts_v3/verification_key.json";

function timeExec(cmd) {
    const t0 = performance.now();
    execSync(cmd, { stdio: "pipe", shell: true }); //stdio "pipe" to avoid cluttering
    const t1 = performance.now();
    return t1 - t0;
}

function stats(arr) {
    const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
    const variance = arr.reduce((a, b) => a + (b - mean) ** 2, 0) / arr.length;

    return { mean_ms: mean, std_ms: Math.sqrt(variance), n: arr.length };
}

function getCircuitInfo() {
  const output = execSync(`snarkjs.cmd r1cs info "${CIRCUIT_R1CS}"`, { shell: true }).toString();

  // NOTA: formato aproximado, verificar contra la salida real de tu versión de snarkjs
  const parse = (label) => {
    const match = output.match(new RegExp(`${label}[:\\s]+(\\d+)`, "i"));
    return match ? parseInt(match[1], 10) : null;
  };

  return {
    raw_output: output, //keeping the raw output for reference
    non_linear_constraints: parse("Non-Linear Constraints"),
    linear_constraints: parse("Linear Constraints"),
    public_inputs: parse("Public Inputs"),
    private_inputs: parse("Private Inputs"),
    wires: parse("Wires")
  };
}

async function main() {
  console.log("Running " + N_RUNS + " repetitions...");

  const witnessTimes = [];
  const proofTimes = [];
  const verifyTimes = [];
  let proofSizeBytes = null;

  //Fixed input generated once outside the measurement loop. It is regenerated in 
  //each repetition only to have fresh nonce/timestamp, without its cost contaminating 
  //the measurements
  for (let i = 0; i < N_RUNS; i++) {
    execSync("node generate_input.js", { stdio: "pipe" });

    const wTime = timeExec(
      `node ${GENERATE_WITNESS_JS} ${WASM_PATH} validInput.json witness.wtns`
    );
    witnessTimes.push(wTime);

    const pTime = timeExec(
      `snarkjs.cmd groth16 prove ${ZKEY_PATH} witness.wtns proof.json public.json`
    );
    proofTimes.push(pTime);

    const vTime = timeExec(
      `snarkjs.cmd groth16 verify ${VKEY_PATH} public.json proof.json`
    );
    verifyTimes.push(vTime);

    if (i === N_RUNS - 1) {
      proofSizeBytes = fs.statSync("proof.json").size;
    }

    process.stdout.write("  run " + (i + 1) + "/" + N_RUNS + " done\r");
  }

  console.log("\nCollecting circuit info...");
  const circuitInfo = getCircuitInfo();

  const results = {
    metadata: {
      date: new Date().toISOString(),
      node_version: process.version,
      platform: process.platform,
      prover_backend: "wasm",
      n_runs: N_RUNS
    },
    circuit: circuitInfo,
    proof_size_bytes: proofSizeBytes,
    timings_ms: {
      witness_generation: witnessTimes,
      proof_generation: proofTimes,
      verification: verifyTimes
    },
    stats: {
      witness_generation_ms: stats(witnessTimes),
      proof_generation_ms: stats(proofTimes),
      verification_ms: stats(verifyTimes)
    }
  };

  fs.writeFileSync("benchmark_results.json", JSON.stringify(results, null, 2));

  console.log("\nLogs Summary");
  console.table(results.stats);
  console.log("Proof size: " + results.proof_size_bytes + " bytes");
  console.log("Full results written to benchmark_results.json");
}

main();