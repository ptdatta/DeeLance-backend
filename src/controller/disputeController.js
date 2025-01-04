const mongoose = require('mongoose');
const deleteImagesInUploadsFolder = require('../utils/deleteuploadsimages');
const {
  uploadOnCloudinary,
  deleteTaskFromCloudinary,
} = require('../utils/cloudinary');
const Dispute = require('../model/disputeModel');
const Order = require('../model/orderSchema');
// eslint-disable-next-line no-unused-vars
const User = require('../model/userModel');

// Function to create a new dispute
const createDispute = async (req, res) => {
  const { orderId, reason } = req.body;

  if (!mongoose.isValidObjectId(orderId)) {
    return res
      .status(404)
      .send({ status: false, msg: 'This is not a valid order ID' });
  }

  try {
    // Check if a dispute already exists for this order by the same user
    const existingDispute = await Dispute.findOne({
      orderId,
      initiatedBy: req.user._id,
    });
    if (existingDispute) {
      return res.status(400).json({
        status: false,
        message: 'A dispute has already been created for this order by you.',
      });
    }

    const order = await Order.findById(orderId).select('clientId freelancerId');

    if (!order) {
      return res.status(404).json({
        status: false,
        message: 'Order not found.',
      });
    }

    const { clientId, freelancerId } = order;

    if (
      req.user._id.toString() !== clientId.toString() &&
      req.user._id.toString() !== freelancerId.toString()
    ) {
      return res.status(403).json({
        status: false,
        message:
          'You are not authorized to initiate this dispute. Only the client or freelancer can initiate a dispute.',
      });
    }
    const uploadPromises = req.files.map(async file => {
      const uploadResult = await uploadOnCloudinary(file.path);
      if (!uploadResult || !uploadResult.url) {
        throw new Error('Image not uploaded to Cloudinary');
      }
      return { url: uploadResult.url };
    });

    const uploadedImages = await Promise.all(uploadPromises);

    const newDispute = new Dispute({
      orderId,
      clientId,
      freelancerId,
      reason,
      images: uploadedImages,
      initiatedBy: req.user._id,
      status: 'open',
      createdAt: Date.now(),
    });

    await newDispute.save();

    return res.status(201).json({
      status: true,
      message: 'Dispute created successfully.',
      dispute: newDispute,
    });
  } catch (error) {
    console.error('Error creating task:', error);
    await deleteImagesInUploadsFolder();
    res.status(500).send({ status: false, msg: 'Server error' });
  } finally {
    await deleteImagesInUploadsFolder();
  }
};

const getDisputes = async (req, res) => {
  try {
    const { userId } = req.params;
    // Fetch disputes where userId is either the clientId or freelancerId
    const disputes = await Dispute.find({
      $or: [{ clientId: userId }, { freelancerId: userId }],
    })
      .populate('orderId', 'total status')
      .populate('freelancerId clientId initiatedBy', 'name email');
    if (disputes.length === 0) {
      return res
        .status(404)
        .json({ status: false, msg: 'No disputes found for this userId' });
    }
    return res.status(200).json({ status: true, disputes });
  } catch (error) {
    console.error('Error fetching disputes:', error);
    return res
      .status(500)
      .json({ status: false, message: 'Error fetching disputes', error });
  }
};

// const updateDispute = async (req, res) => {
//   const { disputeId } = req.params;
//   const { reason } = req.body;

//   try {
//     const dispute = await Dispute.findById(disputeId);
//     if (!dispute) {
//       return res
//         .status(404)
//         .json({ status: false, message: 'Dispute not found' });
//     }
//     const uploadPromises = req.files.map(async file => {
//       const uploadResult = await uploadOnCloudinary(file.path);
//       if (!uploadResult || !uploadResult.url) {
//         throw new Error('Image not uploaded to Cloudinary');
//       }
//       return { url: uploadResult.url };
//     });

//     const uploadedImages = await Promise.all(uploadPromises);

//     if (dispute.initiatedBy.toString() !== req.user._id.toString()) {
//       return res.status(403).json({
//         status: false,
//         message: 'You are not authorized to update this dispute.',
//       });
//     }

