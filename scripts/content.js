console.warn("🟡 WhatsBlitz content script is running!");

chrome.runtime.onMessage.addListener(async (request) => {
  if (request.type !== "WHATSBLITZ_CONTACTS") return;

  const contacts = request.contacts;
  console.log("📨 Contacts received:", contacts);

  for (const { Name, Message } of contacts) {
    const personalized = Message.replace(/\{\{name\}\}/gi, Name);
    const success = await sendMessage(Name, personalized);

    if (success) {
      console.log(`✅ Sent to ${Name}`);
    } else {
      console.warn(`❌ Failed for ${Name}`);
    }

    await wait(getRandomDelay(3000, 6000));
  }

  console.log("🎉 Messaging completed!");
});

async function sendMessage(name, message) {
  try {
    const focusBreaker = document.querySelector('header');
    if (focusBreaker) {
      focusBreaker.click();
      await wait(300);
    }

    const searchInput = document.querySelector('div[contenteditable="true"][data-tab]');
    if (!searchInput) throw new Error("Search box not found");

    searchInput.focus();
    await wait(300);
    document.execCommand('selectAll', false, null);
    document.execCommand('delete', false, null);
    await wait(300);

    for (let char of name) {
      searchInput.focus();
      document.execCommand('insertText', false, char);
      await wait(100);
    }

    searchInput.focus();
    await wait(400);
    searchInput.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'Enter',
      code: 'Enter',
      keyCode: 13,
      which: 13,
      bubbles: true,
      cancelable: true
    }));

    console.log(`📨 Opening chat with: ${name}`);
    await wait(2000);

    const messageBox = await waitForChatBox();

    messageBox.focus();
    document.execCommand('selectAll', false, null);
    document.execCommand('delete', false, null);
    await wait(300);

    for (let char of message) {
      messageBox.focus();
      document.execCommand('insertText', false, char);
      await wait(50);
    }

    messageBox.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'Enter',
      code: 'Enter',
      keyCode: 13,
      which: 13,
      bubbles: true,
      cancelable: true
    }));

    await wait(1500);

    const searchAgain = document.querySelector('div[contenteditable="true"][data-tab]');
    if (searchAgain) {
      searchAgain.focus();
      await wait(300);
      document.execCommand('selectAll', false, null);
      document.execCommand('delete', false, null);
      console.log("🔍 Search bar cleared");
    }

    return true;
  } catch (err) {
    console.error("⚠️ Error in sending message:", err);
    return false;
  }
}

async function waitForChatBox(timeout = 5000) {
  const pollInterval = 100;
  let elapsed = 0;

  while (elapsed < timeout) {
    const boxes = [...document.querySelectorAll('div[contenteditable="true"][role="textbox"]')];
    const chatBox = boxes.find(
      el => el.innerText === '' || el.getAttribute('data-tab') === '10'
    );
    if (chatBox) return chatBox;
    await wait(pollInterval);
    elapsed += pollInterval;
  }

  throw new Error("❌ Message box not found after waiting.");
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getRandomDelay(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
