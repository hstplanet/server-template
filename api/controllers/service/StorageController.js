module.exports = {

    upload: function (req, res, next) {
        var req_userID = req.params.id;
        req.file('avatar').upload({ dirname: require('path').resolve(sails.config.appPath, 'assets/images') },
            async function (err, uploadedFiles) {
                var referans = uploadedFiles[0].fd.split("\\");
                if (err) return res.serverError(err);
                var serverURL = sails.config.custom.serverURL;
                var Record = await StorageModel.create({
                    name: uploadedFiles[0].filename,
                    fd: uploadedFiles[0].fd,
                    type: uploadedFiles[0].type,
                    size: uploadedFiles[0].size,
                    ref: referans[referans.length - 1].split(".")[0],
                    url: require('util').format('%s/service/storage/download/%s', serverURL, referans[referans.length - 1].split(".")[0]),
                    userID: req_userID
                }).fetch();
                if (Record) {
                    return res.json({ message: uploadedFiles.length + ' file(s) uploaded successfully!', downloadURL: Record.url });
                }
            });
    },

    download: function (req, res, next) {
        StorageModel.findOne({ ref: req.param('id') }).exec(function (err, user) {
            if (err) return res.serverError(err);
            if (!user) return res.notFound();

            if (!user.fd) {
                return res.notFound();
            }

            var SkipperDisk = require('skipper-disk');
            var fileAdapter = SkipperDisk(/* optional opts */);

            //res.set("Content-disposition", "attachment; filename='" + user.name + "'");
            fileAdapter.read(user.fd)
                .on('error', function (err) {
                    return res.serverError(err);
                })
                .pipe(res);
        });
    }
}