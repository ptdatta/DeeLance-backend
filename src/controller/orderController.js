/* eslint-disable no-unused-vars */
const mongoose = require('mongoose');
const { check, validationResult } = require('express-validator');
const Order = require('../model/orderSchema');
const Task = require('../model/taskModel');
const User = require('../model/userModel');
const {
  uploadOnCloudinary,

  deleteTaskFromCloudinary,
} = require('../utils/cloudinary');
const deleteImagesInUploadsFolder = require('../utils/deleteuploadsimages');

const createOrder = async (req, res) => {
  try {
    const { gigId, initialTransactionHash, BlockchainGigId } = req.body;
    const client = req.user;

    // Ensure the user is a client
    if (client.accountType !== 'CLIENT') {
      return res.status(403).json({
        status: false,
        message: 'Only clients can initialize orders.',
      });
    }

    // Validate the gigId
    const task = await Task.findById(gigId);
    if (!task) {
      return res.status(404).json({
        status: false,
        message: 'Gig not found.',
      });
    }

    // Find the freelancer associated with the gig
    const freelancer = await User.findById(task.userId);
    if (!freelancer) {
      return res.status(404).json({
        status: false,
        message: 'Freelancer not found.',
      });
    }
    //const revisionCount = parseInt(task.revision.split(' ')[1], 10) || 0;
    // Create a new order

    // Create a new order
    const newOrder = new Order({
      freelancerId: freelancer._id,
      clientId: client._id,
      gigId: task._id,
      initialTransactionHash,
      BlockchainGigId: BlockchainGigId,
      total: task.price,
      status: 'awaiting-freelancer-approval', // Initial status
    });

    // Save the order
    await newOrder.save();

    return res.status(201).json({
      status: true,
      message:
        'Order initialized successfully. Waiting for freelancer approval.',
      order: newOrder,
    });
  } catch (error) {
    console.error('Error initializing order:', error);
    return res.status(500).json({
      status: false,
      message: 'Failed to initialize order. Please try again later.',
    });
  }
};

const getOrder = async (req, res) => {
  try {
    const { orderID } = req.params;

    if (!mongoose.Types.ObjectId.isValid(orderID)) {
      return res.status(400).json({
        status: false,
        msg: 'Please provide a valid Order ID to fetch order details.',
      });
    }

    const order = await Order.findById(orderID);
    if (!order) {
      return res.status(404).json({
        status: false,
        msg: 'Order not found with the given Order ID.',
      });
    }

    res.status(200).json({
      status: true,
      data: order,
    });
  } catch (error) {
    console.error('Error fetching order:', error.message);
    res.status(500).json({
      status: false,
      msg: 'An error occurred while fetching the order. Please try again later.',
    });
  }
};

const getFreelancerOrders = async (req, res) => {
  const { status } = req.params;

  try {
    // Ensure the user is a freelancer
    // if (req.user.accountType !== accountType) {
    //   return res.status(403).json({
    //     status: false,
    //     message: 'Only freelancers can view their orders.',
    //   });
    // }

    const query = { status };

    if (req.user.accountType === 'FREELANCER') {
      query.freelancerId = req.user._id;
    }

    if (req.user.accountType === 'CLIENT') {
      query.clientId = req.user._id;
    }

    // Find orders where the freelancer is the current user
    const orders = await Order.find(query)
      .populate('freelancerId', 'avatar title email UserName')
      .populate('clientId', 'avatar UserName email') // Populating client details
      .populate('gigId', 'title') // Populating gig details
      .sort({ createdAt: -1 }); // Sorting orders by creation date

    const aggregateQuery = {};

    if (req.user.accountType === 'FREELANCER') {
      aggregateQuery.freelancerId = req.user._id;
    }

    if (req.user.accountType === 'CLIENT') {
      aggregateQuery.clientId = req.user._id;
    }

    // Count orders for each status
    const statusCounts = await Order.aggregate([
      { $match: aggregateQuery },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    // Convert statusCounts array into an object with status as key and count as value
    const statusCountsMap = statusCounts.reduce((acc, cur) => {
      acc[cur._id] = cur.count;
      return acc;
    }, {});

    return res.status(200).json({
      status: true,
      message: 'Freelancer orders fetched successfully.',
      orders,
      counts: statusCountsMap,
    });
  } catch (error) {
    console.error('Error fetching freelancer orders:', error);
    return res.status(500).json({
      status: false,
      message: 'Failed to fetch freelancer orders. Please try again later.',
    });
  }
};

const approveOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    // Ensure the user is a freelancer
    if (req.user.accountType !== 'FREELANCER') {
      return res.status(403).json({
        status: false,
        message: 'Only freelancers can approve orders.',
      });
    }

    // Find the order by ID
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        status: false,
        message: 'Order not found.',
      });
    }

    // Ensure the current user is the freelancer associated with the order
    if (order.freelancerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: false,
        message: 'You are not authorized to approve this order.',
      });
    }

    // Ensure the order is in the correct status for approval
    if (order.status !== 'awaiting-freelancer-approval') {
      return res.status(400).json({
        status: false,
        message: 'Order cannot be approved in its current status.',
      });
    }

    // Calculate and set the deadline based on the current date plus deliveryDays
    const task = await Task.findById(order.gigId);
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + task.deliveryDays);
    order.deadline = deadline;

    // Update the order status to active
    order.status = 'active';
    await order.save();

    return res.status(200).json({
      status: true,
      message: 'Order approved successfully. Project started.',
      order,
    });
  } catch (error) {
    console.error('Error approving order:', error);
    return res.status(500).json({
      status: false,
      message: 'Failed to approve order. Please try again later.',
    });
  }
};