//     if (reason) dispute.reason = reason;
//     if (images) dispute.images = uploadedImages;

//     dispute.updatedAt = Date.now();

//     await dispute.save();

//     return res.status(200).json({
//       status: true,
//       message: 'Dispute updated successfully',
//       dispute,
//     });
//   } catch (error) {
//     console.error('Error updating dispute:', error);
//     return res.status(500).json({
//       status: false,
//       message: 'Error updating dispute',
//       error,
//     });
//   }
// };
const updateDispute = async (req, res) => {
  const { disputeId } = req.params;
  const { reason } = req.body;

  try {
    // Fetch the dispute by ID
    const dispute = await Dispute.findById(disputeId);
    if (!dispute) {
      return res.status(404).json({
        status: false,
        message: 'Dispute not found',
      });
    }

    // Ensure only the initiator can update the dispute
    if (dispute.initiatedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: false,
        message: 'You are not authorized to update this dispute.',
      });
    }

    // Handle image uploads
    let uploadedImages = [];
    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map(async file => {
        const uploadResult = await uploadOnCloudinary(file.path);
        if (!uploadResult || !uploadResult.url) {
          throw new Error('Image upload failed');
        }
        return { url: uploadResult.url };
      });
      uploadedImages = await Promise.all(uploadPromises);
    }

    // Update fields
    if (reason) dispute.reason = reason;
    if (uploadedImages.length > 0) {
      dispute.images = [...dispute.images, ...uploadedImages];
    }
    dispute.updatedAt = Date.now();

    await dispute.save();

    return res.status(200).json({
      status: true,
      message: 'Dispute updated successfully',
      dispute,
    });
  } catch (error) {
    console.error('Error updating dispute:', error);
    await deleteImagesInUploadsFolder();
    res.status(500).send({ status: false, msg: 'Server error' });
  } finally {
    await deleteImagesInUploadsFolder();
  }
};

const resolveDispute = async (req, res) => {
  const { disputeId } = req.params;
  const { decision, resolutionDetails } = req.body;

  try {
    const dispute = await Dispute.findById(disputeId).populate('orderId');
    if (!dispute) {
      return res
        .status(404)
        .json({ status: false, message: 'Dispute not found.' });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({
        status: false,
        message: 'Only an admin can resolve the dispute.',
      });
    }

    dispute.resolution = {
      resolvedBy: req.user._id,
      decision,
      resolutionDetails,
      resolutionDate: Date.now(),
    };
    dispute.status = 'resolved';
    dispute.updatedAt = Date.now();

    await dispute.save();

    return res.status(200).json({
      status: true,
      message: 'Dispute resolved successfully.',
      dispute,
    });
  } catch (error) {
    console.error('Error resolving dispute:', error);
    return res
      .status(500)
      .json({ status: false, message: 'Failed to resolve dispute.' });
  }
};

const deleteDispute = async (req, res) => {
  try {
    const { disputeId } = req.params;

    // Ensure only admins can delete disputes
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        status: false,
        message: 'Only an admin can delete disputes.',
      });
    }

    // Find the dispute before deletion
    const dispute = await Dispute.findById(disputeId);
    if (!dispute) {
      return res
        .status(404)
        .json({ status: false, message: 'Dispute not found' });
    }

    // Check if the dispute contains any images
    const images = dispute.images.map(image => image.url);

    if (images && images.length > 0) {
      // Delete all images from Cloudinary first
      const deleteImagePromises = images.map(imageUrl =>
        deleteTaskFromCloudinary(imageUrl),
      );
      const deleteImageResults = await Promise.all(deleteImagePromises);

      // If any image deletion fails, return an error
      if (deleteImageResults.some(result => !result)) {
        return res.status(400).json({
          status: false,
          msg: 'Failed to delete images from Cloudinary',
        });
      }
    }

    // After deleting images, delete the dispute
    await Dispute.findByIdAndDelete(disputeId);

    // Return success message
    return res.status(200).json({
      status: true,
      message: 'Dispute and images deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting dispute:', error);
    return res
      .status(500)
      .json({ status: false, message: 'Error deleting dispute', error });
  }
};

