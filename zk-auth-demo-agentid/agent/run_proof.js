const { execSync } = require("child_process");

console.log("Generatinc input...");
console.time("Total proof generation time");

execSync("node generate_input.js", { stdio: "inherit" });

console.log("Generating witness...");
console.time("Witness generation");

execSync(
  "node ../circuit/artifacts_v3/zk_auth_policy_v3_js/generate_witness.js ../circuit/artifacts_v3/zk_auth_policy_v3_js/zk_auth_policy_v3.wasm validInput.json witness.wtns",
  { stdio: "inherit" }
);
console.timeEnd("Witness generation");

console.log("Generating proof...");
console.time("Proof generation");

execSync(
  "snarkjs.cmd groth16 prove ../circuit/artifacts_v3/zk_auth_final.zkey witness.wtns proof.json public.json",
  { stdio: "inherit", shell: true }
);
console.timeEnd("Proof generation");


console.timeEnd("Total proof generation time");
console.log("Proof ready.");