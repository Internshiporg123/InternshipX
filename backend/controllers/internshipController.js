const Internship = require("../models/Internship");

exports.createInternship = async (req, res) => {

    try {

        const {
            title,
            companyName,
            location,
            stipend,
            duration,
            description,
            skills
        } = req.body;

        const internship = await Internship.create({

            title,
            companyName,
            location,
            stipend,
            duration,
            description,
            skills,
            postedBy: req.user.id

        });

        res.status(201).json({

            success: true,
            message: "Internship created successfully.",
            internship

        });

    } catch (error) {

        res.status(500).json({

            success: false,
            message: error.message

        });

    }

};

exports.getCompanyInternships = async (req, res) => {

    try {

        const internships = await Internship.find({
            postedBy: req.user.id
        }).sort({
            createdAt: -1
        });

        res.json(internships);

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

};

exports.getAllInternships = async (req, res) => {

    try {

        const internships = await Internship.find()
            .sort({ createdAt: -1 });

        res.json(internships);

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

};

exports.getPublicInternships = async (req, res) => {

    try {

        const internships = await Internship.find()
            .select("title companyName location stipend duration skills createdAt")
            .sort({ createdAt: -1 })
            .limit(3);

        res.json(internships);

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

};
exports.deleteInternship = async(req,res)=>{

    try{

        const internship = await Internship.findOneAndDelete({

            _id:req.params.id,

            postedBy:req.user.id

        });

        if(!internship){

            return res.status(404).json({

                success:false,

                message:"Internship not found."

            });

        }

        res.json({

            success:true,

            message:"Internship deleted."

        });

    }

    catch(error){

        res.status(500).json({

            success:false,

            message:error.message

        });

    }

};

exports.updateInternship = async (req, res) => {

    try {

        const internship = await Internship.findOne({
            _id: req.params.id,
            postedBy: req.user.id
        });

        if (!internship) {

            return res.status(404).json({
                success: false,
                message: "Internship not found."
            });

        }

        internship.title = req.body.title;
        internship.companyName = req.body.companyName;
        internship.location = req.body.location;
        internship.duration = req.body.duration;
        internship.stipend = req.body.stipend;
        internship.description = req.body.description;
        internship.skills = req.body.skills;

        await internship.save();

        res.json({
            success: true,
            message: "Internship updated successfully.",
            internship
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

};

exports.getInternshipById = async (req, res) => {
    try {
        const internship = await Internship.findById(req.params.id);
        if (!internship) {
            return res.status(404).json({
                success: false,
                message: "Internship not found."
            });
        }
        res.json(internship);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};