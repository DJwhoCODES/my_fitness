const express = require('express');
const router = express.Router();
const Entry = require('../models/Entry');

const ACTIVITY_FACTOR = 1.375;
const AGE = 24;
const HEIGHT = 174;

function calculateBMR(weight) {
    return 10 * weight + 6.25 * HEIGHT - 5 * AGE + 5;
}

router.get('/', async (req, res) => {
    const ISTDate = new Date().toLocaleDateString("en-IN");

    let today = await Entry.findOne({ date: ISTDate });
    if (!today) today = await Entry.create({ date: ISTDate });

    const totalCalories = today.calorieIntake.reduce((sum, f) => sum + (f.calories || 0), 0);
    const totalProtein = today.calorieIntake.reduce((sum, f) => sum + (f.protein || 0), 0);
    const totalCaloriesBurnt = today.exercises.reduce((sum, e) => sum + (e.calories || 0), 0);

    const BMR = today.weight ? calculateBMR(today.weight) : 0;
    const maintenance = BMR * ACTIVITY_FACTOR;
    const deficit = maintenance - (totalCalories - totalCaloriesBurnt);

    res.render('index', {
        entry: today,
        maintenance: Math.round(maintenance),
        totalCalories: totalCalories.toFixed(2),
        totalProtein: totalProtein.toFixed(2),
        totalCaloriesBurnt: totalCaloriesBurnt.toFixed(2),
        deficit: Math.round(deficit)
    });
});

router.post('/update', async (req, res) => {
    const ISTDate = new Date().toLocaleDateString("en-IN");
    let today = await Entry.findOne({ date: ISTDate });

    if (!today) today = await Entry.create({ date: ISTDate });

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

    // Update weight
    if (weight && !isNaN(weight)) {
        today.weight = parseFloat(weight);
    }

    // Update water intake
    if (waterIntake && !isNaN(waterIntake)) {
        const intake = parseFloat(waterIntake);
        today.waterIntake = (today.waterIntake || 0) + intake;
    }

    // Add exercise
    if (exerciseName && exerciseCalories && !isNaN(exerciseCalories)) {
        today.exercises.push({
            name: exerciseName,
            calories: parseFloat(exerciseCalories)
        });
    }

    // Add food intake
    if (foodName || foodWeight || foodCalories || foodProtein) {
        today.calorieIntake.push({
            name: foodName || '',
            weight: foodWeight && !isNaN(foodWeight) ? parseFloat(foodWeight) : 0,
            calories: foodCalories && !isNaN(foodCalories) ? parseFloat(foodCalories) : 0,
            protein: foodProtein && !isNaN(foodProtein) ? parseFloat(foodProtein) : 0
        });
    }

    await today.save();
    res.redirect('/');
});

module.exports = router;
