const User = require('../model/userModel');
const { streamClient } = require('../services/streamChatService');

const openChatWithPerson = async (req, res) => {
  const { id_tochatwith } = req.params;
  const user = await User.findById(id_tochatwith);

  if (!user) {
    return res.status(404).send({ status: false, msg: 'User does not exist' });
  }

  // telling stream chat to create user or get user if it already exists so that it knows we need to chat with the user and don't give user not found error
  const abcd = {
    id: String(user._id),
    name: `${user.UserName} `,
    image: user.avatar,
  };
  try {
    await streamClient.upsertUsers([abcd]);
  } catch (error) {
    console.log('failed to update user on STREAM CHAT', error);
  }

  res.status(200).json({
    message: 'channel created succesfully',
  });
};

module.exports = {
  openChatWithPerson,
};
