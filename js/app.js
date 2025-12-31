console.log("app.js loaded");

/* ===================== DOM READY ===================== */
document.addEventListener("DOMContentLoaded", () => {

    const foundForm = document.getElementById("foundItemForm");
    if (foundForm) {
        foundForm.addEventListener("submit", handleFoundItemSubmit);
    }

    const lostForm = document.getElementById("lostItemForm");
    if (lostForm) {
        lostForm.addEventListener("submit", handleLostItemSubmit);
    }

    const verifyForm = document.getElementById("verifyForm");
    if (verifyForm) {
        verifyForm.addEventListener("submit", handleVerificationSubmit);
    }

    const itemsList = document.getElementById("itemsList");
    if (itemsList) {
        loadFoundItems();
    }
});

/* ===================== POST FOUND ITEM ===================== */
function handleFoundItemSubmit(e) {
    e.preventDefault();

    const formData = new FormData(e.target);

    const email = formData.get("finderContact");
    if (!email) {
        alert("❌ Email is required to post found item");
        return;
    }

    fetch("https://lost-and-found-backend-cjf6.onrender.com/found", {
        method: "POST",
        body: formData
    })
    .then(res => {
        if (!res.ok) throw new Error("Failed");
        return res.json();
    })
    .then(data => {
        if (data.lost_owner_email) {
            alert(
                "🎉 MATCH FOUND!\n\n" +
                "Contact owner at:\n" +
                data.lost_owner_email
            );
        } else {
            alert("✅ Found item posted successfully.\nNo lost report yet.");
        }
        e.target.reset();
    })
    .catch(err => {
        console.error(err);
        alert("❌ Failed to post found item");
    });
}

/* ===================== POST LOST ITEM ===================== */
function handleLostItemSubmit(e) {
    e.preventDefault();

    const lostItem = {
        category: document.getElementById("category").value,
        description: document.getElementById("description").value,
        location: document.getElementById("location").value,
        dateLost: document.getElementById("dateLost").value,
        email: document.getElementById("ownerContact").value
    };

    fetch("https://lost-and-found-backend-cjf6.onrender.com/lost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(lostItem)
    })
    .then(res => res.json())
    .then(data => {
        if (!data.saved) {
            alert("❌ Lost item not saved");
            return;
        }

        if (data.matched_found_item_id) {
            document.getElementById("matchSection").style.display = "block";
            document.getElementById("foundItemId").value =
                data.matched_found_item_id;

            alert(
              "🎉 Possible match found!\n\n" +
              "Please verify ownership."
            );
        } else {
            alert(
              "✅ Lost item saved.\n\n" +
              "If someone finds it later, they will contact you."
            );
        }

        e.target.reset();
    })
    .catch(err => {
        console.error(err);
        alert("❌ Server error while saving lost item");
    });
}

/* ===================== VERIFICATION ===================== */
function handleVerificationSubmit(e) {
    e.preventDefault();

    const claimData = {
        foundItemId: document.getElementById("foundItemId").value,
        color: document.getElementById("color").value,
        mark: document.getElementById("mark").value,
        extra: document.getElementById("extra").value
    };

    fetch("https://lost-and-found-backend-cjf6.onrender.com/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(claimData)
    })
    .then(res => res.json())
    .then(data => {
        if (!data.approved) {
            alert("❌ Verification failed");
            return;
        }

        // ✅ SHOW VERIFIED RESULT
        const img = document.getElementById("verifiedImage");
        img.src = data.signed_url;
        img.style.display = "block";
        img.style.maxWidth = "100%";
        img.style.marginTop = "10px";

        document.getElementById("finderEmail").innerText =
            "Contact Finder: " + data.finder_email;

        document.getElementById("verifiedResult").style.display = "block";
        document.getElementById("matchSection").style.display = "none";
    })
    .catch(err => {
        console.error("Verification error:", err);
        alert("❌ Verification error");
    });
}

/* ===================== VIEW FOUND ITEMS ===================== */
function loadFoundItems() {
    const itemsList = document.getElementById("itemsList");
    itemsList.innerHTML = "";

    fetch("https://lost-and-found-backend-cjf6.onrender.com/found-with-status")
        .then(res => res.json())
        .then(items => {
            if (!items.length) {
                itemsList.innerHTML = "<p>No items found.</p>";
                return;
            }

            items.forEach(item => {
                const card = document.createElement("div");
                card.className = "item-card";

                card.innerHTML = `
                  <div class="item-details">
                    <h3>${item.category}</h3>
                    <p><strong>Date:</strong> ${item.date_found}</p>
                    <p class="muted">
                      ${
                        item.match_status === "verified"
                          ? "✅ Match verified"
                          : item.match_status === "pending"
                          ? "⚠️ Possible match reported"
                          : "No matches yet"
                      }
                    </p>
                  </div>
                `;

                itemsList.appendChild(card);
            });
        })
        .catch(err => {
            console.error(err);
            itemsList.innerHTML = "<p>Error loading items</p>";
        });
}