const declineOrderValidationRules = [
  check('reasonForDecline')
    .isLength({ min: 20, max: 160 })
    .withMessage(
      'Reason for decline must be between 20 and 160 characters long.',
    ),
];

const declineOrder = async (req, res) => {
  const { orderId } = req.params;

  // Validate the reason for decline
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    // Ensure the user is a freelancer
    if (req.user.accountType !== 'FREELANCER') {
      return res.status(403).json({
        status: false,
        message: 'Only freelancers can decline an order.',
      });
    }

    // Find the order by ID and ensure the freelancer is the one assigned
    const order = await Order.findOne({
      _id: orderId,
      freelancerId: req.user._id,
    });

    if (!order) {
      return res.status(404).json({
        status: false,
        message:
          'Order not found or you are not authorized to decline this order.',
      });
    }

    // Update the order status to 'freelancer-declined' and set the reason for decline
    order.status = 'freelancer-declined';
    order.reasonForDecline = req.body.reasonForDecline;
    await order.save();

    return res.status(200).json({
      status: true,
      message: 'Order declined successfully.',
      order,
    });
  } catch (error) {
    console.error('Error declining order:', error);
    return res.status(500).json({
      status: false,
      message: 'Failed to decline order. Please try again later.',
    });
  }
};

const withdrawOrder = async (req, res) => {
  const { orderId } = req.params;

  try {
    // Ensure the user is a client
    if (req.user.accountType !== 'CLIENT') {
      return res.status(403).json({
        status: false,
        message: 'Only clients can withdraw an order.',
      });
    }

    // Find the order by ID and ensure the client is the one assigned
    const order = await Order.findOne({
      _id: orderId,
      clientId: req.user._id,
    });

    if (!order) {
      return res.status(404).json({
        status: false,
        message:
          'Order not found or you are not authorized to withdraw this order.',
      });
    }

    // Update the order status to 'client-withdrawn'
    order.status = 'client-withdrawn';
    await order.save();

    return res.status(200).json({
      status: true,
      message: 'Order withdrawn successfully.',
      order,
    });
  } catch (error) {
    console.error('Error withdrawing order:', error);
    return res.status(500).json({
      status: false,
      message: 'Failed to withdraw order. Please try again later.',
    });
  }
};

const freelancerCompleteOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { files } = req;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (
      order.freelancerId.toString() !== req.user._id.toString() ||
      req.user.accountType !== 'FREELANCER'
    ) {
      return res.status(403).json({
        message: 'Only the assigned freelancer can mark the order as completed',
      });
    }

    if (order.status === 'completed') {
      return res.status(400).json({ message: 'Order already completed' });
    }

    if (!files || files.length === 0) {
      return res.status(400).json({
        message: 'Please upload at least one file before completing the order',
      });
    }

    const cloudinaryUrls = [];

    for (const file of files) {
      try {
        // eslint-disable-next-line no-await-in-loop
        const uploadedFile = await uploadOnCloudinary(file.path);
        if (uploadedFile) {
          cloudinaryUrls.push(uploadedFile.secure_url);
        } else {
          throw new Error(`Failed to upload file ${file.originalname}`);
        }
      } catch (error) {
        console.error('Error creating task:', error);
        // eslint-disable-next-line no-await-in-loop
        await deleteImagesInUploadsFolder();
        res.status(500).send({ status: false, msg: 'Server error' });
      } finally {
        // eslint-disable-next-line no-await-in-loop
        // await deleteImagesInUploadsFolder();
      }
    }

    // Update the order status and deliverables
    order.status = 'completed';
    order.files = cloudinaryUrls;
    await order.save();

    return res.status(200).json({
      message: 'Order marked as completed',
      files: cloudinaryUrls,
    });
  } catch (error) {
    console.error('Error completing order:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  } finally {
    await deleteImagesInUploadsFolder(); // Ensure only specific files are deleted
  }
};

const orderStatusDelivered = async (req, res) => {
  const { orderId } = req.params; // Correctly destructuring orderId

  try {
    const order = await Order.findById(orderId);
    if (!order) {
      return res
        .status(404)
        .json({ status: false, msg: 'Order not found with this order ID' });
    }

    if (
      order.clientId.toString() !== req.user._id.toString() ||
      req.user.accountType !== 'CLIENT'
    ) {
      return res.status(403).json({
        status: false,
        msg: 'Only the client can mark the order as delivered',
      });
    }

    order.status = 'delivered';
    await order.save();

    res.status(200).json({ status: true, msg: 'Order marked as delivered' });
  } catch (error) {
    res.status(500).json({ status: false, msg: 'Server error', error });
  }
};
const orderStatusRevision = async (req, res) => {
  const { orderId } = req.params;

  try {
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        status: false,
        msg: 'Order not found with this order ID',
      });
    }

    if (
      order.clientId.toString() !== req.user._id.toString() ||
      req.user.accountType !== 'CLIENT'
    ) {
      return res.status(403).json({
        status: false,
        msg: 'Only the client can request a revision',
      });
    }

    // Check if revisions are available
    if (order.revision > 0) {
      order.revision -= 1; // Decrease revision count
      order.status = 'revision'; // Update order status to 'revision'
      await order.save();

      return res.status(200).json({
        status: true,
        msg: `Revision requested, remaining revisions: ${order.revision}`,
      });
    }

    // If revision count is 0, prevent further revisions
    return res.status(400).json({
      status: false,
      msg: 'You cannot request more revisions, revision count is 0',
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      msg: 'Server error',
      error: error.message,
    });
  }
};

module.exports = {
  createOrder,
  getOrder,
  getFreelancerOrders,
  approveOrder,
  declineOrder,
  withdrawOrder,
  declineOrderValidationRules,
  freelancerCompleteOrder,
  orderStatusDelivered,
  orderStatusRevision,
};
