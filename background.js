const blockRules = [
  {
    id: 1,
    priority: 1,
    action: { type: "redirect", redirect: { extensionPath: "/blocked.html" } },
    condition: { urlFilter: "||facebook.com", resourceTypes: ["main_frame"] }
  },
  {
    id: 2,
    priority: 1,
    action: { type: "redirect", redirect: { extensionPath: "/blocked.html" } },
    condition: { urlFilter: "||instagram.com", resourceTypes: ["main_frame"] }
  },
  {
    id: 3,
    priority: 1,
    action: { type: "redirect", redirect: { extensionPath: "/blocked.html" } },
    condition: { urlFilter: "||tiktok.com", resourceTypes: ["main_frame"] }
  },
  {
    id: 4,
    priority: 1,
    action: { type: "redirect", redirect: { extensionPath: "/blocked.html" } },
    condition: { urlFilter: "||netflix.com", resourceTypes: ["main_frame"] }
  },
  {
    id: 5,
    priority: 1,
    action: { type: "redirect", redirect: { extensionPath: "/blocked.html" } },
    condition: { urlFilter: "||amazon.com", resourceTypes: ["main_frame"] }
  }
  // Add more domains as needed
];

// Enable blocking by adding rules
async function addRules() {
  try {
    await chrome.declarativeNetRequest.updateDynamicRules({
      addRules: blockRules,
      removeRuleIds: blockRules.map(r => r.id),
    });
    chrome.action.setTitle({ title: "Blocking Active" });
    console.log("🔒 Blocking enabled");
  } catch (err) {
    console.error("❌ Error adding rules:", err);
  }
}

// Disable blocking by removing rules
async function removeRules() {
  try {
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: blockRules.map(r => r.id),
    });
    chrome.action.setTitle({ title: "Blocking Disabled" });
    console.log("🔓 Blocking disabled");
  } catch (err) {
    console.error("❌ Error removing rules:", err);
  }
}

// Enable blocking and schedule disabling using alarms
function enableBlockingForMinutes(minutes) {
  addRules();

  // Clear any existing alarm first
  chrome.alarms.clear("disableBlocking", () => {
    // Create new alarm
    chrome.alarms.create("disableBlocking", {
      delayInMinutes: minutes
    });
    console.log(`⏰ Alarm set to disable blocking in ${minutes} minute(s)`);
  });
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "startBlocking" && typeof message.minutes === "number") {
    console.log(`📩 Received request to block for ${message.minutes} minute(s)`);
    enableBlockingForMinutes(message.minutes);
    sendResponse({ success: true });
  } else {
    sendResponse({ success: false });
  }
  return true;
});

// Handle alarm when time is up
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "disableBlocking") {
    console.log("🔔 Alarm fired: disabling blocking");
    removeRules();
  }
});
