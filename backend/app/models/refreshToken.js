const { Op, Model, QueryTypes, DataTypes, Sequelize } = require('sequelize');
const config = require("../configs/auth.config");
const { v4: uuidv4 } = require("uuid");
const sequelize = new Sequelize(process.env.DATABASE_CONN);

module.exports = () => {
    const RefreshToken = sequelize.define("refresh_token", {
        user_id: {
            type: DataTypes.UUID,
            allowNull: false,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        token: {
            type: DataTypes.STRING,
        },
        sekolah_id: {
            type: DataTypes.UUID,
            allowNull: true,
        },
        level: {
            type: DataTypes.SMALLINT,
        },
        expiryDate: {
            type: DataTypes.DATE,
        },
    }, {
        sequelize,
        tableName: 'refresh_token',
        schema: 'public',
        timestamps: false
    });

    RefreshToken.createToken = async function (user) {
        let expiredAt = new Date();

        expiredAt.setSeconds(expiredAt.getSeconds() + config.jwtRefreshExpiration);

        let _token = uuidv4();

        let refreshToken = await this.findOne({
            where: { user_id: user.id }
        }).then(obj => {
            if (obj) {
                return this.update({
                    token: _token,
                    level: user.level,
                    sekolah_id: user.sekolah_id ?? null,
                    expiryDate: expiredAt.getTime()
                }, {
                    where: {
                        user_id: user.id
                    }
                })
                .then(() => {
                    return this.findOne({
                        where: {
                            user_id: user.id
                        }
                    }, {
                        raw: false
                    })
                })
            }
            return this.create({
                token: _token,
                user_id: user.id,
                level: user.level,
                sekolah_id: user.sekolah_id ?? null,
                expiryDate: expiredAt.getTime(),
            }, {
                returning: true,
                raw: false
            })
        })

        return refreshToken.token;
    };

    RefreshToken.verifyExpiration = (token) => {
        return token.expiryDate.getTime() < new Date().getTime();
    };

    return RefreshToken;
};