const cancelDispute = async (req, res) => {
  const { disputeId } = req.params;
  const { cancellationReason } = req.body;

  try {
    const dispute = await Dispute.findById(disputeId);
    if (!dispute) {
      return res
        .status(404)
        .json({ status: false, message: 'Dispute not found.' });
    }

    // Check if the dispute has already been resolved
    if (dispute.status === 'resolved') {
      return res.status(400).json({
        status: false,
        message: 'Cannot cancel a resolved dispute.',
      });
    }

    // Ensure only an admin can cancel the dispute
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        status: false,
        message: 'Only an admin can cancel the dispute.',
      });
    }

    // Update the dispute status to 'cancelled' and add the cancellation reason
    dispute.status = 'cancelled';
    dispute.cancellationReason = cancellationReason;
    dispute.updatedAt = Date.now();

    await dispute.save();

    return res.status(200).json({
      status: true,
      message: 'Dispute cancelled successfully.',
      dispute,
    });
  } catch (error) {
    console.error('Error cancelling dispute:', error);
    return res
      .status(500)
      .json({ status: false, message: 'Failed to cancel dispute.' });
  }
};
const getAllDisputes = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        status: false,
        msg: 'Access denied. Only admins can view disputes.',
      });
    }
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;

    const disputes = await Dispute.find({})
      .populate('orderId', 'UserName total status')
      .populate('clientId freelancerId initiatedBy', 'UserName email')
      .limit(limit) // Set the limit of documents per page
      .skip((page - 1) * limit) // Skip documents for pagination
      .sort({ createdAt: -1 }); // Sort by the latest created disputes

    const totalDisputes = await Dispute.countDocuments({});
    const totalPages = Math.ceil(totalDisputes / limit);

    if (disputes.length === 0) {
      return res.status(404).json({
        status: false,
        msg: 'No disputes found.',
      });
    }

    res.status(200).json({
      status: true,
      msg: 'Disputes fetched successfully.',
      data: disputes,
      pagination: {
        total: totalDisputes,
        page,
        limit,
        totalPages,
      },
    });
  } catch (error) {
    console.error('Error fetching disputes:', error);
    res.status(500).json({
      status: false,
      msg: 'An error occurred while fetching disputes.',
      error: error.message,
    });
  }
};

const deleteDisputeImageByUrl = async (req, res) => {
  try {
    const { disputeId } = req.params.disputeId;
    const { imageId } = req.params;
    console.log(req.params.disputeId);
    // console.log(req.params.imageId);

    // Validate disputeId and imageId
    if (
      !mongoose.Types.ObjectId.isValid(disputeId) &&
      !mongoose.Types.ObjectId.isValid(imageId)
    ) {
      return res.status(400).json({
        status: false,
        msg: 'Please provide a valid disputeId and imageId',
      });
    }

    // Find the dispute by ID
    const dispute = await Dispute.findById(req.params.disputeId);
    // console.log(dispute);
    if (!dispute) {
      return res.status(404).json({ status: false, msg: 'Dispute not found' });
    }

    // Find the image to be deleted
    // eslint-disable-next-line eqeqeq
    const imageToDelete = dispute.images.find(image => image._id == imageId);
    if (!imageToDelete) {
      return res
        .status(404)
        .json({ status: false, msg: 'Image not found in dispute' });
    }

    // Delete the image from Cloudinary
    const cloudinaryDeleted = await deleteTaskFromCloudinary(imageToDelete.url);

    if (!cloudinaryDeleted) {
      return res.status(500).json({
        status: false,
        msg: 'Failed to delete image from Cloudinary',
      });
    }

    // Remove the image from the dispute's images array
    dispute.images.pull(req.params.imageId);
    await dispute.save();

    res.status(200).json({
      status: true,
      msg: 'Dispute image deleted successfully!',
      data: dispute,
    });
  } catch (error) {
    console.error('Error deleting dispute image:', error.message);
    res.status(500).json({ status: false, msg: 'Server error' });
  }
};

module.exports = {
  createDispute,
  getDisputes,
  updateDispute,
  resolveDispute,
  deleteDispute,
  cancelDispute,
  getAllDisputes,
  deleteDisputeImageByUrl,
};
