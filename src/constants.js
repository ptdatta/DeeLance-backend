/* eslint-disable import/prefer-default-export */

const refreshTokenOptions = {
  httpOnly: true,
  secure: true,
  maxAge: 604800000, // 7 * 24 * 60 * 60 * 1000 (e.g., 1 week)
  // sameSite: 'None',
};

const jwtExpiresIn = {
  refreshToken: '7d',
  accessToken: '1h',
};

module.exports = {
  refreshTokenOptions,
  jwtExpiresIn,
};
