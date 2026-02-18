const shortenBtn = document.querySelector(".shorten-btn");
const UrlInput = document.querySelector("#longurl");
const alerts = document.querySelector(".alert");
const clearBtn = document.querySelector(".clear-btn");
const form = document.getElementById("input-section");

if (UrlInput.value.length > 0) {
  clearBtn.style.display = "block";
}

clearBtn.addEventListener("click", () => {
  UrlInput.value = "";
});

//Post data
// form.addEventListener("submit", async (e) => {
//   e.preventDefault();
//   const formData = new FormData(form);
//   const data = {
//     longurl: formData.get("longurl"),
//     shortcode: formData.get("shortcode").replace(" ", ""),
//   };

//   try {
//     const response = await fetch("/shorten", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify(data),
//     });

//     const result = await response.json();
//     console.log(result);
//     // 👈 parse JSON

//     // ✅ Conditional alert based on status
//     if (response.ok) {
//       alert(`✅ ${result.message}\nShortCode: ${result.shortcode}`);
//       form.reset();
//       fetchLinks();
//     } else {
//       alert("❌ Something went wrong.");
//     }
//   } catch (error) {
//     console.error(error);
//     alert("❌ Server error.");
//   }
// });

shortenBtn.addEventListener("click", () => {
  if (UrlInput.value === "") {
    alerts.style.display = "block";
  } else {
    alerts.style.display = "none";
  }
});

// const fetchLinks = async () => {
//   try {
//     const res = await fetch("/shorten");
//     const links = await res.json();
//     const container = document.querySelector(".links");
//     container.innerHTML = "";
//     console.log(links.allLinks)   // here array 
//     links.allLinks.forEach((url)=>{
//       console.log(url) //
//       const div = document.createElement("div");
//       div.className = "link";

//       div.innerHTML = `
//       <p class="input-link">${
//         url.longurl.length > 30 ? url.longurl.slice(0, 30) + "......" : url.longurl
//       }</p>
//         <p class="shorten-link">
//         <a href="/redirect/${url.shortcode}" target="_blank">${
//         window.location.origin
//       }/${url.shortcode}</a> 
//           <span class="copy-btn" data-link="${
//             window.location.origin
//           }/${url.shortcode}">Copy</span>
//             <span class="remove-btn" data-link="${url.shortcode}">Remove</span>
//             </p>
//             `;
//             container.prepend(div);
//     })
    
//     // for (const [shortcode, longurl] of Object.entries(links)) {
//       // console.log(_id.toString("hex"))


//     // }
//   } catch (error) {
//     console.log(error);
//   }

  //   //copying logic
  document.querySelectorAll(".copy-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const link = btn.getAttribute("data-link");
      navigator.clipboard.writeText(link);
      btn.textContent = "Copied!";
      setTimeout(() => (btn.textContent = "Copy"), 1500);
    });
  });

  // Delete short url code
  document.querySelectorAll(".remove-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      // //     // console.log("click");
      const shortCode = btn.getAttribute("data-link");
      //     // const shortCode = shortLink.split("/").pop();

      const confrimDelete = confirm(
        "❌Are you sure you want to delete this short URL?"
      );
      if (!confrimDelete) return;

      const res = await fetch(`/delete/${shortCode}`, {
        method: "DELETE",
      });

      if (res.ok) {
        btn.closest(".link").remove(); // remove from DOM
        fetchLinks();
      } else {
        console.error("Failed to delete:", shortCode);
      }
    });
  });
// };

// fetchLinks();
