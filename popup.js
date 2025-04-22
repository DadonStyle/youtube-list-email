import { API_KEY } from "./config.js";

document.getElementById("sendTabs").addEventListener("click", async () => {
  const emailInput = document.getElementById("email");
  const email = emailInput.value;

  if (!validateEmail(email)) {
    alert("Please enter a valid email address.");
    return;
  }

  const tabs = await getAllTabs();
  const tabUrls = tabs.map((tab) => tab.url);
  const formattedUrls = await getYouTubeTitles(tabUrls);
  sendEmail(email, formattedUrls.join("\n\n"));
});

function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

function getAllTabs() {
  return new Promise((resolve) => {
    chrome.tabs.query({}, (tabs) => {
      resolve(tabs);
    });
  });
}

async function getYouTubeTitles(tabUrls) {
  const youtubeLinks = tabUrls.filter((url) =>
    url.includes("youtube.com/watch")
  );
  const titles = await Promise.all(
    youtubeLinks.map(async (url) => {
      try {
        const response = await fetch(url);
        const text = await response.text();
        const titleMatch = text.match(/<title>(.*?)<\/title>/);
        return titleMatch ? `${titleMatch[1]}\n${url}` : url;
      } catch (error) {
        console.error("Error fetching YouTube title:", error);
        return url;
      }
    })
  );

  return tabUrls.map((url) => {
    const youtubeIndex = youtubeLinks.indexOf(url);
    return youtubeIndex !== -1 ? titles[youtubeIndex] : url;
  });
}

function sendEmail(email, tabUrls) {
  console.log("Sending email to:", email);
  const data = {
    service_id: "service_odwcmok",
    template_id: "template_47xayfj",
    user_id: API_KEY,
    template_params: {
      name: "UserTest",
      time: new Date().toLocaleString(),
      subject: "Tabs from Chrome Extension",
      email: email,
      message: tabUrls, // Tabs are already formatted with extra rows
    },
  };

  fetch("https://api.emailjs.com/api/v1.0/email/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })
    .then((response) => {
      if (response.ok) {
        alert("Tabs sent successfully!");
      } else {
        response.json().then((error) => {
          console.error("Error response from EmailJS:", error);
          alert("Failed to send tabs. Please check the console for details.");
        });
      }
    })
    .catch((error) => {
      console.error("Error sending email:", error);
      alert("An error occurred while sending the email.");
    });
}
