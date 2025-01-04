const mongoose = require('mongoose');
const { validationResult } = require('express-validator');
const Task = require('../model/taskModel');
const User = require('../model/userModel');
const {
  uploadOnCloudinary,
  deleteTaskFromCloudinary,
  checkImageExistsInCloudinary,
} = require('../utils/cloudinary');
const deleteImagesInUploadsFolder = require('../utils/deleteuploadsimages');
//const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const createtask = async (req, res) => {
  try {
    const {
      userId,
      title,
      keywords,
      pricingTitle,
      description,
      deliveryDays,
      price,
      packageDescription,
      isPublish,
      faqs,
      category,
      subCategory,
      revision,
    } = req.body;

    // Validate required fields
    if (!price || !title || !description) {
      // await delay(5000);
      await deleteImagesInUploadsFolder();
      return res.status(400).send({
        status: false,
        msg: 'price, title, and description are all required',
      });
    }

    // Parse keywords string into an array
    const parsedKeywords = keywords.split(',');

    // Convert the faqs string into a JavaScript object
    let parsedFaqs;
    if (typeof faqs === 'string') {
      parsedFaqs = JSON.parse(faqs);
    } else {
      parsedFaqs = faqs;
    }

    // Check if files are uploaded
    if (!req.files || req.files.length === 0) {
      await deleteImagesInUploadsFolder();
      return res.status(400).send({ status: false, msg: 'No file uploaded' });
    }

    // Validate userId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      await deleteImagesInUploadsFolder();
      return res
        .status(400)
        .json({ status: false, msg: 'Please provide a correct UserId' });
    }

    const user = await User.findById(userId);
    if (!user) {
      await deleteImagesInUploadsFolder();
      return res.status(404).send('User not found');
    }

    // if (!user.is_profileCompleted) {
    //   return res.status(400).json({
    //     status: false,
    //     msg: 'Please complete your profile first.',
    //   });
    // }

    const userTaskCount = await Task.countDocuments({ userId });
    if (userTaskCount >= 4) {
      await deleteImagesInUploadsFolder();
      return res
        .status(400)
        .json({ status: false, msg: 'You can create only 4 tasks' });
    }

    // Upload images and store their URLs
    const uploadPromises = req.files.map(async file => {
      const uploadResult = await uploadOnCloudinary(file.path);
      if (!uploadResult || !uploadResult.url) {
        throw new Error('Image not uploaded to Cloudinary');
      }
      return { url: uploadResult.url };
    });

    const uploadedImages = await Promise.all(uploadPromises);

    const task = await Task.create({
      userId,
      title,
      keywords: parsedKeywords,
      pricingTitle,
      description,
      deliveryDays,
      price,
      packageDescription,
      images: uploadedImages, // Store image details
      isPublish,
      faqs: parsedFaqs,
      category,
      subCategory,
      revision,
    });

    res
      .status(201)
      .json({ status: true, msg: 'Task created successfully!', data: task });
  } catch (error) {
    console.error('Error creating task:', error);
    await deleteImagesInUploadsFolder();
    res.status(500).send({ status: false, msg: 'Server error' });
  } finally {
    await deleteImagesInUploadsFolder();
  }
};

const gettaskById = async (req, res) => {
  const { taskId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(taskId)) {
    return res
      .status(400)
      .send({ status: false, msg: 'invalid taskId in params ..' });
  }

  try {
    const task = await Task.findById(taskId).populate(
      'userId',
      ' email  UserName avatar title revision wallet',
    );
    if (!task) {
      return res
        .status(404)
        .send({ status: false, msg: 'Task not found with this taskId' });
    }

    res.json({
      status: true,
      message: 'task fetched successfully',
      data: task,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ status: false, msg: 'Server error' });
  }
};

const gettask = async (req, res) => {
  try {
    const tasks = await Task.find({
      isPublish: true,
      blockchainCreationStatus: 'success',
    }).populate('userId', ' email  UserName avatar title');

    res.json({
      status: true,
      msg: 'data fetch successfully',
      data: tasks,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ status: false, msg: 'Server error' });
  }
};

