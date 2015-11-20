var moment = require("moment"),
	CryptoJS = require("crypto-js");

module.exports = function(options) {

	var algorithm = "AWS4-HMAC-SHA256";

	var getSignatureKey = function(key, dateStamp, regionName, serviceName) {

		var kDate = CryptoJS.HmacSHA256(dateStamp, "AWS4" + key);
		var kRegion = CryptoJS.HmacSHA256(regionName, kDate);
		var kService = CryptoJS.HmacSHA256(serviceName, kRegion);
		var kSigning = CryptoJS.HmacSHA256("aws4_request", kService);

		return kSigning;

	};

	var getUploadParameters = function(params) {

		if (!params) {
			params = {};
		}

		params = {
			expires: params.expires ? params.expires : 15,
			bucket: params.bucket ? params.bucket : "",
			prefix: params.directory ? params.directory + "/" : "",
		};

		// Set to current date and time in stone
		var now = new Date();

		var date = moment(now).utc().format("YYYYMMDD");
		var longDate = moment(now).utc().format("YYYYMMDDTHHmmss") + "Z";
		var credential = options.accessKeyId + "/" + date + "/" + options.region + "/s3/aws4_request";

		var s3Policy = {
			"expiration": moment(now).utc().add(params.expires, "minutes").toISOString(),
			"conditions": [
				{"acl": "authenticated-read" },
				{"bucket": params.bucket },
				["starts-with", "$key", params.prefix],
				{"success_action_status": "201"},
				{"x-amz-credential": credential},
				{"x-amz-algorithm": algorithm},
				{"x-amz-date": longDate}
			]
		};

		var base64Policy = new Buffer(JSON.stringify(s3Policy), "utf-8").toString("base64");

		var signatureKey = getSignatureKey(options.secretAccessKey, date, options.region, "s3");

		var signature = CryptoJS.HmacSHA256(base64Policy, signatureKey).toString(CryptoJS.enc.Hex);

		var result = {
			policy: base64Policy,
			signature: signature,
			algorithm: algorithm,
			credential: credential,
			date: longDate,
			prefix: params.prefix
		};

		return result;

	};

	var getDownloadUrl = function(params) {

		var now = new Date();

		var document = "/" + params.document.replace(/\%2F/g, "/");

		var expiration = (60 * params.expires); // 15 minutes

		var date = moment(now).utc().format("YYYYMMDD"); //"20151101";

		var longDate = moment(now).utc().format("YYYYMMDDTHHmmss") + "Z"; //"20151101";

		var scope = date + "/" + options.region + "/s3/aws4_request";

		var credential = options.accessKeyId + "/" + scope;

		var host = params.bucket + ".s3.amazonaws.com";

		var canonicalRequest = 	"GET\n" +
			// Canonical URI
			document + "\n" +
			// Canonical Querysting
			encodeURIComponent("X-Amz-Algorithm") + "=" + encodeURIComponent(algorithm) + "&" +
			encodeURIComponent("X-Amz-Credential") + "=" + encodeURIComponent(credential) + "&" +
			encodeURIComponent("X-Amz-Date") + "=" + encodeURIComponent(longDate) + "&" +
			encodeURIComponent("X-Amz-Expires") + "=" + encodeURIComponent(expiration) + "&" +
			encodeURIComponent("X-Amz-SignedHeaders") + "=host" + "\n" +
			// Canonical Headers
			"host:" + host + "\n\n" +
			// Signed Headers
			"host\n" +
			"UNSIGNED-PAYLOAD";

		var stringToSign = algorithm + "\n" + longDate + "\n" + scope + "\n" +
			CryptoJS.SHA256(canonicalRequest).toString(CryptoJS.enc.Hex);

		var signatureKey = getSignatureKey(options.secretAccessKey, date, options.region, "s3");
		var signature = CryptoJS.HmacSHA256(stringToSign, signatureKey).toString(CryptoJS.enc.Hex);

		return "https://" + host + document +
			"?X-Amz-Algorithm=" + algorithm +
			"&X-Amz-Credential=" + credential +
			"&X-Amz-Date=" + longDate +
			"&X-Amz-Expires=" + expiration +
			"&X-Amz-SignedHeaders=host" +
			"&X-Amz-Signature=" + signature;
	};

	return {
		getUploadParameters: getUploadParameters,
		getDownloadUrl: getDownloadUrl
	};

};