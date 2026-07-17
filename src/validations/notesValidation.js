import { Joi, Segments } from 'celebrate';
import { isValidObjectId } from 'mongoose';

import { TAGS } from '../constants/tags.js';

const validateObjectId = (value, helpers) => {
  if (!isValidObjectId(value)) {
    return helpers.error('any.invalid');
  }

  return value;
};

const noteIdValidation = Joi.string()
  .custom(validateObjectId, 'MongoDB ObjectId validation')
  .required()
  .messages({
    'any.invalid': '"noteId" must be a valid MongoDB ObjectId',
  });

export const getAllNotesSchema = {
  [Segments.QUERY]: Joi.object({
    page: Joi.number().integer().min(1).default(1),

    perPage: Joi.number().integer().min(5).max(20).default(10),

    tag: Joi.string().valid(...TAGS),

    search: Joi.string().allow(''),
  }),
};

export const noteIdSchema = {
  [Segments.PARAMS]: Joi.object({
    noteId: noteIdValidation,
  }),
};

export const createNoteSchema = {
  [Segments.BODY]: Joi.object({
    title: Joi.string().trim().min(1).required(),

    content: Joi.string().allow(''),

    tag: Joi.string().valid(...TAGS),
  }),
};

export const updateNoteSchema = {
  ...noteIdSchema,

  [Segments.BODY]: Joi.object({
    title: Joi.string().trim().min(1),

    content: Joi.string().allow(''),

    tag: Joi.string().valid(...TAGS),
  })
    .or('title', 'content', 'tag')
    .required(),
};
