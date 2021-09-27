module.exports = {

    collectionBill: async function (req, res, next) {
        try {
            await sails.helpers.sendTemplateEmail.with({
                to: "",
                subject: 'HST - Ödeme Hatırlatma',
                template: 'email-collection-bill',
                templateData: req.body
            });
            console.log(req.body);
        } catch (error) {
            console.log(error);
        }
        res.send("OK")
    },

}