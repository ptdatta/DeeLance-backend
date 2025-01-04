const express = require('express');

const router = express.Router();
const { check } = require('express-validator');
const {
  authenticate,
  authorization,
  adminAuthorization,
} = require('../middleware/mid');

const {
  register,
  login,
  avatar,
  Profile,
  forgotpassword,
  resetPasswordtoken,
  updateUserExperience,
  userVisibility,
  userIncountry,
  UpdateUserIdskills,
  getUser,
  checkUserByID,
  UpdateTiTleDescription,
  updatekind,
  getProfileUsinId,
  updateprofileUsingId,
  editprofile,
  emailverify,
  RefreshToken,
  logoutUser,
  profilePercentage,
  deleteExternalProfile,
  updateExternalProfile,
  addExperience,
  deleteExprience,
  addCertificate,
  updateCertificate,
  deleteCertificates,
  addeducation,
  updateEducation,
  deleteducation,
  changeMode,
  searchApi,
  checkUsernameAvailable,
} = require('../controller/userController');
const {
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
} = require('../controller/orderController');

const {
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
} = require('../controller/taskController.js');

const {
  bonus,
  getBonuse,
  userUserIdClaimBonusByBonusId,
} = require('../controller/bonusController.js');

const {
  jobPost,
  getJobUsingUserId,
  getJobs,
  getjobsjobId,
  search,
  deletedJob,
  updateJob,
} = require('../controller/jobController.js');

const {
  saveTask,
  getSavedTasks,
  deleteSaveTask,
} = require('../controller/saveTaskcontroller.js');

const {
  sendMessage,
  getMessageById,
  getMessageForUser,
  deleteMessage,
} = require('../controller/msgController.js');

const { CreateOffer, getOffer } = require('../controller/offerController.js');

const { upload } = require('../middleware/multer');
const { openChatWithPerson } = require('../controller/messageController.js');
const {
  getAllUsers,
  deleteUser,
  getUserDetails,
} = require('../controller/adminController.js');
const registerFormValidation = require('../validations/registerFormValidation.js');
const {
  validateTaskTXStatusRule,
} = require('../validations/taskValidationRules.js');
const {
  createDispute,
  getDisputes,
  resolveDispute,
  updateDispute,
  deleteDispute,
  cancelDispute,
  getAllDisputes,
  deleteDisputeImageByUrl,
} = require('../controller/disputeController.js');

const {
  jobIdproposals,
  getproposals,
} = require('../controller/proposalContoller.js');

//= =======================user router==============================//

router.post('/set-profile/:userId', authenticate, authorization, Profile); // Corrected route paths
router.post('/register', registerFormValidation, register);
router.post('/refresh-token', RefreshToken);
router.post('/forgot-password', forgotpassword);
router.post('/login', login);
router.post('/logoutUser', authenticate, logoutUser);
router.patch('/user/avatar', authenticate, upload.single('avatar'), avatar); // Corrected route paths
router.post('/reset-password/:token', resetPasswordtoken);
router.patch(
  '/user/:userId/country',
  authenticate,
  authorization,
  userIncountry,
);
router.patch(
  '/user/:userId/visibility',
  authenticate,
  authorization,
  userVisibility,
); // done
router.patch(
  '/user/:userId/skills',
  authenticate,
  authorization,
  UpdateUserIdskills,
); // done
router.get('/user', authenticate, getUser); // done
router.post('/searchApi', searchApi);
router.get('/checkUser/:userId', checkUserByID);

