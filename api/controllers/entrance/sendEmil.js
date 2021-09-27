module.exports = {

    inputs: {

        to: {
            required: true,
            type: 'string',
            isEmail: true,
        },
        subject: {
            required: true,
            type: 'string',
        }
    },


    fn: async function ({ to, subject }) {
        console.log(to);
    }


}