const leftGallery = document.getElementById('left-gallery');
const rightGallery = document.getElementById('right-gallery');
const slider = document.getElementById('slider');
const sliderLabel = document.getElementById('slider-label');

// Stores the zoom level for each image
const zoomLevels = new Map();

function handleFile(file) {
    if (file.type.startsWith('image/')) {
        const container = document.createElement('div');
        container.className = 'image-container'; // Create a container for the image
        
        const img = document.createElement('img');
        
        // Convert file to base64
        const reader = new FileReader();
        reader.onloadend = function () {
            img.src = reader.result; // Set image src to base64
            img.onload = function () {
                const width = img.naturalWidth;
                const height = img.naturalHeight;
                if (width > height) {
                    rightGallery.appendChild(container);
                    container.appendChild(img);
                    adjustGridLayout();
                } else {
                    leftGallery.appendChild(container);
                    container.appendChild(img);
                    zoomLevels.set(img, 1);
                }
                adjustContainer();
                setupImageZoom();
            }
        };
        reader.readAsDataURL(file);
    }
}

function adjustGridLayout() {
    const totalImages = rightGallery.querySelectorAll('.image-container').length;
    const numRows = 2;
    const numColumns = Math.ceil(totalImages / numRows);

    rightGallery.style.gridTemplateColumns = `repeat(${numColumns}, 1fr)`;
    rightGallery.style.gridTemplateRows = `repeat(${numRows}, minmax(150px, auto))`;
}

function adjustContainer() {
    const images = leftGallery.querySelectorAll('.image-container img');
    const numImages = images.length;
    const galleryWidth = leftGallery.clientWidth;
    const minImageSize = 150; // Minimum size of images in pixels

    // Calculate the number of columns based on gallery width and minimum image size
    const numColumns = Math.floor(galleryWidth / minImageSize);
    const numRows = Math.ceil(numImages / numColumns);

    // Decide whether to use one row or two rows based on the number of images and gallery width
    const useTwoRows = numImages > numColumns && numRows <= 2;

    leftGallery.style.display = 'grid';
    const leftWidthPercent = slider.value;
    const rightWidthPercent = 100 - leftWidthPercent;
    leftGallery.style.width = `${leftWidthPercent}%`;
    rightGallery.style.width = `${rightWidthPercent}%`;

    if (useTwoRows) {
        leftGallery.style.gridTemplateColumns = `repeat(${numColumns}, 1fr)`;
        leftGallery.style.gridTemplateRows = `repeat(2, minmax(${minImageSize}px, auto))`;
    } else {
        leftGallery.style.gridTemplateColumns = `repeat(${numImages}, 1fr)`;
        leftGallery.style.gridTemplateRows = `repeat(1, minmax(${minImageSize}px, auto))`;
    }

    // Adjust image sizes to fit within the grid cells
    images.forEach(img => {
        img.style.width = '100%';
        img.style.height = 'auto'; // Maintain aspect ratio
        img.style.transform = `scale(${zoomLevels.get(img) || 1})`; // Apply zoom level
    });

    // Also handle the right gallery images
    const rightImages = rightGallery.querySelectorAll('.image-container img');
    rightImages.forEach(img => {
        img.style.width = '100%';
        img.style.height = 'auto'; // Maintain aspect ratio
        img.style.transform = `scale(${zoomLevels.get(img) || 1})`; // Apply zoom level
    });
}

function applyZoom(img, zoomLevel) {
    img.style.transform = `scale(${zoomLevel})`;
    img.style.transformOrigin = 'center'; // Center zoom on the image
}

function handleZoom(event) {
    event.preventDefault();
    const img = event.target;
    if (img.tagName === 'IMG') {
        let zoomLevel = zoomLevels.get(img) || 1;
        const zoomStep = 0.1; // Zoom step size
        const maxZoom = 5; // Maximum zoom level

        if (event.deltaY < 0) { // Zoom in
            zoomLevel = Math.min(zoomLevel + zoomStep, maxZoom);
        } else { // Zoom out
            zoomLevel = Math.max(zoomLevel - zoomStep, 1);
        }

        zoomLevels.set(img, zoomLevel);
        applyZoom(img, zoomLevel);
    }
}

function setupImageZoom() {
    const images = document.querySelectorAll('.image-container img');
    images.forEach(img => {
        img.addEventListener('wheel', handleZoom, { passive: false });
        img.addEventListener('mousedown', startDrag);
        img.addEventListener('mouseup', stopDrag);
        img.addEventListener('mousemove', drag);
        img.addEventListener('dragstart', (e) => e.preventDefault()); // Prevent image dragging
    });
}

