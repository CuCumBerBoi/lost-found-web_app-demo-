import { MDCTopAppBar } from '@material/top-app-bar';
import { MDCRipple } from '@material/ripple';
import { MDCDialog } from '@material/dialog';
import { MDCTextField } from '@material/text-field';
import { MDCRadio } from '@material/radio';

// Initialize Material Components
const topAppBarElement = document.querySelector('.mdc-top-app-bar');
const topAppBar = new MDCTopAppBar(topAppBarElement);

const fabRipple = new MDCRipple(document.querySelector('.mdc-fab'));
const itemDialog = new MDCDialog(document.getElementById('item-dialog'));

// ... existing references ...


// ... existing initializations ...

// Initialize text fields
const textFields = []; // Store references if you need to access them later
document.querySelectorAll('.mdc-text-field').forEach(textFieldEl => {
    textFields.push(new MDCTextField(textFieldEl));
});

// Initialize radio buttons
const radioButtons = [];
document.querySelectorAll('.mdc-radio').forEach(radioEl => {
    radioButtons.push(new MDCRadio(radioEl));
});


// References to DOM elements
const lostItemsList = document.getElementById('lost-items-list');
const foundItemsList = document.getElementById('found-items-list');
const addItemFab = document.querySelector('.add-fab');
const itemForm = document.getElementById('item-form');
const radioLost = document.getElementById('radio-lost');
const radioFound = document.getElementById('radio-found');
const itemTypeInput = document.getElementById('item-type-input');        // สำหรับ input ประเภทสิ่งของ
const itemDescriptionInput = document.getElementById('item-description');  // สำหรับ textarea คำอธิบาย
const itemDateInput = document.getElementById('item-date');              // สำหรับ input วันที่หาย/พบ
const itemLocationInput = document.getElementById('item-location');      // สำหรับ input สถานที่ที่หาย/พบ
const contactNameInput = document.getElementById('contact-name');        // สำหรับ input ชื่อผู้ติดต่อ
const contactEmailInput = document.getElementById('contact-email');      // สำหรับ input อีเมลผู้ติดต่อ
const itemImageInput = document.getElementById('item-image');            // สำหรับ input file อัปโหลดรูปภาพ
const fileNameDisplay = document.getElementById('file-name-display');    // สำหรับ span แสดงชื่อไฟล์
// const itemImageUrlHiddenInput = document.getElementById('item-image-url'); // (Optional) ถ้าคุณต้องการเก็บ URL ที่อัปโหลดแล้วใน hidden input



// --- Functions to interact with Firebase ---

async function addItem(itemType) {
    const file = itemImageInput.files[0];
    let imageUrl = '';
    if (file) {
        imageUrl = await uploadImage(file);
        if (!imageUrl) return; // Stop if image upload failed
    }

    const itemData = {
        type: itemTypeInput.value,
        description: itemDescriptionInput.value,
        location: itemLocationInput.value, // This will be lostLocation or foundLocation
        contactName: contactNameInput.value,
        contactEmail: contactEmailInput.value,
        imageUrl: imageUrl,
        status: itemType === 'lost' ? 'กำลังค้นหา' : 'รอเจ้าของ'
    };

    // Add date based on itemType
    const selectedDate = itemDateInput.value; // Format YYYY-MM-DD
    if (selectedDate) {
        const dateParts = selectedDate.split('-'); // [YYYY, MM, DD]
        // Create a Date object in local time to avoid timezone issues when saving to Firebase
        // Note: Firestore stores timestamps as UTC, client-side display handles conversion.
        const dateObject = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));

        if (itemType === 'lost') {
            itemData.lostDate = firebase.firestore.Timestamp.fromDate(dateObject);
            itemData.lostLocation = itemLocationInput.value; // Assign location specifically
        } else {
            itemData.foundDate = firebase.firestore.Timestamp.fromDate(dateObject);
            itemData.foundLocation = itemLocationInput.value; // Assign location specifically
        }
    } else {
        // Handle case where date is not provided, maybe set to current date or show error
        alert('กรุณาระบุวันที่');
        return;
    }

    // Remove the generic 'location' field if we have specific lost/found locations
    delete itemData.location;

    try {
        const collectionRef = itemType === 'lost' ? db.collection('lostItems') : db.collection('foundItems');
        await collectionRef.add({
            ...itemData,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        });
        console.log('Item added successfully!');
        itemForm.reset(); // Clear the form
        itemImageInput.value = ''; // Clear file input
        fileNameDisplay.textContent = 'ยังไม่มีไฟล์';
        itemDialog.close(); // Close the dialog
        // Re-fetch items to update the list immediately
        // fetchAndDisplayItems(); // No need, onSnapshot will handle this
    } catch (error) {
        console.error('Error adding item: ', error);
        alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่');
    }
}

// Function to fetch and display items
function fetchAndDisplayItems() {
    // Clear existing lists
    lostItemsList.innerHTML = '';
    foundItemsList.innerHTML = '';

    // Fetch Lost Items
    db.collection('lostItems').orderBy('timestamp', 'desc').onSnapshot(snapshot => {
        lostItemsList.innerHTML = ''; // Clear before re-rendering
        snapshot.forEach(doc => {
            const item = doc.data();
            lostItemsList.innerHTML += createItemCard(item, 'lost', doc.id);
        });
    });

    // Fetch Found Items
    db.collection('foundItems').orderBy('timestamp', 'desc').onSnapshot(snapshot => {
        foundItemsList.innerHTML = ''; // Clear before re-rendering
        snapshot.forEach(doc => {
            const item = doc.data();
            foundItemsList.innerHTML += createItemCard(item, 'found', doc.id);
        });
    });
}

