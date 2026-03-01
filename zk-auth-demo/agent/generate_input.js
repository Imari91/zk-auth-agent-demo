const fs = require("fs");

const clearance = 4; //happy path
const environment = 1;
const action = 2;
const secret = 123;

//generate timestamp automatically
const timestamp = Math.floor(Date.now() / 1000);


//a random small nonce
const nonce = Math.floor(Math.random() * 100000);

//simple automatic commitment
const commitment =
  clearance + environment + action + secret + nonce + timestamp; //en un caso real, esto seria un hash o algo mas complejo

const input = {
  clearance,
  environment,
  action,
  secret,
  nonce,
  timestamp,
  commitment,
}; 

fs.writeFileSync("validInput.json", JSON.stringify(input, null, 2));

console.log("Input generated:");
console.log(input);