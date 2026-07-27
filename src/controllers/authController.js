import { readFile } from 'node:fs/promises';

import bcrypt from 'bcrypt';
import Handlebars from 'handlebars';
import jwt from 'jsonwebtoken';
import createHttpError from 'http-errors';
import { isValidObjectId } from 'mongoose';

import { User } from '../models/user.js';
import { Session } from '../models/session.js';

import { createSession, setSessionCookies } from '../services/auth.js';

import { sendEmail } from '../utils/sendMail.js';

const resetPasswordTemplatePath = new URL(
  '../templates/reset-password-email.html',
  import.meta.url,
);

export const registerUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      throw createHttpError(400, 'Email in use');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      email,
      password: hashedPassword,
    });

    const session = await createSession(user._id);

    setSessionCookies(res, session);

    return res.status(201).json(user);
  } catch (error) {
    next(error);
  }
};

export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      throw createHttpError(401, 'Invalid credentials');
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      throw createHttpError(401, 'Invalid credentials');
    }

    await Session.deleteMany({
      userId: user._id,
    });

    const session = await createSession(user._id);

    setSessionCookies(res, session);

    return res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

export const refreshUserSession = async (req, res, next) => {
  try {
    const { sessionId, refreshToken } = req.cookies;

    if (!sessionId || !refreshToken || !isValidObjectId(sessionId)) {
      throw createHttpError(401, 'Session not found');
    }

    const session = await Session.findOne({
      _id: sessionId,
      refreshToken,
    });

    if (!session) {
      throw createHttpError(401, 'Session not found');
    }

    if (session.refreshTokenValidUntil < new Date()) {
      await Session.deleteOne({
        _id: session._id,
      });

      const cookieOptions = {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
      };

      res.clearCookie('sessionId', cookieOptions);
      res.clearCookie('accessToken', cookieOptions);
      res.clearCookie('refreshToken', cookieOptions);

      throw createHttpError(401, 'Session token expired');
    }

    await Session.deleteOne({
      _id: session._id,
    });

    const newSession = await createSession(session.userId);

    setSessionCookies(res, newSession);

    return res.status(200).json({
      message: 'Session refreshed',
    });
  } catch (error) {
    next(error);
  }
};

export const logoutUser = async (req, res, next) => {
  try {
    const { sessionId } = req.cookies;

    if (sessionId && isValidObjectId(sessionId)) {
      await Session.deleteOne({
        _id: sessionId,
      });
    }

    const cookieOptions = {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
    };

    res.clearCookie('sessionId', cookieOptions);
    res.clearCookie('accessToken', cookieOptions);
    res.clearCookie('refreshToken', cookieOptions);

    return res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const requestResetEmail = async (req, res, next) => {
  try {
    const { email } = req.body;

    const successResponse = {
      message: 'Password reset email sent successfully',
    };

    const user = await User.findOne({ email });

    /*
     * Навіть якщо користувача немає, повертаємо 200.
     * Так стороння особа не зможе визначити, які email
     * зареєстровані в системі.
     */
    if (!user) {
      return res.status(200).json(successResponse);
    }

    const token = jwt.sign(
      {
        sub: user._id.toString(),
        email: user.email,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '15m',
      },
    );

    const templateSource = await readFile(resetPasswordTemplatePath, 'utf8');

    const template = Handlebars.compile(templateSource);

    const frontendDomain = process.env.FRONTEND_DOMAIN.replace(/\/$/, '');

    const resetLink = `${frontendDomain}/reset-password?token=${token}`;

    const html = template({
      name: user.username,
      link: resetLink,
    });

    try {
      await sendEmail({
        to: user.email,
        subject: 'Password reset',
        html,
      });
    } catch {
      throw createHttpError(
        500,
        'Failed to send the email, please try again later.',
      );
    }

    return res.status(200).json(successResponse);
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    let payload;

    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      throw createHttpError(401, 'Invalid or expired token');
    }

    if (typeof payload !== 'object' || !payload.sub || !payload.email) {
      throw createHttpError(401, 'Invalid or expired token');
    }

    const user = await User.findOne({
      _id: payload.sub,
      email: payload.email,
    });

    if (!user) {
      throw createHttpError(404, 'User not found');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    user.password = hashedPassword;

    await user.save();

    return res.status(200).json({
      message: 'Password reset successfully',
    });
  } catch (error) {
    next(error);
  }
};
