'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var SibApiV3Sdk = require('sib-api-v3-sdk');

var defaultClient = SibApiV3Sdk.ApiClient.instance;

// Configure API key authorization: api-key
var apiKey = defaultClient.authentications['api-key'];
// Uncomment the following line to set a prefix for the API key, e.g. "Token" (defaults to null)
//apiKey.apiKeyPrefix['api-key'] = "Token"
var generateContactString = function generateContactString(contacts) {
  var teamString = 'EMAIL';
  var teamContacts = contacts.map(function (user) {
    return '\n' + user.email;
  });
  teamString += teamContacts.join("");
  return { userList: teamString };
};
var api_key_email = void 0;

var SendInBlue = function () {
  function SendInBlue(config) {
    _classCallCheck(this, SendInBlue);

    this.config = config;
    apiKey.apiKey = this.config.api_key;
    api_key_email = this.config.api_key_email;
  }

  _createClass(SendInBlue, [{
    key: 'sendEmail',
    value: function sendEmail(emailPayload) {
      var api = new SibApiV3Sdk.AccountApi();
      return new Promise(function (resolve, reject) {
        var contactsApiInstance = new SibApiV3Sdk.ContactsApi();
        var createFolder = {
          "name": emailPayload.folderName
        };
        contactsApiInstance.createFolder(createFolder).then(function (data) {
          var createList = {
            "name": emailPayload.listName,
            "folderId": data.id
          };
          contactsApiInstance.createList(createList).then(function (data) {
            var listArr = [];
            listArr.push(data.id);
            var contacts = [{
              "email": emailPayload.sendTo
            }];
            var listData = generateContactString(contacts);
            var requestContactImport = {
              "listIds": listArr,
              "fileBody": listData["userList"]
            };
            contactsApiInstance.importContacts(requestContactImport).then(function (data) {
              var emailApiInstance = new SibApiV3Sdk.EmailCampaignsApi();
              var emailCampaigns = {
                name: emailPayload.campaignName,
                subject: emailPayload.campaignSubject,
                type: 'classic',
                mirrorActive: 'true'
              };
              if (typeof emailPayload.campaignReplyTo !== "undefined" && emailPayload.campaignReplyTo !== null) {
                emailCampaigns.replyTo = emailPayload.campaignReplyTo;
              }
              var t = new Date();
              t.setSeconds(t.getSeconds() + 30);
              emailCampaigns['scheduledAt'] = t;
              emailCampaigns['htmlContent'] = emailPayload.campaignHtml;
              emailCampaigns['sender'] = { name: api_key_email, email: api_key_email };
              emailCampaigns['recipients'] = { listIds: requestContactImport['listIds'] };
              emailApiInstance.createEmailCampaign(emailCampaigns).then(function (data) {
                resolve({
                  "success": true,
                  "body": data
                });
              }, function (error) {
                var errorMsg = JSON.parse(error.response.text);
                reject({
                  "success": false,
                  "message": errorMsg.message
                });
              });
            }, function (error) {
              var errorMsg = JSON.parse(error.response.text);
              reject({
                "success": false,
                "message": errorMsg.message
              });
            });
          }, function (error) {
            var errorMsg = JSON.parse(error.response.text);
            reject({
              "success": false,
              "message": errorMsg.message
            });
          });
        }, function (error) {
          var errorMsg = JSON.parse(error.response.text);
          reject({
            "success": false,
            "message": errorMsg.message
          });
        });
      });
      //return 'This is sendinblue send email';
    }
  }, {
    key: 'sendSMS',
    value: function sendSMS() {
      return 'This is sendinblue send sms';
    }
  }, {
    key: 'createTemplate',
    value: function createTemplate() {
      return 'This is sendinblue create template';
    }
  }]);

  return SendInBlue;
}();

exports.default = SendInBlue;