const gettasksUserByuserId = async (req, res) => {
  const { userId } = req.params; // Destructure userId from req.params

  try {
    if (!userId || userId.trim() === '') {
      console.log('Invalid userId'); // Log if userId is invalid
      return res
        .status(400)
        .send({ status: false, msg: 'Please provide a valid userId' });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).send({ status: false, msg: 'Invalid user ID' });
    }

    const tasks = await Task.find({
      userId,
    }).populate('userId', ' UserName email avatar title');

    res
      .status(200)
      .json({ status: true, msg: 'Data fetched successfully', data: tasks });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).send({ status: false, msg: 'Server error' });
  }
};

//========================update task byID===============================//

const updateTask = async (req, res) => {
  try {
    const taskid = req.params.taskId;

    // Check if taskId is provided
    if (!taskid) {
      return res.status(400).json({
        status: false,
        msg: 'Please provide a taskId for task update!',
      });
    }

    // Check if task exists
    const task = await Task.findById(taskid);
    if (!task) {
      return res
        .status(404)
        .json({ status: false, msg: `Task with ID ${taskid} not found` });
    }

    // Destructure request body
    const {
      userId,
      title,
      projectAttributes,
      keywords,
      pricingTitle,
      description,
      deliveryDays,
      numberOfPagesOrScreens,
      price,
      serviceOptions,
      packageDescription,
      question,
      isPublish,
      faqs,
      category,
      subCategory,
      revision,
    } = req.body;

    //===========if keyword in array form other wise covert Parse keywords string into an array============//

    const parsedKeywords = Array.isArray(keywords)
      ? keywords
      : keywords.split(',');

    // Parse FAQs if provided as a string
    let parsedFaqs = faqs;
    if (typeof faqs === 'string') {
      parsedFaqs = JSON.parse(faqs);
    }

    // Update task fields
    task.userId = userId || task.userId;
    task.title = title || task.title;
    task.projectAttributes = projectAttributes || task.projectAttributes;
    task.keywords = parsedKeywords || task.keywords; // Ensure parsedKeywords is used here
    task.pricingTitle = pricingTitle || task.pricingTitle;
    task.description = description || task.description;
    task.deliveryDays = deliveryDays || task.deliveryDays;
    task.numberOfPagesOrScreens =
      numberOfPagesOrScreens || task.numberOfPagesOrScreens;
    task.price = price || task.price;
    task.serviceOptions = serviceOptions || task.serviceOptions;
    task.packageDescription = packageDescription || task.packageDescription;
    task.question = question || task.question;
    //task.isPublish = isPublish || task.isPublish;
    task.isPublish = isPublish !== undefined ? isPublish : task.isPublish;
    task.faqs = parsedFaqs;
    task.category = category || task.category;
    task.subCategory = subCategory || task.subCategory;
    task.revision = revision || task.revision;

    // Save updated task
    const updatedTask = await task.save();

    res.status(200).json({
      status: true,
      msg: 'Task updated successfully!',
      data: updatedTask,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: false, msg: 'Server error' });
  }
};

//========================update images and add images =========================//

const updateTaskImages = async (req, res) => {
  try {
    const taskId = req.params.taskid;
    const newImages = req.files;

    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return res
        .status(400)
        .json({ status: false, msg: 'Please provide a correct TaskId' });
    }
    if (!newImages) {
      return res
        .status(400)
        .json({ status: false, msg: 'give images for upload , ,' });
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ status: false, msg: 'Task not found' });
    }

    //=============Upload new images to Cloudinary======================//
    const uploadPromises = newImages.map(async image => {
      const uploadResult = await uploadOnCloudinary(image.path);
      if (!uploadResult || !uploadResult.url) {
        throw new Error('Image not uploaded to Cloudinary');
      }
      return { url: uploadResult.url };
    });

    const uploadedImages = await Promise.all(uploadPromises);

    // Update task with new images
    task.images.push(...uploadedImages);
    await task.save();

    res.status(200).json({
      status: true,
      msg: 'Task images updated successfully!',
      data: task,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ status: false, msg: 'Server error' });
  }
};

