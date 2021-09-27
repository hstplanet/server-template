module.exports = {


    friendlyName: 'API onAuthChange Page',


    description: 'API onAuthChange Page',


    exits: {

        success: {
            // viewTemplatePath: 'pages/dashboard/welcome',
            description: 'Display the welcome page for authenticated users.'
        },

    },


    fn: async function () {
        
        var userRecord = await User.findOne({
            id: this.req.session.userId
        });
        this.res.json(userRecord);
    }


};
