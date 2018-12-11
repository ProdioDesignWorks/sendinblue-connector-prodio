var SibApiV3Sdk = require('sib-api-v3-sdk');

var defaultClient = SibApiV3Sdk.ApiClient.instance;

// Configure API key authorization: api-key
var apiKey = defaultClient.authentications['api-key'];
const generateContactString = (contacts) => {
  var teamString = 'EMAIL';
  var teamContacts = contacts.map((user) => {
    return '\n' + user.email;
  });
  teamString += teamContacts.join("");
  return { userList: teamString };
}
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
          let contacts = [{
            "email": emailPayload.sendTo
          }];
          let listData = generateContactString(contacts);
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
            emailCampaigns['sender'] = { name: api_key_email, email: api_key_email };
            emailCampaigns['recipients'] = { listIds: requestContactImport['listIds'] };
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
      sendSmtpEmail['sender'] = { name: senderEmail, email: senderEmail };
      sendSmtpEmail['to'] = [{ email: emailPayload.sendTo }];
      sendSmtpEmail['htmlContent'] = emailPayload.campaignHtml;
      sendSmtpEmail['subject'] = emailPayload.campaignSubject;
      if (typeof (emailPayload.campaignReplyTo) !== "undefined" && emailPayload.campaignReplyTo !== null) {
        sendSmtpEmail['replyTo'] = emailPayload.campaignReplyTo;
      }
      console.log(sendSmtpEmail);
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