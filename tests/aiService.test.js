const test = require('node:test');
const assert = require('node:assert/strict');
const { chatbotResponse } = require('../services/aiService');

test('offline mode returns tourist place details for a known destination', () => {
    const reply = chatbotResponse('Tell me about Kodaikanal', { mode: 'offline' });
    assert.match(reply, /Kodaikanal/i);
    assert.match(reply, /cool climate|misty/i);
});

test('online mode answers tourist questions even when no external API is configured', () => {
    const reply = chatbotResponse('What are good tourist places in Tamil Nadu?', { mode: 'online' });
    assert.match(reply, /Tamil Nadu|tourist|travel/i);
});