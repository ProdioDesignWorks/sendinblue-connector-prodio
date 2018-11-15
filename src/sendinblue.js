export default class SendInBlue {
  constructor(config) {
    this.config = config;
  }

  sendEmail(){
  	return 'This is sendinblue send email';
  }

  sendSMS(){
  	return 'This is sendinblue send sms';
  }

  createTemplate(){
  	return 'This is sendinblue create template';
  }
}