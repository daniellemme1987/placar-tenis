const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'data.json');
const LIVE_FILE = path.join(__dirname, 'live_data.json');

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf-8'));
}
function writeJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function getGameState() {
  return fs.existsSync(DATA_FILE) ? readJson(DATA_FILE) : {};
}
function saveGameState(state) {
  writeJson(DATA_FILE, state);
}
function getLiveConfig() {
  return fs.existsSync(LIVE_FILE) ? readJson(LIVE_FILE) : {};
}
function saveLiveConfig(config) {
  writeJson(LIVE_FILE, config);
}

module.exports = {
  getGameState, saveGameState,
  getLiveConfig, saveLiveConfig
};
