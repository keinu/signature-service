var Promise = require("bluebird");

module.exports = function(options) {

	if (!options) {
		options = {};
	}

	if (!options.region || !options.accessKeyId || !options.secretAccessKey) {

		var AWS = require('aws-sdk'),
			AWSConfig = new Promise.promisifyAll(AWS.config);

		return AWSConfig.getCredentialsAsync().then(function() {

			if (!options.region && !AWSConfig.region) {
				throw new Error("A region must be specified");
			}

			options.region = options.region ? options.region : AWSConfig.region;

			if (!options.accessKeyId && !AWSConfig.credentials.accessKeyId) {
				throw new Error("An accessKeyId must be specified");
			}

			options.accessKeyId = options.accessKeyId ? options.accessKeyId : AWSConfig.credentials.accessKeyId;

			if (!options.secretAccessKey && !AWSConfig.credentials.secretAccessKey) {
				throw new Error("A secretAccessKey must be specified");
			}

			options.secretAccessKey = options.secretAccessKey ? options.secretAccessKey : AWSConfig.credentials.secretAccessKey;

			return require("./services/notary.js")(options);

		});

	}

	return Promise.resolve(require("./services/notary.js")(options));

};