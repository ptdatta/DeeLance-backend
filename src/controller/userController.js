const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const crypto = require('crypto');

const nodemailer = require('nodemailer');
const { validationResult } = require('express-validator');
const { streamClient } = require('../services/streamChatService');
// const { readdirSync } = require('fs');

const verify = require('../model/verifyUserModel');
const User = require('../model/userModel');
// eslint-disable-next-line no-unused-vars
const { getUserFromToken } = require('../middleware/mid');
const { refreshTokenOptions } = require('../constants');
const {
  uploadOnCloudinary,
  deleteavatarFromCloudinary,
} = require('../utils/cloudinary');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'noreply@deelance.com',
    pass: 'exstgantrkhpvbmz',
  },
});

//= ===========generateAccessAndRefereshTokens============//
const generateAccessAndRefereshTokens = async (userId, res) => {
  try {
    // Check if userId is provided
    if (!userId) {
      return res
        .status(400)
        .json({ status: false, msg: 'User ID is required' });
    }

    // Find the user by ID
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ status: false, msg: 'User not found' });
    }

    // // Generate access token
    const accessToken = user.generateAccessToken();

    // // Generate refresh token
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    // // Log tokens for debugging
    // console.log('Access Token:', accessToken);
    // console.log('Refresh Token:', refreshToken);

    return { accessToken, refreshToken };
  } catch (error) {
    console.error('Error during token generation:', error);
    return res
      .status(500)
      .json({ status: false, msg: 'Internal server error' });
  }
};

//= ========================refreshtoken======================//
const RefreshToken = async (req, res) => {
  try {
    const incomingRefreshToken =
      req.cookies.refreshToken ||
      req.body.refreshToken ||
      req.headers['refresh-token'];

    if (!incomingRefreshToken) {
      return res
        .status(401)
        .json({ status: false, msg: 'refreshToken is mandatory' });
    }

    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET,
    );

    if (!decodedToken) {
      return res
        .status(401)
        .json({ status: false, msg: 'Invalid RefreshToken' });
    }

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      return res
        .status(401)
        .json({ status: false, msg: 'Invalid refresh token' });
    }

    if (!user.refreshToken || incomingRefreshToken !== user.refreshToken) {
      return res
        .status(400)
        .json({ status: false, msg: 'Refresh token is expired or used' });
    }

    const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(
      user._id,
    );

    // Update refresh token in the database
    user.refreshToken = refreshToken;
    await user.save();

    // Set refresh token in response headers
    res.set('refreshToken', refreshToken);
    res.cookie('refreshToken', refreshToken, refreshTokenOptions);

    return res.status(200).json({
      status: true,
      accessToken,
      refreshToken,
      msg: 'Access token refreshed',
    });
  } catch (error) {
    console.error('Error during token refresh:', error);
    return res
      .status(401)
      .json({ status: false, msg: error?.message || 'Invalid refresh token' });
  }
};

//= ==========================signup user====================================//

const register = async (req, res) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { UserName, email, password, wallet, referrer, accountType } =
      req.body;

    // Check if the email exists in the verify collection
    const existingVerifyEmail = await verify.findOne({ email });
    if (existingVerifyEmail) {
      // Email exists in verifies collection, update the existing verification document

      // Update the existing verification document with new values
      existingVerifyEmail.UserName = UserName;
      existingVerifyEmail.wallet = wallet;
      existingVerifyEmail.referrer = referrer;
      existingVerifyEmail.accountType = accountType;

      // Save the updated verify document to the database
      await existingVerifyEmail.save();

      // Construct verification URL
      const verificationUrl = `${process.env.FRONTEND_URL}/email-verify?token=${existingVerifyEmail.verificationToken}&email=${existingVerifyEmail.email}`;

      // Send verification email
      const emailData = {
        from: 'noreply@deelance.com',
        to: email,
        subject: 'Verify your Email! - Deelance',
        html: `
          <!DOCTYPE html>
          <html lang="en">
          <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Email Verification</title>
          </head>
          <body>
              <p>Hello ${UserName},</p>
              <p>Thanks for signing up for Deelance.</p>
              <p>Please click the link below to verify your account:</p>
              <a href="${verificationUrl}">Verify your account</a>
              <p>Cheers,<br/>The Deelance Team</p>
          </body>
          </html>
        `,
      };

      transporter.sendMail(emailData, function (err, info) {
        if (err) {
          console.error('Error sending verification email:', err);
          return res
            .status(500)
            .json({ message: 'Failed to send verification email' });
        }
        console.log('Email sent:', info.response);
        res.status(201).json({
          message: 'Verification email sent successfully',
          data: verificationUrl,
        });
      });
    } else {
      // Email does not exist in verifies collection, proceed with creating a new verification document

      // Generate verification token
      const verificationToken = crypto.randomBytes(20).toString('hex');

      // Create new verify instance
      const newVerify = new verify({
        UserName,
        email,
        password, // No need to hash the password here
        wallet,
        verificationToken,
        referrer,
        accountType,
      });

      // Save the verify document to the database
      await newVerify.save();

      // Construct verification URL
      // const verificationUrl = `${process.env.FRONTEND_URL}/email-verify?token=${verificationToken}`;
      const verificationUrl = `${process.env.FRONTEND_URL}/email-verify?token=${verificationToken}&email=${newVerify.email}`;

      // Send verification email
      const emailData = {
        from: 'noreply@deelance.com',
        to: email,
        subject: 'Verify your Email! - Deelance',
        html: `
          <!DOCTYPE html>
          <html lang="en">
          <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Email Verification</title>
          </head>
          <body>
              <p>Hello ${UserName},</p>
              <p>Thanks for signing up for Deelance.</p>
              <p>Please click the link below to verify your account:</p>
              <a href="${verificationUrl}">Verify your account</a>
              <p>Cheers,<br/>The Deelance Team</p>
          </body>
          </html>
        `,
      };

      transporter.sendMail(emailData, function (err, info) {
        if (err) {
          console.error('Error sending verification email:', err);
          return res
            .status(500)
            .json({ message: 'Failed to send verification email' });
        }
        console.log('Email sent:', info.response);
        res.status(201).json({
          message: 'Verification email sent successfully',
          data: verificationUrl,
        });
      });
    }
  } catch (error) {
    console.error('Failed to register user:', error);
    res.status(500).json({ message: 'Failed to register user' });
  }
};