router.patch(
  '/profile/:userId',
  authenticate,
  authorization,
  UpdateTiTleDescription,
); // done
router.patch(
  '/user/:userId/update-kind',
  authenticate,
  authorization,
  updatekind,
); //   done
router.get(
  '/get-profile/:userId',
  // authenticate,
  // authorization,
  getProfileUsinId,
); // done
router.put(
  '/update-profile/:userId',
  authenticate,
  authorization,
  updateprofileUsingId,
); // done
router.patch('/edit-profile/:userId', authenticate, authorization, editprofile); // done
router.get(
  '/api/profile/complete_percentage/:userId',
  authenticate,
  authorization,
  profilePercentage,
);
router.put(
  '/external-profiles/:userId',
  authenticate,
  authorization,
  updateExternalProfile,
);
// router.delete(
//   '/external-profiles/:userId/:externalProfileIds', h
//   authenticate,
//   authorization,
//   deleteExternalProfile,
// );
router.delete(
  '/external-profiles/:userId',
  authenticate,
  authorization,
  deleteExternalProfile,
);

router.post(
  '/addExprience/:userId',
  authenticate,
  authorization,
  addExperience,
); // done
router.patch(
  '/api/users/:userId/:experienceId',
  [
    check('experience.*.title').notEmpty(),
    check('experience.*.companyName').notEmpty(),
    check('experience.*.startDate').isISO8601(),
    check('experience.*.startYear').isInt(),
  ],
  authenticate,
  authorization,
  updateUserExperience,
);
router.delete(
  '/deleteExprience/:userId/:experienceId',
  authenticate,
  authorization,
  deleteExprience,
);

router.post(
  '/addCertificate/:userId',
  authenticate,
  authorization,
  addCertificate,
); // done
router.put(
  '/updateCertificate/:userId/:certificateId',
  authenticate,
  authorization,
  updateCertificate,
);

router.post(
  '/updateCertificate/:userId/:certificateId',
  authenticate,
  authorization,
  updateCertificate,
);

router.delete(
  '/deleteCertificates/:userId/:certificateId',
  authenticate,
  authorization,
  deleteCertificates,
);

router.post(
  '/deleteCertificates/:userId/:certificateId',
  authenticate,
  authorization,
  deleteCertificates,
);



router.post('/addeducation/:userId', authenticate, authorization, addeducation);
router.put(
  '/updateEducation/:userId/:educationId',
  authenticate,
  authorization,
  updateEducation,
);
router.delete(
  '/deleteducation/:userId/:educationId',
  authenticate,
  authorization,
  deleteducation,
);

router.post('/email-verify', emailverify);

//= ==========================  task route ==========================//

router.post(
  '/create-task',
  authenticate,
  upload.array('images', 10),
  createtask,
);
router.get('/task/:taskId', authenticate, gettaskById);
router.get('/tasks/user/:userId', authenticate, gettasksUserByuserId);
router.get('/tasks', gettask);
router.get('/searchTask', authenticate, searchTask);
router.post(
  '/set-task-init-tx-status',
  authenticate,
  validateTaskTXStatusRule,
  setTaskInitTxStatus,
);

// Edit - anything but not images
router.patch(
  '/updatetasks/:userId/:taskId',
  authenticate,
  authorization,
  updateTask,
);

// EDIT - Upload new image in task and not other things
router.put(
  '/updatetasksImages/:userId/:taskid',
  authenticate,
  authorization,
  upload.array('images', 10),
  updateTaskImages,
);

// EDIT - for deleting image in task
router.delete(
  '/deleteTask/:userId/:taskId',
  authenticate,
  authorization,
  deleteTask,
);

router.delete(
  '/deleteImagetasks/:userId/:taskId/images/:imageId',
  authenticate,
  authorization,
  deleteTaskImage,
);
//= ====================Bonous router===============================//
router.post('/bonus', authenticate, bonus);
router.post(
  '/user/:userId/claim-bonus/:bonusId',
  authenticate,
  userUserIdClaimBonusByBonusId,
);
router.get('/bonuses', authenticate, getBonuse);
router.post('/change-mode', authenticate, changeMode);

//= ===================job router====================//
router.post('/post-job', authenticate, jobPost);
router.get('/user/:userId/job-posts', authenticate, getJobUsingUserId);
router.get('/api/jobs', authenticate, getJobs);
router.get('/api/jobs/:jobId', authenticate, getjobsjobId);
router.get('/search', authenticate, search);
router.put('/updateJobs:/jobId', authenticate, updateJob);
router.delete('/delete/:jobId', authenticate, deletedJob);

