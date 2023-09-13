const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

exports.sendRawEmail = async (email, subject, body) => {
  const msg = {
    to: email, // Change to your recipient
    from: "contact@ttptracker.com", // Change to your verified sender
    subject: subject,
    text: body,
  };

  try {
    await sgMail.send(msg);
  } catch (error) {
    console.log(error.message);
  }
};

exports.sendTemplateEmail = async (email, templateId, dynamicTemplateData) => {
  const msg = {
    to: email, // Change to your recipient
    from: "contact@ttptracker.com", // Change to your verified sender
    template_id: templateId,
    dynamicTemplateData,
  };

  try {
    await sgMail.send(msg);
  } catch (error) {
    console.log(error.message);
  }
};

exports.sendHTMLEmail = async (email, subject, body) => {
  const msg = {
    to: email, // Change to your recipient
    from: "contact@ttptracker.com", // Change to your verified sender
    subject: subject,
    html: body,
  };

  try {
    await sgMail.send(msg);
  } catch (error) {
    console.log(error.message);
  }
};
