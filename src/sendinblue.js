var SibApiV3Sdk = require('sib-api-v3-sdk');

var defaultClient = SibApiV3Sdk.ApiClient.instance;

// Configure API key authorization: api-key
var apiKey = defaultClient.authentications['api-key'];
const generateContactString = (contacts) => {
  var teamString = 'EMAIL';
  var teamContacts = contacts.map((email) => {
    return '\n' + email;
  });
  teamString += teamContacts.join("");
  return { userList: teamString };
}
const isNullValue = (val) => {
  if (typeof val === 'string') {
    val = val.trim();
  }
  if (val === undefined || val === null || typeof val === 'undefined' || val === '' || val === 'undefined') {
    return true;
  }
  return false;
};
let api_key_email, senderEmail;

export default class SendInBlue {
  constructor(config) {
    this.config = config;
    apiKey.apiKey = this.config.api_key;
    api_key_email = this.config.api_key_email;
    senderEmail = this.config.api_sender_email;
  }

  sendEmail(emailPayload) {
    return new Promise((resolve, reject) => {
      var contactsApiInstance = new SibApiV3Sdk.ContactsApi();
      const createFolder = {
        "name": emailPayload.folderName
      }
      contactsApiInstance.createFolder(createFolder).then(function (data) {
        const createList = {
          "name": emailPayload.listName,
          "folderId": data.id
        }
        contactsApiInstance.createList(createList).then(function (data) {
          let listArr = [];
          listArr.push(data.id);
          let listData = generateContactString(emailPayload.sendTo);
          const requestContactImport = {
            "listIds": listArr,
            "fileBody": listData["userList"]
          }
          contactsApiInstance.importContacts(requestContactImport).then(function (data) {
            var emailApiInstance = new SibApiV3Sdk.EmailCampaignsApi();
            var emailCampaigns = {
              name: emailPayload.campaignName,
              subject: emailPayload.campaignSubject,
              type: 'classic',
              mirrorActive: 'true'
            };
            if (typeof (emailPayload.campaignReplyTo) !== "undefined" && emailPayload.campaignReplyTo !== null) {
              emailCampaigns.replyTo = emailPayload.campaignReplyTo
            }
            var t = new Date();
            t.setSeconds(t.getSeconds() + 30);
            emailCampaigns['scheduledAt'] = t;
            emailCampaigns['htmlContent'] = emailPayload.campaignHtml;
            if (emailPayload.campaignAttachment !== "") {
              emailCampaigns['attachmentUrl'] = emailPayload.campaignAttachment;
            }
            emailCampaigns['sender'] = {
              name: !isNullValue(emailPayload.campaignSenderName) ? emailPayload.campaignSenderName : api_key_email,
              email: !isNullValue(emailPayload.campaignSenderEmail) ? emailPayload.campaignSenderEmail : api_key_email,
            };
            emailCampaigns['recipients'] = { listIds: requestContactImport['listIds'] };
            if (isNullValue(emailPayload.campaignSenderEmail)) {
              emailApiInstance.createEmailCampaign(emailCampaigns).then(function (data) {
                resolve({
                  "success": true,
                  "body": data,
                })
              }, function (error) {
                let errorMsg = JSON.parse(error.response.text);
                reject({
                  "success": false,
                  "message": errorMsg.message
                })
              });
            } else {
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
                    "body": data,
                  })
                }, function (error) {
                  let errorMsg = JSON.parse(error.response.text);
                  reject({
                    "success": false,
                    "message": errorMsg.message
                  })
                });
              }, function (error) {
                let errorMsg = JSON.parse(error.response.text);
                reject({
                  "success": false,
                  "message": errorMsg.message
                })
              });
            }
          }, function (error) {
            let errorMsg = JSON.parse(error.response.text);
            reject({
              "success": false,
              "message": errorMsg.message
            })
          });

        }, function (error) {
          let errorMsg = JSON.parse(error.response.text);
          reject({
            "success": false,
            "message": errorMsg.message
          })
        });
      }, function (error) {
        let errorMsg = JSON.parse(error.response.text);
        reject({
          "success": false,
          "message": errorMsg.message
        })
      });
    });
  }

  sendTransactionalEmail(emailPayload) {
    return new Promise((resolve, reject) => {
      const apiInstance = new SibApiV3Sdk.SMTPApi();
      let sendSmtpEmail = {};
      sendSmtpEmail['sender'] = {
        name: !isNullValue(emailPayload.campaignSenderEmail) ? emailPayload.campaignSenderEmail : senderEmail,
        email: !isNullValue(emailPayload.campaignSenderEmail) ? emailPayload.campaignSenderEmail : senderEmail
      };
      sendSmtpEmail['to'] = [{ email: emailPayload.sendTo }];
      sendSmtpEmail['htmlContent'] = emailPayload.campaignHtml;
      sendSmtpEmail['subject'] = emailPayload.campaignSubject;
      if (emailPayload.campaignAttachment !== "") {
        sendSmtpEmail['attachment'] = [{
          'url': emailPayload.campaignAttachment
        }]
      }
      if (typeof (emailPayload.campaignReplyTo) !== "undefined" && emailPayload.campaignReplyTo !== null) {
        sendSmtpEmail['replyTo'] = emailPayload.campaignReplyTo;
      }
      apiInstance.sendTransacEmail(sendSmtpEmail).then(function (data) {
        resolve({
          "success": true,
          "body": data,
        });
      }, function (error) {
        let errorMsg = JSON.parse(error.response.text);
        reject({
          "success": false,
          "message": errorMsg.message
        })
      });
    });
  }
}