function startDrag(event) {
    const img = event.target;
    if (img.tagName === 'IMG') {
        event.preventDefault(); // Prevent default behavior
        img.style.cursor = 'grabbing'; // Change cursor to grabbing
        img.dataset.dragging = true; // Set a flag to indicate dragging
        img.dataset.startX = event.clientX; // Store the starting X position
        img.dataset.startY = event.clientY; // Store the starting Y position
        img.dataset.startLeft = img.offsetLeft; // Store the starting left position
        img.dataset.startTop = img.offsetTop; // Store the starting top position
    }
}

function stopDrag(event) {
    const img = event.target;
    if (img.tagName === 'IMG') {
        img.style.cursor = 'grab'; // Change cursor back to grab
        img.dataset.dragging = false; // Clear the dragging flag
    }
}

function drag(event) {
    const img = event.target;
    if (img.tagName === 'IMG' && img.dataset.dragging === 'true') {
        event.preventDefault(); // Prevent default behavior
        const dx = event.clientX - img.dataset.startX; // Change in X
        const dy = event.clientY - img.dataset.startY; // Change in Y

        img.style.left = `${parseFloat(img.dataset.startLeft) + dx}px`; // Update position
        img.style.top = `${parseFloat(img.dataset.startTop) + dy}px`; // Update position
    }
}

// Ensure that dragging does not trigger default behavior
document.addEventListener('dragstart', (e) => e.preventDefault());

function updateSliderLabel() {
    const leftWidthPercent = slider.value;
    const rightWidthPercent = 100 - leftWidthPercent;
    sliderLabel.textContent = `${leftWidthPercent}% - ${rightWidthPercent}%`;
}

slider.addEventListener('input', function () {
    updateSliderLabel();
    adjustContainer();
});
// Initialize slider label based on default value
updateSliderLabel();

document.addEventListener('dragover', function (e) {
    e.preventDefault();
});

document.addEventListener('drop', function (e) {
    e.preventDefault();
    leftGallery.innerHTML = ''; // Clear left gallery
    rightGallery.innerHTML = ''; // Clear right gallery

    const files = e.dataTransfer.files;

    for (let i = 0; i < files.length; i++) {
        handleFile(files[i]);
    }
});

// Initialize container sizes based on the default slider value
adjustContainer();
const dbName = "GalleryDB3";
const storeName = "images";
let db;

function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName, 1);

        request.onupgradeneeded = function(event) {
            db = event.target.result;
            db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true });
        };

        request.onsuccess = function(event) {
            db = event.target.result;
            resolve(db);
        };

        request.onerror = function(event) {
            reject('Error opening IndexedDB: ' + event.target.errorCode);
        };
    });
}

function saveState() {
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    
    const imagesData = [];
    const leftImages = leftGallery.querySelectorAll('img');
    const rightImages = rightGallery.querySelectorAll('img');
    
    [...leftImages, ...rightImages].forEach((img) => {
        const base64 = img.src; // Base64 data for the image
        const zoomLevel = zoomLevels.get(img) || 1;
        const container = img.parentNode; // Get container of the image
        const left = container.style.left || 0;
        const top = container.style.top || 0;

        imagesData.push({
            src: base64,
            zoomLevel: zoomLevel,
            position: { left, top }
        });
    });

    const state = {
        sliderValue: slider.value,
        images: imagesData
    };

    store.clear(); // Clear previous state
    store.add(state); // Store the new state

    transaction.oncomplete = function() {
        alert('Gallery state saved successfully.');
    };

    transaction.onerror = function(event) {
        console.error('Error saving state: ', event.target.errorCode);
    };
}

function loadState() {
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    
    const request = store.getAll();
    request.onsuccess = function(event) {
        const results = event.target.result;
        if (results.length > 0) {
            const savedState = results[0];
            slider.value = savedState.sliderValue;
            adjustContainer();
            restoreImages(savedState.images);
        }
    };

    request.onerror = function(event) {
        console.error('Error loading state: ', event.target.errorCode);
    };
}

function restoreImages(imagesData) {
    leftGallery.innerHTML = '';
    rightGallery.innerHTML = '';
    
    imagesData.forEach((imageData) => {
        const container = document.createElement('div');
        container.className = 'image-container';
        container.style.left = imageData.position.left;
        container.style.top = imageData.position.top;

        const img = document.createElement('img');
        img.src = imageData.src; // Use base64 data

        img.onload = function() {
            const width = img.naturalWidth;
            const height = img.naturalHeight;
            if (width > height) {
                rightGallery.appendChild(container);
                container.appendChild(img);
                adjustGridLayout();
            } else {
                leftGallery.appendChild(container);
                container.appendChild(img);
            }
            applyZoom(img, imageData.zoomLevel);
            setupImageZoom(); // Set up zoom listeners after restoring
        };
    });
}

document.getElementById('save-button').addEventListener('click', saveState);

// Initialize IndexedDB and load previous state when the page loads
openDB().then(() => {
    loadState();
});
