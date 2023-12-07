const firebaseConfig = {
    apiKey: "AIzaSyCGPRkxuSoUJaq2wtYuMfqeslDMA3dF7cw",
    authDomain: "w-2efa5.firebaseapp.com",
    projectId: "w-2efa5",
    storageBucket: "w-2efa5.appspot.com",
    messagingSenderId: "716692322077",
    appId: "1:716692322077:web:426ef145c126e5866d53f4",
    measurementId: "G-92EXLVV5EK"
};

firebase.initializeApp(firebaseConfig);
const firestore = firebase.firestore();
const db = firebase.firestore();
const tenantsCollection = firestore.collection('Tenants');
const tenantRequestForm = document.getElementById("tenantRequest");
const errorMsg = document.getElementById("errorDiv");
const maintenanceInfoDiv = document.getElementById("maintenanceInfo");

tenantRequestForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const tenantName = document.getElementById("tenantName").value;
    const tenantId = document.getElementById("tenantId").value;
    const apartmentId = document.getElementById("apartmentId").value;
    const problemDescription = document.getElementById("problemDescription").value;
    const optionalPhoto = document.getElementById("optionalPhoto").value;

    function areIdsMatching(tenantId, apartmentId) {
        return tenantsCollection
            .where("id", "==", tenantId)
            .where("apartment", "==", apartmentId)
            .get()
            .then((querySnapshot) => {
                return !querySnapshot.empty;
            })
            .catch((error) => {
                console.error("Error checking IDs: ", error);
                return false;
            });
    }

    areIdsMatching(tenantId, apartmentId)
        .then((isValid) => {
            if (isValid) {
                const timestamp = new Date().toLocaleString();
                db.collection("Stuff").add({
                    tenantName: tenantName,
                    tenantId: tenantId,
                    apartmentId: apartmentId,
                    problemDescription: problemDescription,
                    optionalPhoto: optionalPhoto, // Added optional photo
                    timestamp: timestamp,
                    status: "Pending" // Initial status
                })
                    .then(function (docRef) {
                        console.log("Document written with ID: ", docRef.id);
                        // Clear the form after submission
                        tenantRequestForm.reset();
                    })
                    .catch(function (error) {
                        console.error("Error adding document: ", error);
                    });
            } else {
                errorMsg.style.display = "block";
                console.log("ID and/or Apartment do not match.");
            }
        })
        .catch((error) => {
            console.error("Error checking IDs: ", error);
        });
});

function toggleStatus(maintenanceId, currentStatus) {
    const newStatus = currentStatus === "Completed" ? "Pending" : "Completed";

    db.collection("Stuff")
        .doc(maintenanceId)
        .update({ status: newStatus })
        .then(() => {
            console.log("Status updated successfully.");
        })
        .catch((error) => {
            console.error("Error updating status: ", error);
        });
}

db.collection("Stuff").onSnapshot((querySnapshot) => {
    const maintenanceData = [];
    querySnapshot.forEach((doc) => {
        maintenanceData.push(doc);
    });
    displayMaintenanceRequests(maintenanceData);
});

function displayMaintenanceRequests(data) {
    let maintenanceHTML = '<div class="maintenance-container">';
    data.forEach((doc, index) => {
        const maintenanceData = doc.data();
        const maintenanceId = doc.id;
        const requestIndex = index + 1;

        maintenanceHTML += `
            <div class="maintenance-request" id="maintenance-${maintenanceId}">
                <h3>Maintenance Request Details</h3>
                <p>Request ID: ${requestIndex}</p>
                <p>Tenant Name: ${maintenanceData.tenantName}</p>
                <p>Tenant ID: ${maintenanceData.tenantId}</p>
                <p>Apartment ID: ${maintenanceData.apartmentId}</p>
                <p>Problem Description: ${maintenanceData.problemDescription}</p>
                <p>Date and Time: ${maintenanceData.timestamp}</p>
                <p class="status">Status: ${maintenanceData.status}</p>
                <p><img src="${maintenanceData.optionalPhoto}" alt="Optional Photo" class="small-photo"></p> <!-- Display small optional photo -->
                <button id="toggle-${maintenanceId}" onclick="toggleStatus('${maintenanceId}', '${maintenanceData.status}')">Toggle Status</button>
            </div>
        `;
    });

    maintenanceHTML += '</div>';
    maintenanceInfoDiv.innerHTML = maintenanceHTML;
    maintenanceInfoDiv.innerHTML = maintenanceHTML;

    data.forEach((doc) => {
        const maintenanceId = doc.id;
        const button = document.getElementById(`toggle-${maintenanceId}`);
        const currentStatus = doc.data().status;

        button.addEventListener("click", () => {
            toggleStatus(maintenanceId, currentStatus);
        });
    });
}

const filterCompletedBtn = document.getElementById("filterCompleted");
const filterPendingBtn = document.getElementById("filterPending");

