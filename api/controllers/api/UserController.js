/**
 * UserController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

const orm = require('../Functions/Orm');

module.exports = {

    model: function (req, res) {
        const model = require('../../models/User');
        res.json(model.attributes);
    },

    orm: async function (req, res) {
        orm.functionSelect(User, req.body).then(response => {
            res.json(response);
        });
    },
};