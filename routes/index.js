const express = require('express');
const router = express.Router();
const Entry = require('../models/Entry');

const ACTIVITY_FACTOR = 1.375;
const AGE = 24;
const HEIGHT = 174;

function calculateBMR(weight) {
    return 10 * weight + 6.25 * HEIGHT - 5 * AGE + 5;
}

function getISTDateInfo() {
    const now = new Date();
    const istOffset = 330 * 60 * 1000; // 5:30 hours in milliseconds
    const istTime = new Date(now.getTime() + istOffset);
    return istTime.toISOString().split('T')[0]; // YYYY-MM-DD format
}

router.route('/')
    .get(async (req, res) => {
        try {
            const currentISTDate = getISTDateInfo();
            let todayEntry = await Entry.findOne({ date: currentISTDate });

            if (!todayEntry) {
                todayEntry = await Entry.create({ date: currentISTDate });
            }

            // Get ALL entries sorted by date (newest first)
            const allEntries = await Entry.find({}).sort({ date: -1 });

            // Calculate totals for each entry
            const entriesWithTotals = allEntries.map(entry => {
                const totalCalories = entry.calorieIntake.reduce((sum, f) => sum + (f.calories || 0), 0);
                const totalProtein = entry.calorieIntake.reduce((sum, f) => sum + (f.protein || 0), 0);
                const totalCaloriesBurnt = entry.exercises.reduce((sum, e) => sum + (e.calories || 0), 0);
                const BMR = entry.weight ? calculateBMR(entry.weight) : 0;
                const maintenance = BMR * ACTIVITY_FACTOR;
                const deficit = maintenance - (totalCalories - totalCaloriesBurnt);

                return {
                    ...entry.toObject(),
                    totalCalories,
                    totalProtein,
                    totalCaloriesBurnt,
                    maintenance: Math.round(maintenance),
                    deficit: Math.round(deficit)
                };
            });

            res.render('index', {
                allEntries: entriesWithTotals,
                currentDate: currentISTDate
            });

        } catch (err) {
            console.error(err);
            res.status(500).send('Server Error');
        }
    })
    .post(async (req, res) => {
        try {
            const currentISTDate = getISTDateInfo();
            let entry = await Entry.findOne({ date: currentISTDate });

            if (!entry) {
                entry = await Entry.create({ date: currentISTDate });
            }

            // Process form data (same as before)
            const {
                weight,
                waterIntake,
                exerciseName,
                exerciseCalories,
                foodName,
                foodWeight,
                foodCalories,
                foodProtein
            } = req.body;

            if (weight && !isNaN(weight)) entry.weight = parseFloat(weight);
            if (waterIntake && !isNaN(waterIntake)) entry.waterIntake = (entry.waterIntake || 0) + parseFloat(waterIntake);
            if (exerciseName && exerciseCalories) {
                entry.exercises.push({
                    name: exerciseName,
                    calories: parseFloat(exerciseCalories),
                    timestamp: new Date()
                });
            }
            if (foodName || foodWeight || foodCalories || foodProtein) {
                entry.calorieIntake.push({
                    name: foodName || '',
                    weight: parseFloat(foodWeight) || 0,
                    calories: parseFloat(foodCalories) || 0,
                    protein: parseFloat(foodProtein) || 0,
                    timestamp: new Date()
                });
            }

            await entry.save();
            res.redirect('/');

        } catch (err) {
            console.error(err);
            res.status(500).send('Server Error');
        }
    });

module.exports = router;