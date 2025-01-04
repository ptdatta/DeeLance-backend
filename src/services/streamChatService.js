const { StreamChat } = require('stream-chat');

const streamApiKey = process.env.YOUR_STREAM_API_KEY;
const streamApiSecret = process.env.YOUR_STREAM_API_SECRET;

const streamClient = StreamChat.getInstance(streamApiKey, streamApiSecret);

module.exports = {
  streamClient,
  streamApiKey,
  streamApiSecret,
};