filterCompletedBtn.addEventListener("click", () => {
    filterMaintenanceRequests("Completed");
});

filterPendingBtn.addEventListener("click", () => {
    filterMaintenanceRequests("Pending");
});

function filterMaintenanceRequests(status) {
    db.collection("Stuff")
        .where("status", "==", status)
        .onSnapshot((querySnapshot) => {
            const maintenanceData = [];
            querySnapshot.forEach((doc) => {
                maintenanceData.push(doc);
            });
            displayMaintenanceRequests(maintenanceData);
        }, (error) => {
            console.error("Error filtering maintenance requests: ", error);
        });
}

function displayTenantFields(data) {
    let tenantFieldsHTML = "";

    data.forEach((doc, index) => {
        const tenantData = doc.data();
        tenantFieldsHTML += `<h4>Tenant ${index + 1}:</h4>`;
        for (const key in tenantData) {
            if (tenantData.hasOwnProperty(key)) {
                tenantFieldsHTML += `<p>${key}: ${tenantData[key]}</p>`;
            }
        }
    });

    const tenantInfoDiv = document.getElementById("tenantInfo");

    if (tenantInfoDiv) {
        tenantInfoDiv.innerHTML = tenantFieldsHTML;
    }
}

document.addEventListener("DOMContentLoaded", function () {
    db.collection("Tenants").get().then((querySnapshot) => {
        const tenantData = [];
        querySnapshot.forEach((doc) => {
            tenantData.push(doc);
        });
        displayTenantFields(tenantData);
    });
});

document.addEventListener("DOMContentLoaded", function () {
    const deleteForm = document.getElementById("Manager");
    const deleteInput = document.getElementById("deleteWithId");

    deleteForm.addEventListener("submit", function (e) {
        e.preventDefault();

        const tenantIdToDelete = deleteInput.value;

        db.collection("Tenants")
            .where("id", "==", tenantIdToDelete)
            .get()
            .then((querySnapshot) => {
                querySnapshot.forEach((doc) => {
                    doc.ref
                        .delete()
                        .then(() => {
                            console.log("Tenant account deleted successfully.");
                            // Clear the input field after deletion
                            deleteInput.value = "";
                        })
                        .catch((error) => {
                            console.error("Error deleting tenant account: ", error);
                        });
                });
            })
            .catch((error) => {
                console.error("Error finding tenant account to delete: ", error);
            });
    });

    const changeApartmentForm = document.getElementById("Manager");
    const changeApartmentInput = document.getElementById("changeApartmentWithId");
    const newApartmentInput = document.getElementById("newApartmentId");

    changeApartmentForm.addEventListener("submit", function (e) {
        e.preventDefault();
        const tenantIdToChange = changeApartmentInput.value;
        const newApartmentNumber = newApartmentInput.value;
        db.collection("Tenants")
            .where("id", "==", tenantIdToChange)
            .get()
            .then((querySnapshot) => {
                querySnapshot.forEach((doc) => {
                    doc.ref
                        .update({ apartment: newApartmentNumber })
                        .then(() => {
                            console.log("Apartment number updated successfully.");
                            changeApartmentInput.value = "";
                            newApartmentInput.value = "";
                        })
                        .catch((error) => {
                            console.error("Error updating apartment number: ", error);
                        });
                });
            })
            .catch((error) => {
                console.error("Error finding tenant to update apartment: ", error);
            });
    });
});

document.addEventListener("DOMContentLoaded", function () {
    const addTenantForm = document.getElementById("Manager");
    const addNameInput = document.getElementById("addName");
    const addPhoneNumberInput = document.getElementById("addPhoneNumber");
    const addEmailInput = document.getElementById("addEmail");
    const addApartmentInput = document.getElementById("addApartment");
    const addCheckInInput = document.getElementById("addCheckIn");
    const addCheckoutInput = document.getElementById("addCheckout");

    addTenantForm.addEventListener("submit", function (e) {
        e.preventDefault();

        const tenantName = addNameInput.value;
        const phoneNumber = addPhoneNumberInput.value;
        const email = addEmailInput.value;
        const apartment = addApartmentInput.value;
        const checkIn = addCheckInInput.value;
        const checkout = addCheckoutInput.value;
        db.collection("Tenants")
            .add({
                name: tenantName,
                phone: phoneNumber,
                email: email,
                apartment: apartment,
                checkin: checkIn,
                checkout: checkout,
            })
            .then(function (docRef) {
                console.log("Tenant added with ID: ", docRef.id);
                // Clear the form after submission
                addNameInput.value = "";
                addPhoneNumberInput.value = "";
                addEmailInput.value = "";
                addApartmentInput.value = "";
                addCheckInInput.value = "";
                addCheckoutInput.value = "";
            })
            .catch(function (error) {
                console.error("Error adding tenant: ", error);
            });
    });
});