// Function to create an item card HTML
function createItemCard(item, type, id) {
    const imageUrl = item.imageUrl || 'https://via.placeholder.com/200x150?text=No+Image';
    const dateLabel = type === 'lost' ? 'หายที่' : 'พบที่';
    // Convert Firebase Timestamp to Date object for display
    const displayDate = (item.lostDate || item.foundDate) ?
                        new Date((item.lostDate || item.foundDate).seconds * 1000).toLocaleDateString('th-TH') :
                        'ไม่ระบุ';
    const location = item.lostLocation || item.foundLocation || 'ไม่ระบุ';
    const contact = item.contactName + (item.contactEmail ? ` (${item.contactEmail})` : '');

    // Determine status class for styling
    const statusClass = (item.status === 'กำลังค้นหา' || item.status === 'รอเจ้าของ') ? 'status-open' : 'status-closed';

    return `
        <div class="mdc-card item-card" data-id="${id}" data-type="${type}">
            <div class="mdc-card__primary-action">
                <div class="mdc-card__media mdc-card__media--16-9" style="background-image: url('${imageUrl}');"></div>
                <div class="mdc-card__content">
                    <h3 class="mdc-typography--headline6">${item.type}</h3>
                    <h4 class="mdc-typography--subtitle2">${item.description}</h4>
                    <p class="mdc-typography--body2">${dateLabel}: ${location} เมื่อวันที่ ${displayDate}</p>
                    <p class="mdc-typography--body2">ติดต่อ: ${contact}</p>
                    <p class="mdc-typography--body2 ${statusClass}">สถานะ: ${item.status}</p>
                </div>
            </div>
            <div class="mdc-card__actions">
                <div class="mdc-card__action-buttons">
                    <button class="mdc-button mdc-card__action mdc-card__action--button" data-action="view-details" data-id="${id}" data-type="${type}">
                        <span class="mdc-button__label">รายละเอียด</span>
                    </button>
                </div>
                <div class="mdc-card__action-icons">
                    <button class="material-icons mdc-icon-button mdc-card__action mdc-card__action--icon" title="Share">share</button>
                    ${type === 'lost' ? `
                        <button class="material-icons mdc-icon-button mdc-card__action mdc-card__action--icon" title="Mark as Found" data-action="mark-found" data-id="${id}">check</button>
                    ` : `
                        <button class="material-icons mdc-icon-button mdc-card__action mdc-card__action--icon" title="Mark as Returned" data-action="mark-returned" data-id="${id}">done_all</button>
                    `}
                </div>
            </div>
        </div>
    `;
}

// --- Event Listeners ---

// Open dialog when FAB is clicked
addItemFab.addEventListener('click', () => {
    itemDialog.open();
});

// Handle dialog actions (e.g., Save button)
itemDialog.listen('MDCDialog:closed', async event => { // <<< เปลี่ยนบรรทัดนี้: เพิ่ม async และเปลี่ยน signature
    if (event.detail.action === 'accept') {
        const itemType = radioLost.checked ? 'lost' : 'found';
        await addItem(itemType); // <<< เปลี่ยนบรรทัดนี้: เรียก addItem(itemType) โดยตรง และเพิ่ม await
    }
});

// Event Listener สำหรับ File Input
itemImageInput.addEventListener('change', (event) => {
    if (event.target.files.length > 0) {
        fileNameDisplay.textContent = event.target.files[0].name; // แสดงชื่อไฟล์ที่เลือก
    } else {
        fileNameDisplay.textContent = 'ยังไม่มีไฟล์'; // ถ้าไม่มีไฟล์ ก็แสดงข้อความนี้
    }
});

async function uploadImage(file) {
    if (!file) return null;

    const storageRef = storage.ref();
    const fileExtension = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExtension}`;
    const imageRef = storageRef.child(`item_images/${fileName}`);

    try {
        const snapshot = await imageRef.put(file);
        const imageUrl = await snapshot.ref.getDownloadURL();
        console.log('Image uploaded:', imageUrl);
        return imageUrl;
    } catch (error) {
        console.error('Error uploading image:', error);
        alert('เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ');
        return null;
    }
}

async function updateItemStatus(id, type, newStatus) {
    try {
        const collectionRef = type === 'lost' ? db.collection('lostItems') : db.collection('foundItems');
        await collectionRef.doc(id).update({
            status: newStatus
        });
        console.log(`Item ${id} status updated to ${newStatus}`);
        alert('อัปเดตสถานะสำเร็จ!');
    } catch (error) {
        console.error('Error updating item status: ', error);
        alert('เกิดข้อผิดพลาดในการอัปเดตสถานะ');
    }
}

// Add event listener for status change buttons (delegation for dynamically added elements)
document.addEventListener('click', (event) => {
    const target = event.target.closest('[data-action="mark-found"], [data-action="mark-returned"]');
    if (target) {
        const id = target.dataset.id;
        const card = target.closest('.item-card');
        const type = card.dataset.type;

        if (target.dataset.action === 'mark-found') {
            updateItemStatus(id, type, 'พบแล้ว');
        } else if (target.dataset.action === 'mark-returned') {
            updateItemStatus(id, type, 'ส่งคืนแล้ว');
        }
    }
    // You can add an event listener here for 'view-details' to open a dialog with more info
    const viewDetailsBtn = event.target.closest('[data-action="view-details"]');
    if (viewDetailsBtn) {
        const id = viewDetailsBtn.dataset.id;
        const type = viewDetailsBtn.dataset.type;
        // TODO: Implement a function to fetch item details and display in a dedicated dialog
        console.log(`View details for ID: ${id}, Type: ${type}`);
        alert(`ฟังก์ชันดูรายละเอียดจะแสดงข้อมูลเต็มของรายการ ID: ${id}`);
    }
});

// Initial load of items
document.addEventListener('DOMContentLoaded', fetchAndDisplayItems);