module.exports = {

    functionSelect(model, data) {
        return new Promise((resolve, reject) => {
            if (data.selector === 'find') {
                this.find(model, data.criteria).then(res => {
                    resolve(res);
                });
            } else if (data.selector === 'findOne') {
                this.findOne(model, data.criteria).then(res => {
                    resolve(res);
                });
            } else if (data.selector === 'create') {
                this.create(model, data.initialValues).then(res => {
                    resolve(res);
                });
            } else if (data.selector === 'destroy') {
                this.destroy(model, data.criteria).then(res => {
                    resolve(res);
                });
            } else if (data.selector === 'destroyOne') {
                this.destroyOne(model, data.criteria).then(res => {
                    resolve(res);
                });
            } else if (data.selector === 'update') {
                this.update(model, data.criteria, data.valuesToSet).then(res => {
                    resolve(res);
                });
            } else if (data.selector === 'count') {
                this.count(model, data.criteria).then(res => {
                    resolve(res);
                });
            }
        })
    },

    find(model, criteria) {
        return new Promise(async (resolve, reject) => {
            var Record = await model.find(criteria).populateAll();
            resolve(Record);
        });
    },

    findOne(model, criteria) {
        return new Promise(async (resolve, reject) => {
            var Record = await model.findOne(criteria).populateAll();
            if (Record) {
                resolve(Record);
            }
            resolve({});
        });
    },

    create(model, initialValues) {
        return new Promise(async (resolve) => {
            var Record = await model.create(initialValues).fetch();
            if (Record) {
                resolve(Record);
            }
            resolve({});
        });
    },

    destroy(model, criteria) {
        return new Promise(async (resolve, reject) => {
            var Record = await model.destroy(criteria).fetch();
            if (Record) {
                resolve(Record);
            }
            resolve({});
        });
    },

    destroyOne(model, criteria) {
        return new Promise(async (resolve, reject) => {
            var Record = await model.destroyOne(criteria).fetch();
            if (Record) {
                resolve(Record);
            }
            resolve({});
        });
    },

    update(model, criteria, valuesToSet) {
        return new Promise(async (resolve) => {
            var Record = await model.update(criteria).set(valuesToSet).fetch();
            if (Record) {
                resolve(Record);
            }
            resolve({});
        });
    },

    count(model, criteria) {
        return new Promise(async (resolve, reject) => {
            var Record = await model.count(criteria);
            if (Record) {
                resolve(Record);
            }
            resolve({});
        });
    },

    objectAndArray(value) {
        return new Promise((resolve, reject) => {
            Object.keys(value).forEach(element => {
                var type = typeof value[element];
                if (type === 'object') {
                    if (Array.isArray(value[element])) {
                        var array = [];
                        value[element].forEach(async (arr) => {
                            if (arr.id !== undefined) {
                                var model = require("../../models/" + element);
                                this.update(model, { id: arr.id }, arr).then(res => {
                                    array.push(res.id);
                                });
                            } else {
                                console.log("../../models/" + element);
                                var model = require("../../models/" + element);
                                var Record = await model.create(arr).fetch();
                                if (Record) {
                                    array.push(Record.id);
                                }
                            }
                        });
                        //value[element] = array;
                        resolve();
                    } else {
                        if (value[element] !== null) {
                            if (value[element].id !== undefined) {
                                var model = require("../../models/" + element);
                                console.log(element, model.attributes);
                                console.log(value[element]);

                                /*this.update(model, { id: value[element].id }, value[element]).then(res => {
                                    value[element] = res.id;
                                });*/
                            } else {
                                var model = require("../../models/" + element);
                                console.log(element, model.attributes);
                                console.log(value[element]);
                                /*this.create(model, value[element]).then(res => {
                                    value[element] = res.id;
                                });*/
                            }
                            resolve();
                        }
                    }
                } else {
                    resolve();
                }
            });
        });
    }

}