const emailverify = async (req, res) => {
  const { token } = req.body; // Adjust according to where the token is sent from

  try {
    const verifyDocument = await verify.findOne({
      verificationToken: token,
    });

    if (!verifyDocument) {
      return res.status(404).send({ msg: 'Invalid verification token' });
    }

    // Create a new user from the verify document
    const newUser = new User({
      ...verifyDocument.toObject(),
      verified: true,
      verificationToken: undefined,
    });

    await newUser.save();
    await verify.deleteOne({ _id: verifyDocument._id });

    res.status(200).json({ msg: 'Email verified successfully' });
  } catch (error) {
    res.status(500).json({ msg: 'Error verifying email', error });
  }
};

// =========================login User ==============================//

const login = async (req, res) => {
  // memoryCheck.js

  try {
    const { email, password } = req.body;

    if (!email) {
      return res.status(400).send({ status: false, msg: ' email is required' });
    }

    // Find the user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res
        .status(404)
        .send({ status: false, msg: 'User does not exist' });
    }

    // Check if the password is correct
    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
      return res.status(401).send({ status: false, msg: 'Incorrect password' });
    }

    // If the password is correct, generate new access and refresh tokens
    const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(
      user._id,
    );

    // Update user's refresh token in the database
    try {
      user.refreshToken = refreshToken;
      await user.save();
    } catch (updateError) {
      console.log('updateError = ', updateError);

      return res.status(500).send({
        status: false,
        msg: 'Failed to update refresh token',
      });
    }

    // Retrieve the logged-in user without sending the password and refresh token
    // const loggedInUser = await User.findById(user._id).select('-password');

    // Set cookies with access token and refresh token
    // res.cookie('accessToken', accessToken, { httpOnly: true, secure: true });
    // res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: true });
    res.cookie('refreshToken', refreshToken, refreshTokenOptions);

    const abcd = {
      id: String(user._id),
      name: `${user.FirstName} ${user.LastName}`,
      image: user.avatar,
    };
    try {
      await streamClient.upsertUsers([abcd]);
    } catch (error) {
      console.log('failed to update user on STREAM CHAT', error);
    }

    // Return the user data and tokens
    return res.status(200).json({ accessToken: accessToken });
  } catch (error) {
    console.log('login error = ', error);
    return res.status(500).send({ status: false, msg: 'Failed to login' });
  }
};

const checkUsernameAvailable = async (req, res) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username } = req.body;

    const isUsernameTaken = await User.findOne({
      UserName: { $regex: new RegExp(`^${username}$`, 'i') },
    });

    if (isUsernameTaken) {
      res.status(200).send({
        status: true,
        msg: 'username not available',
        available: false,
      });
      return;
    }

    res
      .status(200)
      .send({ status: true, msg: 'username available', available: true });
  } catch (error) {
    return res
      .status(500)
      .send({ status: false, msg: 'Failed to look for username' });
  }
};

//= ====================log out ==================================//

const changeMode = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const userMode = user.Mode;

    if (userMode === 'FREELANCER') {
      user.Mode = 'CLIENT';
    } else {
      user.Mode = 'FREELANCER';
    }

    const updatedUser = await user.save();

    res.send({
      status: true,
      msg: 'user mode updated successfully',
      currentMode: updatedUser.Mode,
      data: user,
    });
  } catch (error) {
    return res
      .status(500)
      .send({ status: false, msg: 'Failed to update user Mode' });
  }
};

const logoutUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      user.refreshToken = undefined;
      await user.save();
    }

    // Clear cookies
    res.clearCookie('accessToken', { httpOnly: true, secure: true });
    res.clearCookie('refreshToken', { httpOnly: true, secure: true });

    await streamClient.partialUpdateUser({
      id: String(user._id),
      set: { online: false, status: 'offline' },
    });

    // Send response
    return res.status(200).json({
      success: true,
      message: 'User logged out successfully',
      data: {},
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'An error occurred while logging out user',
      error: error.message,
    });
  }
};

//= ============================forget password=================================//

