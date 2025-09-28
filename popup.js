document.addEventListener("DOMContentLoaded", () => {
  const startBtn = document.getElementById('startBtn');
  const minutesInput = document.getElementById('minutes');
  const statusText = document.getElementById('status');

  startBtn.addEventListener('click', () => {
    const minutes = parseInt(minutesInput.value);

    if (isNaN(minutes) || minutes < 1) {
      statusText.textContent = "❗ Please enter a valid number.";
      return;
    }

    chrome.runtime.sendMessage({ action: "startBlocking", minutes }, response => {
      if (response && response.success) {
        statusText.textContent = `✅ Blocking for ${minutes} min.`;
      } else {
        statusText.textContent = "❌ Failed to start blocking.";
      }
    });
  });
});


