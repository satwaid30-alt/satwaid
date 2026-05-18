const { Op, Sequelize } = require('sequelize');
const sequelize = new Sequelize(process.env.DATABASE_URL);
const initModels = require('../database/init');
var models = initModels(sequelize);

module.exports.getSpecies = async (req, res, next) => {
    try {
        const _species = await models.species.findAll({
            where: {
                deleted_at: null
            },
            order: [['name', 'ASC']]
        });

        res.status(200).json({
            message: "Species fetched successfully",
            data: _species
        });
    } catch (err) {
        next(err);
    }
}

module.exports.getSpeciesBySlug = async (req, res, next) => {
    try {
        const _species = await models.species.findOne({
            where: {
                slug: req.params.slug,
                deleted_at: null
            },
            include: [{
                model: models.morph_groups,
                as: 'morph_groups',
                where: { deleted_at: null },
                required: false
            }]

        });

        if (!_species) {
            return res.status(404).json({ message: "Species not found" });
        }

        res.status(200).json({
            message: "Species fetched successfully",
            data: _species
        });
    } catch (err) {
        next(err);
    }
}

module.exports.updateSpecies = async (req, res, next) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const _species = await models.species.findByPk(id);

        if (!_species) {
            return res.status(404).json({ message: "Species not found" });
        }

        await _species.update({
            ...updateData,
            updated_at: new Date()
        });

        res.status(200).json({
            message: "Species updated successfully",
            data: _species
        });
    } catch (err) {
        next(err);
    }
}

module.exports.createSpecies = async (req, res, next) => {
    try {
        const createData = req.body;

        const _species = await models.species.create({
            ...createData,
            created_at: new Date()
        });

        res.status(201).json({
            message: "Species created successfully",
            data: _species
        });
    } catch (err) {
        next(err);
    }
}

module.exports.deleteSpecies = async (req, res, next) => {
    try {
        const { id } = req.params;

        const _species = await models.species.findByPk(id);

        if (!_species) {
            return res.status(404).json({ message: "Species not found" });
        }

        await _species.update({
            deleted_at: new Date()
        });

        res.status(200).json({
            message: "Species deleted successfully"
        });
    } catch (err) {
        next(err);
    }
}
