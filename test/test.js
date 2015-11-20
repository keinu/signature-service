var chai = require("chai");
	chai.config.includeStack = true;

var chaiAsPromised = require("chai-as-promised");
	chai.use(chaiAsPromised);

var should = chai.should(),
	expect = chai.expect,
	tk = require('timekeeper'),
	URI = require('urijs');

var accessKeyId = "TEST_ACCESS_KEY_ID";
var secretAccessKey = "TEST_SECRET_ACCESS_KEY";
var region = "eu-west-1";

var signature;

describe("SignatureService", function() {

    describe("Service invokation", function() {

    	var signature = require('../index.js');

        it("Inokation with region option should be ok", function() {
			signature({region: region}).should.eventually.be.fulfilled;
		});

        it("Inokation without options should not be ok", function() {
			signature().should.eventually.be.rejected;
		});

        it("Inokation with options should not be ok", function() {

			var sig = signature({
	        	accessKeyId: accessKeyId,
	        	secretAccessKey: secretAccessKey,
	        	region: region
	        });
	        sig.should.eventually.be.fulfilled;
	        sig.should.eventually.have.property("getUploadParameters");
	        sig.should.eventually.have.property("getDownloadUrl");

		});

    });

    describe("Upload parameter getter", function() {

		before(function(done) {

			tk.freeze("2015-11-20T01:08:04.383Z");
	        var signature = require('../index.js');
	        signature({
	        	accessKeyId: accessKeyId,
	        	secretAccessKey: secretAccessKey,
	        	region: region
	        }).then(function(notary) {

				params = notary.getUploadParameters({
					expires: 15,
					bucket: "dvolvr-source",
					directory: "EJeMEUbQe"
				});

	        });

	        done();

		});

		it("should return the correct date", function() {
			expect(params.date).to.equal("20151120T010804Z");
		});

		it("should return the proper directory prefix", function() {
			expect(params.prefix).to.equal("EJeMEUbQe/");
		});

		it("should return the proper algorithm", function() {
			expect(params.algorithm).to.equal("AWS4-HMAC-SHA256");
		});

		it("should return the proper credential", function() {
			expect(params.credential).to.equal("TEST_ACCESS_KEY_ID/20151120/eu-west-1/s3/aws4_request");
		});

		it("should return the proper base64 policy", function() {
			expect(params.policy).to.equal("eyJleHBpcmF0aW9uIjoiMjAxNS0xMS0yMFQwMToyMzowNC4zODNaIiwiY29uZGl0aW9ucyI6W3siYWNsIjoiYXV0aGVudGljYXRlZC1yZWFkIn0seyJidWNrZXQiOiJkdm9sdnItc291cmNlIn0sWyJzdGFydHMtd2l0aCIsIiRrZXkiLCJFSmVNRVViUWUvIl0seyJzdWNjZXNzX2FjdGlvbl9zdGF0dXMiOiIyMDEifSx7IngtYW16LWNyZWRlbnRpYWwiOiJURVNUX0FDQ0VTU19LRVlfSUQvMjAxNTExMjAvZXUtd2VzdC0xL3MzL2F3czRfcmVxdWVzdCJ9LHsieC1hbXotYWxnb3JpdGhtIjoiQVdTNC1ITUFDLVNIQTI1NiJ9LHsieC1hbXotZGF0ZSI6IjIwMTUxMTIwVDAxMDgwNFoifV19");
		});

		it("should return the proper signature", function() {
			expect(params.signature).to.equal("d1bf4ccb0244c0bb936ef012a589c24ff6844689ba4f92d2cde8c8f2ebb5bd26");
		});

	});

    describe("Download Url getter", function() {

    	before(function(done) {

    		tk.freeze("2015-11-20T03:33:01.000Z");

			var signature = require('../index.js');

			signature({
	        	accessKeyId: accessKeyId,
	        	secretAccessKey: secretAccessKey,
	        	region: region
	        }).then(function(notary) {

				var url = notary.getDownloadUrl({
					expires: 15,
					bucket: "dvolvr-source",
					document: "4yGhB8-ml%2Fimage8.jpg"
				});

				uri = URI(url);

			});

	        done();

    	});

		it("Should return the correct file name", function() {
			expect(uri.filename()).to.equal("image8.jpg");
		});

		it("Should return the correct directory", function() {
			expect(uri.directory()).to.equal("/4yGhB8-ml");
		});

		it("Should return the correct algorith", function() {
			expect(uri.hasQuery("X-Amz-Algorithm", "AWS4-HMAC-SHA256")).to.be.true;
		});

		it("Should return correct credentila", function() {
			expect(uri.hasQuery("X-Amz-Credential", "TEST_ACCESS_KEY_ID/20151120/eu-west-1/s3/aws4_request")).to.be.true;
		});

		it("Should return correct Date", function() {
			expect(uri.hasQuery("X-Amz-Date", "20151120T033301Z")).to.be.true;
		});

		it("Should return correct Expires", function() {
			expect(uri.hasQuery("X-Amz-Expires", "900")).to.be.true;
		});

		it("Should return correct ANZ Headers", function() {
			expect(uri.hasQuery("X-Amz-SignedHeaders", "host")).to.be.true;
		});

		it("Should return correct ANZ Signature", function() {
			expect(uri.hasQuery("X-Amz-Signature", "24a42c02dc7ecee08d8d637e92ff716c1328285cbbf7ec9b157f845b4dc37758")).to.be.true;
		});

	});

});