//======================savetask=====================//

router.post('/createSaveTask', authenticate, saveTask);
router.get('/getSaveTask/:userId', getSavedTasks);
router.delete('/deleteSaveTask/:saveTaskId', authenticate, deleteSaveTask);

//========================msgRouter===================//
// router.post('/sendmsg', authenticate, sendMessage);
// router.get('/getmsg/:userId', authenticate, getMessageById);
// router.get('/getmsg', authenticate, getMessageForUser);
// router.delete('/deletemsg/:messageid', authenticate, deleteMessage);
router.post('/sendmsg', authenticate, (req, res) =>
  sendMessage(req, res, req.app.get('io')),
);

// Route to get a message by ID
router.get('/getmsg/:userId', authenticate, getMessageById);

// Route to get messages for a user
router.get('/getmsg', authenticate, getMessageForUser);

// Route to delete a message
router.delete('/deletemsg/:messageid', authenticate, (req, res) =>
  deleteMessage(req, res, req.app.get('io')),
);

router.get('/start-chat/:id_tochatwith', authenticate, openChatWithPerson);

//==================offer router ==========================//
router.post('/createoffer', authenticate, CreateOffer);
router.get('/getoffer/:userId', authenticate, authorization, getOffer);

//=================order router==============================//
// router.post('/order/:offerId', createOrder);

router.get('/admin/all-users', authenticate, adminAuthorization, getAllUsers);
router.post('/admin/delete-user', authenticate, adminAuthorization, deleteUser);
router.post(
  '/admin/get-user-details',
  authenticate,
  adminAuthorization,
  getUserDetails,
);

router.post('/check-username-avilable', checkUsernameAvailable);
//========================order===============================//
router.post('/order/initialize', authenticate, createOrder);
router.get('/order/:orderID', authenticate, getOrder);
router.get('/orders/freelancer/:status', authenticate, getFreelancerOrders);
router.patch('/orders/:orderId/approve', authenticate, approveOrder);
router.patch(
  '/order/:orderId/decline',
  authenticate,
  declineOrderValidationRules,
  declineOrder,
);
router.patch('/order/:orderId/withdraw', authenticate, withdrawOrder);
// router.patch(
//   '/order/:orderId/ordercomplete',
//   authenticate,
//   freelancerCompleteOrder,
// );
router.patch(
  '/order/:orderId/ordercomplete',
  authenticate,// Assuming you have an authentication middleware
  upload.array('files', 5), // Allow up to 5 files to be uploaded
  freelancerCompleteOrder,
);
router.patch(
  '/order/:orderId/orderDeliverd',
  authenticate,
  orderStatusDelivered,
);
router.patch(
  '/order/:orderId/orderRevision',
  authenticate,
  orderStatusRevision,
);

//======================dispute route================//
router.post(
  '/createDispute',
  authenticate,
  upload.array('images', 10),
  createDispute,
);
router.get('/getDispute/:userId', authenticate, getDisputes);
router.patch('/dispute/:disputeId/approve', authenticate, resolveDispute);
router.delete('/dispute/:disputeId/delete', authenticate, deleteDispute);
router.delete(
  '/deleteImagedispute/:userId/:disputeId/:imageId',
  authenticate,
  authorization,
  deleteDisputeImageByUrl,
);
router.put(
  '/updateDispute/:userId/:disputeId',
  authenticate,
  authorization,
  upload.array('images', 10),
  updateDispute,
);
router.patch('/dispute/:disputeId/cancel', authenticate, cancelDispute);
router.get('/getDisputeDetails', authenticate, getAllDisputes);

//======================proposal controller===================//
router.post('/proposals/:jobId', authenticate, jobIdproposals);
router.get('/proposals/:jobId', authenticate, getproposals);

module.exports = router;
