const mongoose = require('mongoose');

const foodSchema = new mongoose.Schema({
    name: String,
    weight: Number,
    calories: Number,
    protein: { type: Number, required: false }
});

const exerciseSchema = new mongoose.Schema({
    name: String,
    calories: Number
});

const entrySchema = new mongoose.Schema({
    date: { type: String, unique: true },
    weight: Number,
    waterIntake: Number,
    exercises: [exerciseSchema],
    calorieIntake: [foodSchema]
});

module.exports = mongoose.model('Entry', entrySchema);
