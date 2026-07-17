import { Note } from '../models/note.js';

export const getAllNotes = async () => {
  return Note.find();
};

export const getNoteById = async (noteId) => {
  return Note.findById(noteId);
};

export const createNote = async (payload) => {
  return Note.create(payload);
};

export const deleteNote = async (noteId) => {
  return Note.findByIdAndDelete(noteId);
};

export const updateNote = async (noteId, payload) => {
  return Note.findByIdAndUpdate(noteId, payload, {
    new: true,
    runValidators: true,
  });
};
