const fs = require('fs');

class ModelCreate {

    static attributes = {};
    static name = "";

    static convert(data, name) {
        this.name = name;
        return new Promise((resolve, reject) => {
            var count = 0;
            new Promise.all(new Promise((resolve, reject) => {
                Object.keys(data).forEach((element, index) => {
                    var type = typeof data[element];
                    if (type === 'object') {
                        if (Array.isArray(data[element])) {
                            type = 'collection';
                            this.findModel(element);
                        } else {
                            type = 'model'
                            this.findModel(element);
                        }
                    }
                    this.attributes[element] = { type: type }
                });
            }), new Promise((resolve, reject) => {
                this.create().then(() => {
                    resolve();
                });
            }));
        });
    }

    static create() {
        return new Promise((resolve, reject) => {
            fs.readFile('api/template/model.js', 'utf8', (err, data) => {
                var fileName = this.capitalizeFirstLetter(this.name);
                data = data.replace('$modelName', fileName);
                data = data.replace('$attr', this.serverAttributes(this.attributes));
                fs.writeFile('api/models/' + fileName + ".js", data, function (err, data) {
                    fs.readFile('api/template/controller.js', 'utf8', (err, controllerData) => {
                        controllerData = controllerData.replace('$modelName', fileName).replace('$modelName', fileName).replace('$modelName', fileName);
                        fs.writeFile('api/controllers/api/' + fileName + "Controller.js", controllerData, function (err, data) {
                            resolve();
                        });
                    });
                });
            });
        });
    }

    static serverAttributes(data) {
        var attributes = "";
        Object.keys(data).forEach(async (element) => {
            if (data[element].type === 'collection') {
                attributes += element + ":" + "{collection : '" +  this.capitalizeFirstLetter(element.trim()) + "'},"
            } else if (data[element].type === 'model') {
                attributes += element + ":" + "{model : '" + this.capitalizeFirstLetter(element.trim())  + "'},"
            } else {
                attributes += element + ":" + "{type : '" + data[element].type.trim() + "'},"
            }
        });
        return attributes;
    }

    static capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    static findModel(model) {
        return new Promise((resolve, reject) => {
            var fileName = this.capitalizeFirstLetter(model).trim();
            fs.exists('models/' + fileName + '.js', (e) => {
                if (!e) {
                    fs.readFile('api/template/model.js', 'utf8', (err, data) => {
                        data = data.replace('$modelName', fileName);
                        data = data.replace('$attr', this.serverAttributes({}));
                        fs.writeFile('api/models/' + fileName + ".js", data, function (err, data) {
                            fs.readFile('api/template/controller.js', 'utf8', (err, controllerData) => {
                                controllerData = controllerData.replace('$modelName', fileName).replace('$modelName', fileName).replace('$modelName', fileName);
                                fs.writeFile('api/controllers/api/' + fileName + "Controller.js", controllerData, function (err, data) {
                                    resolve();
                                });
                            });
                        });
                    });
                }
            });
        });
    }

}

module.exports = ModelCreate;