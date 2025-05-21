console.log("WhatsBlitz content script loaded");

window.addEventListener("message", async (event) => {
  if (event.source !== window || event.data.type !== "WHATSBLITZ_CONTACTS") return;

  const contacts = event.data.contacts;
  console.log("📨 Contacts received:", contacts);

  for (let i = 0; i < contacts.length; i++) {
    const { Phone, Name, Message } = contacts[i];

    const personalizedMessage = Message.replace(/\{\{name\}\}/gi, Name);
    const success = await sendMessageToNumber(Phone, personalizedMessage);

    if (success) console.log(`Sent to ${Name} (${Phone})`);
    else console.warn(`Failed for ${Phone}`);

    const delay = getRandomDelay(5000, 15000);
    await wait(delay);
  }

  console.log("🎉 Messaging completed!");
});

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getRandomDelay(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function sendMessageToNumber(phone, message) {
  try {
    const searchBox = document.querySelector('div[contenteditable="true"][data-tab="3"]');
    if (!searchBox) throw new Error("Search box not found");
    searchBox.focus();

    document.execCommand("insertText", false, phone);
    await wait(2000); 
    const result = document.querySelector(`span[title="${phone}"]`);
    if (!result) {
      console.warn(`Phone number not found: ${phone}`);
      return false;
    }
    result.click();
    await wait(1500);
    const messageBox = document.querySelector('div[contenteditable="true"][data-tab="10"]');
    if (!messageBox) throw new Error("Message box not found");

    messageBox.focus();
    document.execCommand("insertText", false, message);
    await wait(500);

    const sendButton = document.querySelector('span[data-icon="send"]');
    if (!sendButton) throw new Error("Send button not found");

    sendButton.click();
    return true;
  } catch (error) {
    console.error("⚠️ Error in sending message:", error);
    return false;
  }
}