async function sendPasswordResetEmail(to, resetLink) {
  const emailHtml = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="x-apple-disable-message-reformatting">
    <meta http-equiv="x-ua-compatible" content="ie=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="format-detection" content="telephone=no, date=no, address=no, email=no">
    <meta name="color-scheme" content="light dark">
    <meta name="supported-color-schemes" content="light dark">
    <title>Reset Password - Deelance</title>
    <style>
      .hover-bg-primary-light:hover {
        background-color: #55f3de !important;
      }
      .hover-text-decoration-underline:hover {
        text-decoration: underline;
      }
      @media (max-width: 600px) {
        .sm-w-full {
          width: 100% !important;
        }
        .sm-py-8 {
          padding-top: 32px !important;
          padding-bottom: 32px !important;
        }
        .sm-px-6 {
          padding-left: 24px !important;
          padding-right: 24px !important;
        }
        .sm-leading-8 {
          line-height: 32px !important;
        }
      }
    </style>
  </head>
  <body style="word-break: break-word; -webkit-font-smoothing: antialiased; margin: 0; width: 100%; background-color: #f8fafc; padding: 0">
    <div role="article" aria-roledescription="email" lang="en">
      <table style="width: 100%; font-family: ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif" cellpadding="0" cellspacing="0" role="presentation">
        <tr>
          <td align="center" style="background-color: #f8fafc">
            <table class="sm-w-full" style="width: 600px" cellpadding="0" cellspacing="0" role="presentation">
              <tr>
                <td class="sm-py-8 sm-px-6" style="padding: 18px; background: #0A0A0B;">
                  <h1 style="border: 0; color: #ffffff; max-width: 55%; vertical-align: middle">Deelance</h1>
                </td>
              </tr>
              <tr>
                <td align="center" class="sm-px-6">
                  <table style="width: 100%" cellpadding="0" cellspacing="0" role="presentation">
                    <tr>
                      <td class="sm-px-6" style="border-radius: 4px; background-color: #fff; padding: 16px 28px 16px 28px; text-align: left; font-size: 14px; line-height: 24px; color: #334155; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05)">
                        <p>Hello,</p>
                        <p>To reset your password, please click the button below:</p>
                        <div style="line-height: 100%; margin-bottom: 20px; text-align: center;">
                          <a href="${resetLink}" class="hover-bg-primary-light" style="text-decoration: none; display: inline-block; border-radius: 4px; background-color: #864DD2; padding-top: 14px; padding-bottom: 14px; padding-left: 16px; padding-right: 16px; text-align: center; font-size: 14px; font-weight: 600; color: #fff">Reset Password &rarr;</a>
                        </div>
                        <p>Cheers,</p>
                        <p>The Deelance Team</p>
                      </td>
                    </tr>
                    <tr>
                      <td style="height: 48px"></td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>
  </body>
  </html>`;

  const mailOptions = {
    from: 'noreply@deelance.com',
    to,
    subject: 'Reset Password - Deelance',
    html: emailHtml,
  };

  try {
    const result = await transporter.sendMail(mailOptions);
    console.log('Email inviata con successo:', result);
  } catch (error) {
    console.error("Errore nell'invio dell'email:", error);
  }
}
const forgotpassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).send('User not found');
    }

    const token = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${token}`;
    await sendPasswordResetEmail(user.email, resetUrl);
    // Send email with resetUrl...

    res.status(200).send({
      msg: 'Password reset link sent to your email address. Please reset your password!',
      data: resetUrl,
    });
  } catch (error) {
    console.error('Failed to initiate password reset:', error);
    res.status(500).send({ msg: 'Failed to initiate password reset' });
  }
};
const resetPasswordtoken = async (req, res) => {
  try {
    const { password } = req.body;
    const { token } = req.params;

    if (!password) {
      return res.status(400).send({ msg: 'Please enter a new password' });
    }

    if (password.length < 8) {
      return res
        .status(400)
        .send({ msg: 'Password must be at least 8 characters long' });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).send('Invalid or expired token');
    }

    const isSamePassword = await user.isPasswordCorrect(password); // Compare passwords
    if (isSamePassword) {
      return res
        .status(400)
        .send('New password cannot be the same as the old password');
    }

    // If the new password is different, update the password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    user.refreshToken = undefined;

    await user.save();

    res
      .status(200)
      .send({ status: true, msg: 'Password changed successfully!' });
  } catch (error) {
    console.error('Failed to reset password:', error);
    res.status(500).send({ msg: 'Failed to reset password' });
  }
};

//= =========================get user===================================//
const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select(
      '-password -refreshToken',
    );

    if (!user) {
      return res.status(404).send('User not found');
    }
    res.json({ status: true, msg: 'user fetch successfully', data: user });
  } catch (error) {
    console.log(error);
    res.status(500).send('Server error');
  }
};

//==================check userBy Id=====================//
const checkUserByID = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select(
      '-password -refreshToken',
    );
    if (!user) {
      return res.status(404).send('User not found');
    }
    res.json({ status: true, msg: 'User fetched successfully', data: user });
  } catch (error) {
    console.log(error);
    res.status(500).send('Server error');
  }
};

//= =========================cretae profile==================================//

const Profile = async (req, res) => {
  try {
    // const { userId } = req.userId ;
    const { user } = req;
    // console.log("this is user" ,user)

    //  const user = await User.findById(user);

    if (!user) {
      return res.status(404).send('User not found');
    }
    if (!req.body.UserName) {
      return res
        .status(400)
        .send({ status: false, msg: 'UserName are missing' });
    }

    // Update user fields
    user.UserName = req.body.UserName;
    user.title = req.body.title;
    user.description = req.body.description;
    // user.skills = req.body.skills;
    user.Mode = req.body.Mode;
    user.education = req.body.education;
    user.otherDetails = req.body.otherDetails;
    user.country = req.body.country;
    user.external_profiles = req.body.external_profiles;
    user.certificate = req.body.certificate;

    if (req.body.skills) {
      if (typeof req.body.skills === 'string') {
        // If skills is a single string, wrap it in an array of objects
        user.skills = [{ label: req.body.skills }];
      } else if (Array.isArray(req.body.skills)) {
        // If skills is an array, ensure each element is an object
        user.skills = req.body.skills.map(skill =>
          typeof skill === 'string' ? { label: skill } : skill,
        );
      }
    }
    // Check if experience array exists
    if (req.body.experience && req.body.experience.length > 0) {
      // Update experience fields
      req.body.experience.forEach((exp, index) => {
        // Check if user.experience[index] exists, otherwise create it
        if (!user.experience[index]) {
          user.experience[index] = {};
        }

        user.experience[index].title = exp.title;
        user.experience[index].companyName = exp.companyName;
        user.experience[index].location = exp.location;
        user.experience[index].locationType = exp.locationType;
        user.experience[index].employementType = exp.employementType;
        user.experience[index].currentlyWorkingHere = exp.currentlyWorkingHere;
        user.experience[index].startMonth = exp.startMonth;
        user.experience[index].startYear = exp.startYear;

        // Conditionally update endDate and endYear based on currentlyWorkingHere
        if (!exp.currentlyWorkingHere) {
          // Check if endYear and endMonth are provided
          if (!exp.endYear || !exp.endMonth) {
            throw new Error(
              'End Month or end year is required for past experiences',
            );
          }

          user.experience[index].endMonth = exp.endMonth;
          user.experience[index].endYear = exp.endYear;
        } else {
          // If currentlyWorkingHere is true, remove endDate and endYear
          user.experience[index].endMonth = undefined;
          user.experience[index].endYear = undefined;
        }
      });
    }

    await user.save();
    // const formattedExternalProfiles = user.external_profiles.map(profile => {
    //   return {
    //     type: profile.type,
    //     public_url: profile.public_url,
    //   };
    // });

    // Send success response with formatted external profiles
    res.status(200).json({
      status: true,
      message: 'Profile updated successfully',
      // external_profiles: formattedExternalProfiles,
    });
  } catch (error) {
    console.error('Server error:', error);
    res.status(400).json({ error: error.message }); // Send error response
  }
};

