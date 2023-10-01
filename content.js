var recorder = null;
var recordedChunks = [];

// Create a div element for displaying messages
const messageDiv = document.createElement("div");
messageDiv.style.position = "fixed";
messageDiv.style.bottom = "5%";
messageDiv.style.left = "47%";
messageDiv.style.transform = "translate(-50%, -50%)";
messageDiv.style.background = "rgba(0, 0, 0, 0.8)";
messageDiv.style.color = "white";
messageDiv.style.padding = "20px";
messageDiv.style.borderRadius = "20px";
messageDiv.style.display = "none";

document.body.appendChild(messageDiv);

function showMessage(message) {
  messageDiv.innerText = message;
  messageDiv.style.display = "block";
}

function hideMessage() {
  messageDiv.style.display = "none";
}

function sendRecordedBlobToServer(blob) {
  // Replace with the URL of your server endpoint
  const endpointURL = "https://chrome-extension-2njn.onrender.com/videoupload/";

  const title = "New video";

  const xhr = new XMLHttpRequest();
  xhr.open("POST", endpointURL, true);

  // Define a callback function to handle the response
  xhr.onload = function () {
    if (xhr.status === 200) {
      const data = JSON.parse(xhr.responseText);
      showMessage(
        "Video successfully uploaded to the server. Response: " +
        JSON.stringify(data)
      );
    } else {
      showMessage(
        "Failed to upload video. Server returned status: " + xhr.status
      );
    }

    // Hide the message after a brief delay (e.g., 3 seconds)
    setTimeout(hideMessage, 3000);
  };

  //xhr.onerror = function () {
  //showMessage("Error while uploading video.");

  // Hide the message after a brief delay (e.g., 3 seconds)
  //setTimeout(hideMessage, 3000);
  //};

  const formData = new FormData();
  formData.append("title", title);
  formData.append("video_file", blob, "recorded-video.webm");

  xhr.send(formData);
}

function onAccessApproved(stream) {
  recorder = new MediaRecorder(stream);

  recorder.start();

  recorder.ondataavailable = function (event) {
    recordedChunks.push(event.data);
  };

  recorder.onstop = function () {
    stream.getTracks().forEach(function (track) {
      if (track.readyState === "live") {
        track.stop();
      }
    });

    // Combine the recorded chunks into a single Blob
    const recordedBlob = new Blob(recordedChunks, { type: "video/webm" });

    // Show a message while uploading
    showMessage("Uploading video...");

    // Send the Blob to your server
    sendRecordedBlobToServer(recordedBlob);

    // Redirect to the desired URL after stopping recording
    window.location.href = "https://helpmeout.vercel.app/ready";
  };
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "request_recording") {
    sendResponse(`processed: ${message.action}`);

    navigator.mediaDevices
      .getDisplayMedia({
        audio: true,
        video: {
          width: 9999999999,
          height: 9999999999,
        },
      })
      .then((stream) => {
        onAccessApproved(stream);
        showMessage("Recording started");
        setTimeout(hideMessage, 3000);
      });
  }

  if (message.action === "stopvideo") {
    showMessage("Stopping video");
    sendResponse(`processed: ${message.action}`);
    if (!recorder) {
      showMessage("No recorder");
      return;
    }

    recorder.stop();
  }
});
