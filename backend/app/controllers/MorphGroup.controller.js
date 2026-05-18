const { Op, Sequelize } = require('sequelize');
const sequelize = new Sequelize(process.env.DATABASE_URL);
const initModels = require('../database/init');
var models = initModels(sequelize);

module.exports.getMorphGroups = async (req, res, next) => {
    try {
        const { species_id } = req.query;
        const where = { deleted_at: null };
        if (species_id) {
            where.species_id = species_id;
        }


        const _groups = await models.morph_groups.findAll({
            where,
            include: [{
                model: models.species,
                as: 'species',
                attributes: ['name', 'scientificName']
            }],
            order: [['created_at', 'DESC']]
        });


        res.status(200).json({
            message: "Morph groups fetched successfully",
            data: _groups
        });
    } catch (err) {
        next(err);
    }
}

module.exports.getMorphGroupById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const _group = await models.morph_groups.findByPk(id);

        if (!_group || _group.deleted_at) {
            return res.status(404).json({ message: "Morph group not found" });
        }

        res.status(200).json({
            message: "Morph group fetched successfully",
            data: _group
        });
    } catch (err) {
        next(err);
    }
}

module.exports.createMorphGroup = async (req, res, next) => {
    try {
        const createData = req.body;
        const _group = await models.morph_groups.create({
            ...createData,
            created_at: new Date()
        });

        res.status(201).json({
            message: "Morph group created successfully",
            data: _group
        });
    } catch (err) {
        next(err);
    }
}

module.exports.updateMorphGroup = async (req, res, next) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const _group = await models.morph_groups.findByPk(id);

        if (!_group) {
            return res.status(404).json({ message: "Morph group not found" });
        }

        await _group.update({
            ...updateData,
            updated_at: new Date()
        });

        res.status(200).json({
            message: "Morph group updated successfully",
            data: _group
        });
    } catch (err) {
        next(err);
    }
}

module.exports.deleteMorphGroup = async (req, res, next) => {
    try {
        const { id } = req.params;
        const _group = await models.morph_groups.findByPk(id);

        if (!_group) {
            return res.status(404).json({ message: "Morph group not found" });
        }

        await _group.update({
            deleted_at: new Date()
        });

        res.status(200).json({
            message: "Morph group deleted successfully"
        });
    } catch (err) {
        next(err);
    }
}