const deleteTask = async (req, res) => {
  const deleteid = req.params.taskId;

  try {
    if (!mongoose.Types.ObjectId.isValid(deleteid)) {
      return res.status(400).send({
        status: false,
        msg: 'Please provide a valid taskId for deleting the task',
      });
    }

    const task = await Task.findById(deleteid);

    if (!task) {
      return res
        .status(404)
        .send({ status: false, msg: 'Task not found with this taskId' });
    }

    // eslint-disable-next-line prefer-destructuring
    const images = task.images.map(image => image.url);

    if (images && images.length > 0) {
      // Check if any image does not exist in Cloudinary
      const imageChecks = images.map(imageUrl =>
        checkImageExistsInCloudinary(imageUrl),
      );
      const imageCheckResults = await Promise.all(imageChecks);

      if (imageCheckResults.some(result => !result)) {
        // If any image doesn't exist in Cloudinary, delete the task
        await Task.deleteOne({ _id: deleteid });
        return res
          .status(200)
          .send({ status: true, msg: 'Task deleted successfully' });
      }

      // Delete all images from Cloudinary
      const deleteImagePromises = images.map(imageUrl =>
        deleteTaskFromCloudinary(imageUrl),
      );
      const deleteImageResults = await Promise.all(deleteImagePromises);

      if (deleteImageResults.some(result => !result)) {
        return res.status(400).json({
          status: false,
          msg: 'Failed to delete images from Cloudinary',
        });
      }
    }

    // Delete the task after deleting images or if there are no images
    await Task.deleteOne({ _id: deleteid });

    return res
      .status(200)
      .send({ status: true, msg: 'Task deleted successfully' });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .send({ status: false, msg: 'Internal Server Error' });
  }
};

//======================Delete a specific image associated with a task============================//
const deleteTaskImage = async (req, res) => {
  try {
    const taskid = req.params.taskId;
    const imageid = req.params.imageId;

    // Validate taskId and imageId
    if (
      !mongoose.Types.ObjectId.isValid(taskid) ||
      !mongoose.Types.ObjectId.isValid(imageid)
    ) {
      return res.status(400).json({
        status: false,
        msg: 'Please provide correct TaskId and ImageId',
      });
    }

    // Find task and remove the specific image
    const task = await Task.findById(taskid);
    if (!task) {
      return res.status(404).json({ status: false, msg: 'Task not found' });
    }

    // Find the image to be deleted
    // eslint-disable-next-line eqeqeq
    const imageToDelete = task.images.find(image => image._id == imageid);
    if (!imageToDelete) {
      return res
        .status(404)
        .json({ status: false, msg: 'Image not found in task' });
    }

    // Delete the image from Cloudinary
    const cloudinaryDeleted = await deleteTaskFromCloudinary(imageToDelete.url);

    if (!cloudinaryDeleted) {
      return res
        .status(500)
        .json({ status: false, msg: 'Failed to delete image from Cloudinary' });
    }

    // Remove the image from the task's images array
    task.images.pull(imageid);
    await task.save();

    res.status(200).json({
      status: true,
      msg: 'Task image deleted successfully!',
      data: task,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ status: false, msg: 'Server error' });
  }
};

//=====================search taSK aPi=============================//

const searchTask = async (req, res) => {
  try {
    const { title, category } = req.body;

    if (!title && !category) {
      return res
        .status(400)
        .json({ status: false, msg: 'Please provide task title or category' });
    }

    const query = [];
    if (title) {
      query.push({ title: { $regex: title, $options: 'i' } }); // Case-insensitive title search
    }
    if (category) {
      query.push({ category: { $regex: category, $options: 'i' } }); // Case-insensitive category search
    }

    const tasks = await Task.find({ $or: query });

    if (tasks.length === 0) {
      return res.status(404).json({
        status: false,
        msg: 'No tasks found matching the search criteria',
      });
    }

    return res
      .status(200)
      .json({ status: true, msg: 'Data fetched successfully', data: tasks });
  } catch (error) {
    return res.status(500).json({ status: false, msg: error.message });
  }
};

const setTaskInitTxStatus = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { task } = req;
    const { blockchainCreationStatus } = req.body;

    task.blockchainCreationStatus = blockchainCreationStatus;
    await task.save();

    res.status(200).json({
      status: true,
      msg: 'Task status updated successfully',
      data: task,
    });
  } catch (error) {
    return res.status(500).json({ status: false, msg: error.message });
  }
};

module.exports = {
  createtask,
  gettaskById,
  gettasksUserByuserId,
  gettask,
  updateTask,
  updateTaskImages,
  deleteTask,
  deleteTaskImage,
  searchTask,
  setTaskInitTxStatus,
};