//= ========================update kind =====================================//

const updatekind = async (req, res) => {
  try {
    const { user } = req;

    if (!user) {
      return res.status(404).json({ status: false, msg: 'User not found' });
    }
    user.kind = req.body.kind; // Assuming kind is passed in req.body
    await user.save();

    res.status(200).send({ status: true, msg: 'Kind updated successfully' });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).send('Server error');
  }
};

//= =======================user visiblity isprivate update api ================//

const userVisibility = async (req, res) => {
  // const { userId } = req.params;
  const { isPrivate } = req.body;

  try {
    const { user } = req;

    if (!user) {
      return res.status(404).json({ status: false, msg: 'User not found' });
    }

    user.isPrivate = isPrivate;
    await user.save();

    res
      .status(200)
      .send({ status: true, msg: 'Profile visibility updated successfully' });
  } catch (error) {
    res.status(500).send('Server error');
  }
};

//= ======================= edit profile user ==================================//

const editprofile = async (req, res) => {
  // const { userId } = req.params;

  const data = req.body;
  try {
    const { user } = req;

    if (!user) {
      return res.status(404).json({ status: false, msg: 'User not found' });
    }

    // Update user fields individually
    // eslint-disable-next-line no-restricted-syntax, guard-for-in
    for (const key in data) {
      user[key] = data[key];
    }

    // Save the updated user
    await user.save();

    res
      .status(200)
      .json({ status: true, message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).send('Server error');
  }
};

//= ===================get profile with all data with other model data using userId and matching userId in all model =============//
const getProfileUsinId = async (req, res) => {
  const { userId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(404).json({ error: 'User not found' });
  }

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = await User.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(userId) } },
      {
        $lookup: {
          from: 'bonuses',
          localField: '_id',
          foreignField: 'userId',
          as: 'bonusesData',
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'referrer',
          foreignField: '_id',
          as: 'referrerData',
        },
      },
      {
        $lookup: {
          from: 'tasks',
          localField: '_id',
          foreignField: 'userId',
          as: 'tasksData',
        },
      },
      // Add more lookup stages for other related collections if needed
    ]);

    const userProfile = {
      UserName: user.UserName,
      email: user.email,

      wallet: user.wallet,
      external_profiles: user.external_profiles,
      FullName: user.FullName,
      isPrivate: user.isPrivate,
      bonuses: userData[0].bonusesData,
      points: user.points,
      title: user.title,
      avatar: user.avatar,
      description: user.description,
      skills: user.skills,
      country: user.country,
      education: user.education,
      experience: user.experience,
      certificate: user.certificate,
      otherDetails: user.otherDetails,
      kind: user.kind,
      tasks: userData[0].tasksData,
      referrer: userData[0].referrerData,
      is_profileCompleted: user.is_profileCompleted,
      accountType: user.accountType,
      _id: user._id,
    };

    res.json({
      status: true,
      msg: 'data fetch successfully',
      user: userProfile,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

//= ==================================update profile using Id============================//
const updateprofileUsingId = async (req, res) => {
  // const { userId } = req.params;
  try {
    const { user } = req;

    if (!user) {
      return res.status(404).json({ status: false, msg: 'User not found' });
    }

    Object.assign(user, req.body);
    await user.save();

    res
      .status(200)
      .json({ status: true, message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).send('Server error');
  }
};

//= ==================update skills =============================//
const UpdateUserIdskills = async (req, res) => {
  // const { userId } = req.params;
  const { skills } = req.body;

  try {
    const { user } = req;

    if (!user) {
      return res.status(404).json({ status: false, msg: 'User not found' });
    }

    // Check if skills is an array of strings or an array of objects
    if (Array.isArray(skills) && typeof skills[0] === 'string') {
      // Convert the array of strings to an array of objects
      user.skills = skills.map(skill => ({ code: skill, label: skill }));
    } else {
      // Otherwise, assume skills is already in the correct format
      user.skills = skills;
    }

    await user.save();

    // Send a JSON response with the updated skills
    res.status(200).json({
      status: true,
      msg: 'data update successgully',
      skills: user.skills,
    });
  } catch (error) {
    console.log('Server error:', error);
    // Send a JSON response with the error message
    res.status(500).json({ error: 'Server error' });
  }
};

//= =================update profile title or decription========================//

const UpdateTiTleDescription = async (req, res) => {
  // const { userId } = req.params;
  const { title, description } = req.body;
  try {
    // Assuming user object is available in the request
    const { user } = req;

    if (!user) {
      return res.status(404).json({ status: false, msg: 'User not found' });
    }

    // Update user properties
    user.title = title;
    user.description = description;
    await user.save();

    res.json({ status: true, msg: `Data updated successfully` });
  } catch (error) {
    console.log(error);
    res.status(500).send('Server error');
  }
};

//= =======================updtae country===========================//

const userIncountry = async (req, res) => {
  // const { userId } = req.params;
  const { country } = req.body;

  try {
    const { user } = req;
    if (!user) {
      return res.status(404).json({ status: false, msg: 'User not found' });
    }

    user.country = country;
    await user.save();
    res
      .status(200)
      .send({ status: true, msg: 'Profile country updated successfully' });
  } catch (error) {
    console.log('Server error:', error);
    res.status(500).send('Server error');
  }
};

//= =============================avatar upload and update =================================//

const avatar = async (req, res) => {
  try {
    // Extract user ID from authenticated user
    const userId = req.user._id;

    if (!req.file) {
      return res.status(400).send({ status: false, msg: 'No file uploaded' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).send('User not found');
    }

    const avatarUrl = req.file.path; // Access path directly
    if (!avatarUrl) {
      return res
        .status(400)
        .json({ status: false, msg: 'avatar file is required' });
    }

    const previousAvatarUrl = user.avatar;

    // If there is a previous avatar and it exists in Cloudinary, delete it
    if (previousAvatarUrl) {
      const deleteResult = await deleteavatarFromCloudinary(previousAvatarUrl);
      if (!deleteResult) {
        return res.status(400).json({
          status: false,
          msg: 'Failed to delete previous avatar from Cloudinary',
        });
      }
    }

    // Upload new avatar to Cloudinary
    const uploadResult = await uploadOnCloudinary(avatarUrl);
    if (!uploadResult) {
      return res
        .status(400)
        .json({ status: false, msg: 'avatar file upload failed' });
    }

    // Update user's avatar field with Cloudinary URL
    user.avatar = uploadResult.url;
    await user.save(); // Save the updated user object

    res
      .status(200)
      .json({ msg: 'Avatar updated successfully', data: user.avatar });
  } catch (error) {
    console.error('Error updating avatar:', error);
    res.status(500).send({ status: false, msg: 'Server error' });
  }
};

// =================================profile complete % ==============================//

function calculateProfileCompletion(user) {
  const requiredFields = [
    'experience',
    'title',
    'avatar',
    'email',
    'UserName',
    'country',
    'description',
    'skills',
  ];

  const fieldPercentages = {
    email: 5,
    UserName: 5,
    country: 10,
    skills: 20,
    experience: 20,
    avatar: 20,
    title: 10,
    description: 10,
  };

  let completedFields = 0;
  let totalProgress = 0;
  const missingAreas = {};

  function isDefaultValue(value) {
    return (
      (typeof value === 'string' && value.trim() === '') ||
      (Array.isArray(value) && value.length === 0)
    );
  }

  requiredFields.forEach(field => {
    const fieldValue = user[field];

    if (
      fieldValue !== undefined &&
      fieldValue !== null &&
      !isDefaultValue(fieldValue)
    ) {
      completedFields += fieldPercentages[field];
      totalProgress += fieldPercentages[field];
    } else {
      let label;
      if (field === 'country') {
        label = 'Location'; //================Update label to 'Location' if country is missing============//d
      } else if (field === 'title' || field === 'description') {
        label = 'Headline & Bio';
      } else {
        label = field.charAt(0).toUpperCase() + field.slice(1);
      }

      const progress = Math.abs(fieldPercentages[field]); //============Ensure progress is positive==============//

      if (field === 'title' || field === 'description') {
        //============Combine 'title' and 'description' into a single object in missingAreas======//
        const combinedLabel = 'title,description';
        if (!missingAreas[combinedLabel]) {
          missingAreas[combinedLabel] = {
            keywords: ['title', 'description'],
            progress: progress,
            items_count: null,
            label: 'Headline & Bio',
          };
        } else {
          missingAreas[combinedLabel].progress += progress;
        }
      } else {
        missingAreas[field] = {
          keywords: [field],
          progress: progress,
          items_count: null,
          label: label,
        };
      }

      totalProgress += fieldPercentages[field];
    }
  });

  const totalPercentage = Math.max((completedFields / totalProgress) * 100, 0);

  return {
    completion_percent: Math.floor(totalPercentage),
    missing_areas: missingAreas,
    profile_completion_hit_at: null,
  };
}

const profilePercentage = async ({ user }, res) => {
  try {
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { completion_percent, missing_areas, profile_completion_hit_at } =
      calculateProfileCompletion(user);
    if (completion_percent === 100 && !user.is_profileCompleted) {
      const updatedUser = { ...user.toObject() };
      updatedUser.is_profileCompleted = true;
      await User.findByIdAndUpdate(user._id, updatedUser);
    }

    res.json({
      completion_percent,
      missing_areas,
      profile_completion_hit_at,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

//=======================update external profile links==============================//
const updateExternalProfile = async (req, res) => {
  try {
    const { user } = req;
    const { external_profiles } = req.body;

    // Check if user exists
    if (!user) {
      return res.status(404).json({ status: false, msg: 'User not found' });
    }

    // If external_profiles is an array, update all profiles
    if (Array.isArray(external_profiles)) {
      user.external_profiles = external_profiles;
    } else if (external_profiles && typeof external_profiles === 'object') {
      // If external_profiles is an object, update a single profile
      const { type, public_url } = external_profiles;
      const { profileId } = req.params;

      // Find the index of the profile to update
      const profileIndex = user.external_profiles.findIndex(
        profile => profile._id.toString() === profileId,
      );

      // Check if profile exists
      if (profileIndex === -1) {
        return res.status(404).send('External profile not found');
      }

      // Update the profile
      user.external_profiles[profileIndex].type = type;
      user.external_profiles[profileIndex].public_url = public_url;
    } else {
      return res
        .status(400)
        .json({ status: false, msg: 'Invalid request data' });
    }

    // Save the updated user document
    await user.save();

    res.status(200).json({
      status: true,
      message: 'External profiles updated successfully',
      user,
    });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).send('Server error');
  }
};

//===========================delete  external profile links=============================//
// const deleteExternalProfile = async (req, res) => {
//   try {
//     const { user } = req;
//     const { externalProfileIds } = req.params;

//     if (!mongoose.Types.ObjectId.isValid(externalProfileIds)) {
//       return res.status(400).send({
//         status: false,
//         msg: 'Please enter a valid externalProfileIds',
//       });
//     }
//     const index = user.external_profiles.findIndex(
//       exp => exp._id.toString() === externalProfileIds,
//     );

//     // If the index is -1, the experience with the provided ID was not found
//     if (index === -1) {
//       return res.status(404).json({
//         status: false,
//         message: 'No experience found with the provided ID',
//       });
//     }

//     user.external_profiles.splice(index, 1);

//     await user.save();

//     res.status(200).json({
//       status: true,
//       message: 'External profiles deleted successfully',
//     });
//   } catch (error) {
//     console.error('Error deleting external profiles:', error);
//     res.status(500).json({ status: false, message: 'Internal server error' });
//   }
// };

const deleteExternalProfile = async (req, res) => {
  try {
    const { user } = req;
    const { externalProfileIds } = req.body;

    // Check if user exists
    if (!user) {
      return res.status(404).json({ status: false, message: 'User not found' });
    }

    // Check if externalProfileIds array is provided
    if (
      !externalProfileIds ||
      !Array.isArray(externalProfileIds) ||
      externalProfileIds.length === 0
    ) {
      return res.status(400).json({
        status: false,
        message: 'Invalid or missing external profile IDs in the request body',
      });
    }

    // Check if all provided externalProfileIds exist in the user's external_profiles array
    const invalidIds = externalProfileIds.filter(
      id =>
        !user.external_profiles.some(profile => profile._id.toString() === id),
    );
    if (invalidIds.length > 0) {
      return res.status(404).json({
        status: false,
        message:
          "Some or all provided external profile IDs are not found in the user's profile",
      });
    }

    // Delete external profiles
    user.external_profiles = user.external_profiles.filter(
      profile => !externalProfileIds.includes(profile._id.toString()),
    );

    // Save the updated user document
    await user.save();

    res.status(200).json({
      status: true,
      message: 'External profiles deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting external profiles:', error);
    res.status(500).json({ status: false, message: 'Internal server error' });
  }
};

//=====================update experience ======================================//

const updateUserExperience = async (req, res) => {
  try {
    const { experienceId } = req.params;
    const { user } = req;

    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ message: 'No experience data provided' });
    }

    //===========Extract updated experience data from the request body===================//
    const updatedExperienceData = req.body;

    //========Check if 'currentlyWorkingHere' field is being updated================//
    if ('currentlyWorkingHere' in updatedExperienceData) {
      //======If 'currentlyWorkingHere' is set to false, validate 'endMonth' and 'endYear'=========//
      if (!updatedExperienceData.currentlyWorkingHere) {
        if (
          updatedExperienceData.endMonth === undefined ||
          updatedExperienceData.endYear === undefined
        ) {
          return res.status(400).json({
            message: 'End Month and end year are required for past experiences',
          });
        }
      } else {
        updatedExperienceData.endMonth = undefined;
        updatedExperienceData.endYear = undefined;
      }
    }

    const index = user.experience.findIndex(
      exp => exp._id.toString() === experienceId,
    );

    if (index === -1) {
      return res.status(404).json({ message: 'Experience not found' });
    }

    if (updatedExperienceData && typeof updatedExperienceData === 'object') {
      Object.assign(user.experience[index], updatedExperienceData);
    } else {
      return res.status(400).json({
        message: 'Invalid data provided for updating experience',
      });
    }

    await user.save();

    res.json({ user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

//===========================add exprience form of array and object ,,,add multiple =================================//

// const addExperience = async (req, res) => {
//   try {
//     const userData = req.body;
//     const { user } = req;

//     if (!userData.experience || userData.experience.length === 0) {
//       return res.status(400).json({ message: 'Experience data is required' });
//     }

//     // Validate each experience entry
//     for (const exp of userData.experience) {
// const newExperience = {
//   title: exp.title,
//   companyName: exp.companyName,
//   location: exp.location,
//   locationType: exp.locationType,
//   employmentType: exp.employmentType,
//   currentlyWorkingHere: exp.currentlyWorkingHere,
//   startMonth: exp.startMonth,
//   startYear: exp.startYear,
// };

//       if (!exp.currentlyWorkingHere) {
//         if (!exp.endYear || !exp.endMonth) {
//           return res.status(400).json({
//             message: 'End Month and end year are required for past experiences',
//           });
//         }
//         newExperience.endMonth = exp.endMonth;
//         newExperience.endYear = exp.endYear;
//       }

//       user.experience.push(newExperience);
//     }

//     await user.save();
//     return res.status(201).json({
//       status: true,
//       msg: 'User updated successfully and experience added successfully',
//     });
//   } catch (error) {
//     // Handle any unexpected errors
//     console.error(error);
//     return res
//       .status(500)
//       .json({ status: false, error: 'Internal Server Error' });
//   }
// };

//====================add exprience  using single object ========================//

const addExperience = async (req, res) => {
  try {
    const userData = req.body;
    console.log('Received userData:', userData); // Debug logging

    const { user } = req;

    if (!userData) {
      console.log('Experience data is missing'); // Debug logging
      return res.status(400).json({ message: 'Experience data is required' });
    }

    const exp = userData;

    const newExperience = {
      title: exp.title,
      companyName: exp.companyName,
      location: exp.location,
      locationType: exp.locationType,
      employementType: exp.employementType,
      currentlyWorkingHere: exp.currentlyWorkingHere,
      startMonth: exp.startMonth,
      startYear: exp.startYear,
    };

    if (!exp.currentlyWorkingHere) {
      if (!exp.endYear || !exp.endMonth) {
        console.log('End Month and end year are required for past experiences'); // Debug logging
        return res.status(400).json({
          message: 'End Month and end year are required for past experiences',
        });
      }
      newExperience.endMonth = exp.endMonth;
      newExperience.endYear = exp.endYear;
    }

    user.experience.push(newExperience);

    await user.save();
    return res.status(201).json({
      status: true,
      msg: 'User updated successfully and experience added successfully',
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ status: false, error: 'Internal Server Error' });
  }
};

//================================delete multiple or single  exprience ,using array   =========================//
// const deleteExprience = async (req, res) => {
//   try {
//     const { user } = req;

//     let { experienceId } = req.body;

//     if (!Array.isArray(experienceId)) {
//       experienceId = [experienceId];
//     }

//     // Check if any of the provided experienceIds is not a string
//     if (experienceId.some(id => typeof id !== 'string')) {
//       return res.status(400).json({
//         status: false,
//         message: 'Please provide valid experienceId(s)',
//       });
//     }

//     //===================Remove duplicates and ensure all IDs are strings===============//
//     experienceId = [...new Set(experienceId)].map(String);

//     //======================Check if all provided IDs are present in user.experience===============//
//     const invalidIds = experienceId.filter(
//       id => !user.experience.some(cert => cert._id.toString() === id),
//     );
//     if (invalidIds.length > 0) {
//       return res.status(400).json({
//         status: false,
//         message: 'we not found any document with this  provied id ',
//       });
//     }

//     // Remove certificates with the provided IDs
//     user.experience = user.experience.filter(
//       cert => !experienceId.includes(cert._id.toString()),
//     );

//     await user.save();

//     return res
//       .status(200)
//       .json({ status: true, message: 'experience deleted successfully' });
//   } catch (error) {
//     console.error('Error deleting experience:', error);
//     return res
//       .status(500)
//       .json({ status: false, message: 'Internal server error' });
//   }
// };

//===============delete exprience by id ,1 by 1================//
const deleteExprience = async (req, res) => {
  try {
    const { user } = req;
    const { experienceId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(experienceId)) {
      return res
        .status(400)
        .send({ status: false, msg: 'Please enter a valid experienceId' });
    }

    const index = user.experience.findIndex(
      exp => exp._id.toString() === experienceId,
    );

    // If the index is -1, the experience with the provided ID was not found
    if (index === -1) {
      return res.status(404).json({
        status: false,
        message: 'No experience found with the provided ID',
      });
    }

    user.experience.splice(index, 1);

    await user.save();

    return res.status(200).json({
      status: true,
      message: 'Experience deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting experience:', error);
    return res.status(500).json({
      status: false,
      message: 'Internal server error',
    });
  }
};

//=========================add certificate using array and add multiple==========================//
// const addCertificate = async (req, res) => {
//   try {
//     const { user } = req;

//     let certificates = req.body.certificate;
//     if (!Array.isArray(certificates)) {
//       certificates = [certificates];
//     }

//     //==================Validate all certificates first====================//
//     const errors = certificates.some(cert => {
//       return !cert.certificateName || !cert.issueBy || !cert.yearIssued;
//     });

//     if (errors) {
//       return res.status(400).json({
//         status: false,
//         msg: 'Please provide all fields for each certificate!',
//       });
//     }

//     //==============Add certificates to user's certificate array===============//
//     certificates.forEach(cert => {
//       user.certificate.push({
//         certificateName: cert.certificateName,
//         issueBy: cert.issueBy,
//         yearIssued: cert.yearIssued,
//       });
//     });

//     await user.save();

//     return res.status(201).json({
//       status: true,
//       msg: 'Certificates have been added',
//       data: user.certificate,
//     });
//   } catch (error) {
//     return res.status(500).json({ status: false, msg: error.message });
//   }
// };

//=================add certificate 1 by 1 ======================//
const addCertificate = async (req, res) => {
  try {
    const { user } = req;

    const certificate = req.body;

    if (!certificate) {
      return res.status(400).json({
        status: false,
        msg: 'Please provide certificate data',
      });
    }

    if (
      !certificate.certificateName ||
      !certificate.issueBy ||
      !certificate.yearIssued
    ) {
      return res.status(400).json({
        status: false,
        msg: 'Please provide all fields for the certificate',
      });
    }

    user.certificate.push({
      certificateName: certificate.certificateName,
      issueBy: certificate.issueBy,
      yearIssued: certificate.yearIssued,
    });

    await user.save();

    return res.status(201).json({
      status: true,
      msg: 'Certificate has been added',
      data: user.certificate,
    });
  } catch (error) {
    return res.status(500).json({ status: false, msg: error.message });
  }
};

//===========================update certificate=========================//

const updateCertificate = async (req, res) => {
  try {
    const { user } = req;
    const { certificateId } = req.params;
    const { certificateName, issueBy, yearIssued } = req.body;

    if (!mongoose.Types.ObjectId.isValid(certificateId)) {
      return res
        .status(400)
        .send({ status: false, msg: 'Please enter a valid  certificateId' });
    }

    if (!certificateName && !issueBy && !yearIssued) {
      return res.status(400).json({
        status: false,
        msg: 'Please provide at least one field to update',
      });
    }

    const certificate = await user.certificate.id(certificateId);

    if (!certificate) {
      return res
        .status(404)
        .json({ status: false, message: 'Certificate not found' });
    }

    if (certificateName) certificate.certificateName = certificateName;
    if (issueBy) certificate.issueBy = issueBy;
    if (yearIssued) certificate.yearIssued = yearIssued;

    await user.save();

    return res.status(200).json({
      status: true,
      message: 'Certificate updated successfully',
      data: certificate,
    });
  } catch (error) {
    console.error('Error updating certificate:', error);
    return res
      .status(500)
      .json({ status: false, message: 'Internal server error' });
  }
};

//=============================delete  multiple or single certificate  from user profile ====================================//
// constdeleteCertificates  = async (req, res) => {
//   try {
//     const { user } = req;

//     let { certificateIds } = req.body;

//     if (!Array.isArray(certificateIds)) {
//       certificateIds = [certificateIds];
//     }

//     // Check if any of the provided experienceIds is not a string
//     if (certificateIds.some(id => typeof id !== 'string')) {
//       return res.status(400).json({
//         status: false,
//         message: 'Please provide valid experienceId(s)',
//       });
//     }

//     //===================Remove duplicates and ensure all IDs are strings===============//
//     certificateIds = [...new Set(certificateIds)].map(String);

//     //======================Check if all provided IDs are present in user.certificate===============//
//     const invalidIds = certificateIds.filter(
//       id => !user.certificate.some(cert => cert._id.toString() === id),
//     );
//     if (invalidIds.length > 0) {
//       return res.status(400).json({
//         status: false,
//         message: 'we not found any document with the provied this id ',
//       });
//     }

//     // Remove certificates with the provided IDs
//     user.certificate = user.certificate.filter(
//       cert => !certificateIds.includes(cert._id.toString()),
//     );

//     await user.save();

//     return res
//       .status(200)
//       .json({ status: true, message: 'Certificates deleted successfully' });
//   } catch (error) {
//     console.error('Error deleting certificates:', error);
//     return res
//       .status(500)
//       .json({ status: false, message: 'Internal server error' });
//   }
// };
//==============================delete certificate =======================//
const deleteCertificates = async (req, res) => {
  try {
    const { user } = req;
    const { certificateId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(certificateId)) {
      return res
        .status(400)
        .send({ status: false, msg: 'Please enter a valid experienceId' });
    }

    const index = user.certificate.findIndex(
      cert => cert._id.toString() === certificateId,
    );

    if (index === -1) {
      return res.status(404).json({
        status: false,
        message: 'No certificate found with the provided ID',
      });
    }

    user.certificate.splice(index, 1);

    await user.save();

    return res.status(200).json({
      status: true,
      message: 'Certificate deleted successfully',
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: 'Internal server error',
    });
  }
};

//============================ add  education==============================//
const addeducation = async (req, res) => {
  try {
    const { user } = req;

    const education = req.body;

    if (!education) {
      return res
        .status(400)
        .json({ status: false, msg: 'give education data in req.body' });
    }

    if (!education.school || !education.degree || !education.graduation_year) {
      return res.status(400).json({
        status: false,
        msg: 'Please provide all fields for the education',
      });
    }

    user.education.push({
      school: education.school,
      degree: education.degree,
      graduation_year: education.graduation_year,
    });

    await user.save();

    return res.status(201).json({
      status: true,
      msg: 'education. has been added',
      data: user.education,
    });
  } catch (error) {
    return res.status(500).json({ status: false, msg: error.message });
  }
};

//===========================update education============================//
const updateEducation = async (req, res) => {
  try {
    const { user } = req;
    const { educationId } = req.params;
    const { school, degree, graduation_year } = req.body;
    if (!mongoose.Types.ObjectId.isValid(educationId)) {
      return res
        .status(400)
        .send({ status: false, msg: 'Please enter a valid  educationId' });
    }

    if (!school && !degree && !graduation_year) {
      return res.status(400).json({
        status: false,
        msg: 'Please provide at least one field to update',
      });
    }

    const education = await user.education.id(educationId);
    if (!education) {
      return res.status(400).json({
        status: false,
        msg: 'Education not found with this educationId',
      });
    }

    if (school) education.school = school;
    if (degree) education.degree = degree;
    if (graduation_year) education.graduation_year = graduation_year;

    await user.save();

    return res.status(200).json({
      status: true,
      message: 'Education updated successfully',
      data: user.education.id(educationId), // Return the updated education
    });
  } catch (error) {
    return res.status(500).json({ status: false, msg: error.message });
  }
};
//=========================delete education==========================//
const deleteducation = async (req, res) => {
  try {
    const { user } = req;
    const { educationId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(educationId)) {
      return res
        .status(400)
        .send({ status: false, msg: 'Please enter a valid educationId' });
    }

    const index = user.education.findIndex(
      cert => cert._id.toString() === educationId,
    );

    if (index === -1) {
      return res.status(404).json({
        status: false,
        message: 'No education found with the provided ID',
      });
    }

    user.education.splice(index, 1);

    await user.save();

    return res.status(200).json({
      status: true,
      message: 'education deleted successfully',
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: 'Internal server error',
    });
  }
};

const searchApi = async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) {
      return res
        .status(200)
        .json({ status: false, msg: 'provide userName', data: [] });
    }

    // Use a regex to search for names that start with or include the search term
    const regex = new RegExp(username, 'i'); // 'i' makes the search case-insensitive
    const userdetails = await User.find({
      UserName: regex,
      verified: true,
      is_profileCompleted: true,
    });

    if (userdetails.length === 0) {
      return res.status(200).send({
        status: false,
        msg: 'No users found with the given search term',
        data: [],
      });
    }

    return res.status(200).json({
      status: true,
      msg: 'Users fetched successfully',
      data: userdetails,
    });
  } catch (error) {
    return res.status(500).send({ status: false, msg: error.message });
  }
};
module.exports = {
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
};
