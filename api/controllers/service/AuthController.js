module.exports = {

    signin: async function (req, res, next) {
        sails.config.custom.baseUrl = req.body.baseUrl;
        sails.config.custom.auth = req.body.auth;
        sails.config.custom.serverURL = req.body.serverURL;

        var userRecord = await User.updateOne({
            emailAddress: req.body.emailAddress.toLowerCase(),
        }).set({ isLogin: true, signToken: await sails.helpers.strings.random('url-friendly') });

        if (!userRecord) {
            res.json({ err: true, code: 'auth/user-found', message: "Kullanıcı bulunamadı." });
            return;
        }

        try {
            await sails.helpers.passwords.checkPassword(req.body.password, userRecord.password)
                .intercept('incorrect', 'badCombo');
        } catch (error) {
            res.json({ err: true, code: 'auth/wrong-password', message: "E Posta veya şifre hatalı." });
            return;
        }

        if (req.body.rememberMe) {
            if (req.isSocket) {
                sails.log.warn(
                    'Received `rememberMe: true` from a virtual request, but it was ignored\n' +
                    'because a browser\'s session cookie cannot be reset over sockets.\n' +
                    'Please use a traditional HTTP request instead.'
                );
            } else {
                req.session.cookie.maxAge = sails.config.custom.rememberMeCookieMaxAge;
            }
        }
        req.session.userId = userRecord.id;

        res.json({ token: userRecord.signToken })
        if (sails.hooks.sockets) {
            await sails.helpers.broadcastSessionChange(req);
        }
    },

    signup: async function (req, res) {
        sails.config.custom.baseUrl = req.body.baseUrl;
        sails.config.custom.auth = req.body.auth;

        var newEmailAddress = req.body.emailAddress.toLowerCase();
        try {
            var newUserRecord = await User.create(_.extend({
                emailAddress: newEmailAddress,
                password: await sails.helpers.passwords.hashPassword(req.body.password),
                signToken: await sails.helpers.strings.random('url-friendly'),
                tosAcceptedByIp: req.ip,
                isLogin: true
            }, sails.config.custom.auth.emailVerification ? {
                emailProofToken: await sails.helpers.strings.random('url-friendly'),
                emailProofTokenExpiresAt: Date.now() + sails.config.custom.emailProofTokenTTL,
                emailStatus: 'unconfirmed'
            } : {}))
                .intercept('E_UNIQUE', 'emailAlreadyInUse')
                .intercept({ name: 'UsageError' }, 'invalid')
                .fetch();

            if (sails.config.custom.enableBillingFeatures) {
                let stripeCustomerId = await sails.helpers.stripe.saveBillingInfo.with({
                    emailAddress: newEmailAddress
                }).timeout(5000).retry();
                await User.updateOne({ id: newUserRecord.id })
                    .set({
                        stripeCustomerId
                    });
            }

            req.session.userId = newUserRecord.id;

            if (sails.hooks.sockets) {
                await sails.helpers.broadcastSessionChange(req);
            }
            res.json({ token: newUserRecord.signToken });
            return;
        } catch (err) {
            if (err.raw === 'emailAlreadyInUse') {
                res.json({ err: true, code: 'emailAlreadyInUse', message: "Bu Email adresi kullanılıyor." });
                return;
            }
        }
        res.json({ err: true, code: 'emailAlreadyInUse', message: "Bu Email adresi kullanılıyor." });
    },

    resetPassword: async function (req, res) {
        sails.config.custom.baseUrl = req.body.baseUrl;
        var userRecord = await User.findOne({ emailAddress: req.body.email });
        if (!userRecord) {
            res.json({ err: true, code: 'auth/invalid-email', message: "Kullanıcı bulunamadı." });
            return;
        }
        var token = await sails.helpers.strings.random('url-friendly');
        await User.updateOne({ id: userRecord.id })
            .set({
                passwordResetToken: token,
                passwordResetTokenExpiresAt: Date.now() + sails.config.custom.passwordResetTokenTTL,
            });
        res.json({ code: 'email/send-email', message: "Sıfırlama E Postası gönderildi.", token: token, fullName: userRecord.fullName });
    },

    delete: async function (req, res) {
        var email = req.body.emailAddress;
        var userRecord = await User.findOne({ emailAddress: email });
        if (!userRecord) {
            res.json({ err: true, code: 'auth/invalid-email', message: "Kullanıcı bulunamadı." });
            return;
        }

        await User.destroyOne({ id: userRecord.id });
        res.json({ err: false, code: 'auth/delete-user', message: "Kullanıcı sistemden silindi." });

    },

    logout: async function (req, res) {
        console.log(req.body);
        var updateUserRecord = await User.updateOne({
            signToken: req.body.token,
            isLogin: true
        }).set({ isLogin: false });


        delete req.session.userId;

        if (sails.hooks.sockets) {
            await sails.helpers.broadcastSessionChange(req);
        }
        if (updateUserRecord === undefined) {
            res.json({ err: true, code: "auth-logout-err", message: "Oturum kapatılamadı." });
            return;
        }

        res.json({ code: "auth-logout-ok", message: "Oturum başarılıyla kapatıldı." });
    },

    update: async function (req, res) {
        var data = {}

        data.fullName = req.body.fullName;
        data.name = req.body.name;
        data.lastname = req.body.lastname;
        data.lang = req.body.lang;
        data.invitation = req.body.invitation;
        if (req.body.photoURL.length > 0) {
            data.photoURL = req.body.photoURL;
        }

        if (req.body.organization !== null && req.body.organization !== undefined) {
            if (typeof req.body.organization === 'number') {
                data.organization = req.body.organization;
            } else {
                data.organization = req.body.organization.id;
            }
        }

        if (req.body.invitation !== undefined && req.body.invitation.length > 0) {
            data.invitation = [];
            req.body.invitation.forEach(element => {
                if (typeof element === 'number') {
                    data.invitation.push(element)
                } else {
                    data.invitation.push(element.id)
                }
            });
        }

        if (req.body.phone.length > 0) {
            data.phone = req.body.phone;
        }
        if (req.body.user !== undefined) {
            data.user = req.body.user;
        }
        if (req.body.sex.length > 0) {
            data.sex = req.body.sex;
        }
        if (req.body.birthDay.length > 0) {
            data.birthDay = req.body.birthDay;
        }
        var newUserRecord = await User.updateOne({
            signToken: req.body.token
        }).set(data);


        req.session.userId = newUserRecord.id;

        if (sails.hooks.sockets) {
            await sails.helpers.broadcastSessionChange(req);
        }

        res.json({ code: "auth-update-ok", message: "Profil başarıyla güncellendi." });
    },

    onAuthStateChanged: async function (req, res) {
        var userRecord = await User.findOne({
            signToken: req.body.token,
            isLogin: true
        }).populateAll();
        if (userRecord === undefined) {
            res.json({ err: true, code: "auth-onChanged-found", message: "Kullanıcı bulunamadı." })
            return;
        }
        res.json(userRecord);
    },

    sendEmailVerification: async function (req, res) {

        var UserRecord = await User.findOne({
            signToken: req.body.token
        });

        if (sails.config.custom.auth.emailVerification) {
            try {
                await sails.helpers.sendTemplateEmail.with({
                    to: UserRecord.emailAddress,
                    subject: 'Lütfen Hesabınızı Doğrulayın.',
                    template: 'email-verify-account',
                    templateData: {
                        fullName: UserRecord.fullName,
                        token: UserRecord.emailProofToken
                    }
                });
                res.json({ code: 'email/send-email', message: "Onaylama E Postası gönderildi." });
                return;
            } catch (error) {

                res.json({ err: true, code: 'email/send-email', message: "Onaylama E Postası gönderilemedi" });
                return;
            }
        } else {
            sails.log.info('Skipping new account email verification... (since `verifyEmailAddresses` is disabled)');
            res.json({ err: true, code: 'email/send-email', message: "Onaylama E Postası gönderilemedi" });
        }
    },

    emailVerification: async function (req, res) {
        var activeToken = req.body.activeToken;
        var token = req.body.token;

        if (!activeToken) {
            res.json({ err: true, code: "invalidOrExpiredToken", message: "Onaylama anahtarı bulunamadı." });
            return;
        }

        // Get the user with the matching email token.
        var user = await User.findOne({ signToken: token });
        // If no such user exists, or their token is expired, bail.
        if (!user || user.emailProofTokenExpiresAt <= Date.now()) {
            res.json({ err: true, code: "invalidOrExpiredToken", message: "Bu anahtarın kullanım süresi dolmuş." });
            return;
        }
        if (user.emailStatus === 'unconfirmed') {
            await User.updateOne({ id: user.id }).set({
                emailStatus: 'confirmed',
                emailProofToken: '',
                emailProofTokenExpiresAt: 0
            });
            req.session.userId = user.id;

            if (sails.hooks.sockets) {
                await sails.helpers.broadcastSessionChange(req);
            }

            res.json({ code: "verification", message: "Email adresiniz onaylandı." });
            return;
        } else {
            res.json({ err: true, code: "emailChangeCandidate", message: "Onaylama anahtarı bulunamadı." });
            return;
        }
    },

    sendNewPassword: async function (req, res) {
        var token = req.body.token;
        var password = req.body.password;

        if (!token) {
            res.json({ err: true, code: "invalidOrExpiredToken", message: "Onaylama anahtarı bulunamadı." });
            return;
        }

        // Look up the user with this reset token.
        var userRecord = await User.findOne({ passwordResetToken: token });

        // If no such user exists, or their token is expired, bail.
        if (!userRecord || userRecord.passwordResetTokenExpiresAt <= Date.now()) {
            res.json({ err: true, code: "invalidOrExpiredToken", message: "Bu anahtarın kullanım süresi dolmuş." });
            return;
        }

        // Hash the new password.
        var hashed = await sails.helpers.passwords.hashPassword(password);

        // Store the user's new password and clear their reset token so it can't be used again.
        await User.updateOne({ id: userRecord.id })
            .set({
                password: hashed,
                passwordResetToken: '',
                passwordResetTokenExpiresAt: 0
            });

        // Log the user in.
        // (This will be persisted when the response is sent.)
        /*if (this.req.session !== undefined) {
            this.req.session.userId = userRecord.id;
        }*/


        // In case there was an existing session, broadcast a message that we can
        // display in other open tabs.
        /*if (sails.hooks.sockets) {
            await sails.helpers.broadcastSessionChange(this.req);
        }*/

        res.json({ code: "new-password", message: "Şifreniz değiştirildi." });
        return;
    }

}