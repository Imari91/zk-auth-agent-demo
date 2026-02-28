const { execSync } = require("child_process");

console.log("Generatinc input...");
console.time("Total proof generation time");

execSync("node generate_input.js", { stdio: "inherit" });

console.log("Generating witness...");
console.time("Witness generation");
execSync(
  "node ../circuit/artifacts/zk_auth_policy_js/generate_witness.js ../circuit/artifacts/zk_auth_policy_js/zk_auth_policy.wasm validInput.json witness.wtns",
  { stdio: "inherit" }
);
console.timeEnd("Witness generation");

console.log("Generating proof...");
console.time("Proof generation");
execSync(
  "snarkjs.cmd groth16 prove ../circuit/artifacts/zk_auth_final.zkey witness.wtns proof.json public.json",
  { stdio: "inherit", shell: true }
);

console.timeEnd("Proof generation");


console.timeEnd("Total proof generation time");
console.log("Proof ready.");