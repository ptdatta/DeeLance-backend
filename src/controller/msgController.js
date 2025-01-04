const Message = require('../model/messageModel');

const getMessageForUser = async (req, res) => {
  try {
    const userId = req.user._id; // Get the authenticated user's ID
    console.log(userId);
    const messages = await Message.find({ recipient: userId }).populate({
      path: 'sender', // Assuming the field name in Message model is 'sender'
      select: ' UserName avatar email', // Specify the fields you want to retrieve from the User model
    });
    res.json({ status: true, msg: messages });
  } catch (error) {
    console.error('Error getting messages for user:', error);
    res.status(500).json({ status: false, msg: 'Internal server error' });
  }
};
const sendMessage = async (req, res, io) => {
  try {
    const { sender, recipient, content } = req.body;

    // Ensure that the sender is the authenticated user
    if (sender !== req.user.toString()) {
      return res.status(403).json({ status: false, msg: 'Unauthorized' });
    }

    const message = new Message({ sender, recipient, content });
    await message.save();

    // Check if Socket.IO is available
    if (!io) {
      return res
        .status(500)
        .json({ status: false, msg: 'Socket.IO is not initialized' });
    }

    // Emit new message event to the recipient client only
    io.to(recipient).emit('newMessage', message);

    res.status(201).json({ status: true, msg: message });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ status: false, msg: 'Internal server error' });
  }
};

const getMessageById = async (req, res) => {
  try {
    const { messageId } = req.params;

    // Your code to retrieve a message by ID
    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ status: false, msg: 'Message not found' });
    }

    res.status(200).json({ status: true, message });
  } catch (error) {
    console.error('Error getting message by ID:', error);
    res.status(500).json({ status: false, msg: 'Internal server error' });
  }
};

const deleteMessage = async (req, res, io) => {
  try {
    const messageId = req.params.messageid;

    if (!messageId) {
      return res.status(400).json({ status: false, msg: 'give messageId' });
    }
    const message = await Message.findById(messageId);

    if (!message) {
      return res
        .status(404)
        .json({ status: false, msg: 'Message not found whit this messageId ' });
    }

    // Ensure that the message belongs to the authenticated user
    if (message.sender.toString() !== req.user.toString()) {
      return res.status(404).json({ status: false, msg: 'Unauthorized' });
    }

    const deletedMessage = await Message.findByIdAndDelete(message);

    if (!deletedMessage) {
      return res.status(404).json({ status: false, msg: 'Message not found' });
    }

    // Emit message deleted event to all connected clients
    io.emit('messageDeleted', messageId);

    res
      .status(200)
      .json({ status: true, message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ status: false, msg: 'Internal server error' });
  }
};

module.exports = {
  getMessageById,
  deleteMessage,
};

module.exports = {
  sendMessage,
  getMessageById,
  getMessageForUser,
  deleteMessage,
};
