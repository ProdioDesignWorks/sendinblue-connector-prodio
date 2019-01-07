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
var generateContactString = function generateContactString(contacts) {
  var teamString = 'EMAIL';
  var teamContacts = contacts.map(function (email) {
    return '\n' + email;
  });
  teamString += teamContacts.join("");
  return { userList: teamString };
};
var isNullValue = function isNullValue(val) {
  if (typeof val === 'string') {
    val = val.trim();
  }
  if (val === undefined || val === null || typeof val === 'undefined' || val === '' || val === 'undefined') {
    return true;
  }
  return false;
};
var api_key_email = void 0,
    senderEmail = void 0;

var SendInBlue = function () {
  function SendInBlue(config) {
    _classCallCheck(this, SendInBlue);

    this.config = config;
    apiKey.apiKey = this.config.api_key;
    api_key_email = this.config.api_key_email;
    senderEmail = this.config.api_sender_email;
  }

  _createClass(SendInBlue, [{
    key: 'sendEmail',
    value: function sendEmail(emailPayload) {
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
            var listData = generateContactString(emailPayload.sendTo);
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
              emailCampaigns['sender'] = {
                name: !isNullValue(emailPayload.campaignSenderName) ? emailPayload.campaignSenderName : api_key_email,
                email: !isNullValue(emailPayload.campaignSenderEmail) ? emailPayload.campaignSenderEmail : api_key_email
              };
              emailCampaigns['recipients'] = { listIds: requestContactImport['listIds'] };
              if (isNullValue(emailPayload.campaignSenderEmail)) {
                console.log('emailPayload not found');
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
              } else {
                console.log('emailPayload found');
                var senderApiInstance = new SibApiV3Sdk.SendersApi();
                var opts = {
                  'sender': {
                    'name': emailPayload.campaignSenderName,
                    'email': emailPayload.campaignSenderEmail
                  }
                };
                senderApiInstance.createSender(opts).then(function (data) {
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
              }
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
    }
  }, {
    key: 'sendTransactionalEmail',
    value: function sendTransactionalEmail(emailPayload) {
      return new Promise(function (resolve, reject) {
        var apiInstance = new SibApiV3Sdk.SMTPApi();
        var sendSmtpEmail = {};
        sendSmtpEmail['sender'] = {
          name: !isNullValue(emailPayload.campaignSenderEmail) ? emailPayload.campaignSenderEmail : senderEmail,
          email: !isNullValue(emailPayload.campaignSenderEmail) ? emailPayload.campaignSenderEmail : senderEmail
        };
        sendSmtpEmail['to'] = [{ email: emailPayload.sendTo }];
        sendSmtpEmail['htmlContent'] = emailPayload.campaignHtml;
        sendSmtpEmail['subject'] = emailPayload.campaignSubject;
        if (typeof emailPayload.campaignReplyTo !== "undefined" && emailPayload.campaignReplyTo !== null) {
          sendSmtpEmail['replyTo'] = emailPayload.campaignReplyTo;
        }
        apiInstance.sendTransacEmail(sendSmtpEmail).then(function (data) {
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
      });
    }
  }]);

  return SendInBlue;
}();

exports.default = SendInBlue;