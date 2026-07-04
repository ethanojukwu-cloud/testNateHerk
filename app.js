const WEBHOOK_URL = "http://localhost:5678/webhook/simple-test";

const pingButton = document.getElementById("pingButton");
const pingButtonLabel = document.getElementById("pingButtonLabel");
const traceDot = document.getElementById("traceDot");
const spikeMark = document.getElementById("spikeMark");
const fieldMessage = document.getElementById("fieldMessage");
const fieldTimestamp = document.getElementById("fieldTimestamp");
const statusDot = document.getElementById("statusDot");
const statusText = document.getElementById("statusText");

let pinging = false;

function resetTrace() {
  traceDot.classList.remove("is-traveling", "arrived", "spike-fail");
  traceDot.style.opacity = "0";
  spikeMark.classList.remove("active", "spike-fail");
}

function showSpike(ok) {
  traceDot.classList.remove("is-traveling");
  traceDot.classList.add("arrived");
  if (!ok) traceDot.classList.add("spike-fail");

  // let the dot finish sliding to the right edge before it blips
  window.setTimeout(() => {
    spikeMark.classList.add("active");
    if (!ok) spikeMark.classList.add("spike-fail");
  }, 220);

  window.setTimeout(() => {
    spikeMark.classList.remove("active");
  }, 620);

  window.setTimeout(resetTrace, 1000);
}

function setStatus(ok, label) {
  statusDot.classList.remove("ok", "fail");
  statusDot.classList.add(ok ? "ok" : "fail");
  statusText.textContent = label;
}

async function sendPing() {
  if (pinging) return;
  pinging = true;

  pingButton.disabled = true;
  pingButtonLabel.textContent = "Listening…";
  traceDot.classList.add("is-traveling");
  traceDot.style.opacity = "1";

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      throw new Error(`Workflow responded with status ${response.status}`);
    }

    const payload = await response.json();

    fieldMessage.textContent = payload.message ?? "—";
    fieldTimestamp.textContent = payload.timestamp ?? "—";

    if (payload.success) {
      setStatus(true, "Received");
      showSpike(true);
    } else {
      setStatus(false, "Workflow reported failure");
      showSpike(false);
    }
  } catch (error) {
    fieldMessage.textContent =
      "Couldn't reach the workflow — check that n8n is running at localhost:5678.";
    fieldTimestamp.textContent = new Date().toISOString();
    setStatus(false, "No response");
    showSpike(false);
  } finally {
    pingButton.disabled = false;
    pingButtonLabel.textContent = "Send another ping";
    pinging = false;
  }
}

pingButton.addEventListener("click", sendPing);
