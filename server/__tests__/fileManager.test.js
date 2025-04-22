const fs = require('fs');
const path = require('path');
const {
  getGameState,
  saveGameState,
  getLiveConfig,
  saveLiveConfig
} = require('../fileManager');

describe('File Manager', () => {
  const testState = { admin: 'test', players: ['a', 'b'] };
  const testConfig = { youtubeLiveID: 'abc123def45' };

  it('salva e carrega estado do jogo', () => {
    saveGameState(testState);
    const loaded = getGameState();
    expect(loaded.admin).toBe('test');
  });

  it('salva e carrega configuração da live', () => {
    saveLiveConfig(testConfig);
    const loaded = getLiveConfig();
    expect(loaded.youtubeLiveID).toBe('abc123def45');
  });
});
