function generateOutputs() {
    const reviewsInput = document.getElementById('reviews-input').value;
    const reviewLink = document.getElementById('review-link').value;
    const reviewPhotos = document.getElementById('review-photos').files;
    const reviews = reviewsInput.split(/\n\n/);
    const undoneContainer = document.getElementById('undone-container');
    undoneContainer.innerHTML = '';

    const photoUrls = [];

    if (reviewPhotos.length > 0) {
        let loadedImagesCount = 0;

        Array.from(reviewPhotos).forEach((photo, index) => {
            const reader = new FileReader();
            reader.onload = function(e) {
                photoUrls[index] = e.target.result;
                loadedImagesCount++;
                if (loadedImagesCount === reviewPhotos.length) {
                    reviews.forEach((review, index) => {
                        const photoUrl = photoUrls[index] || null;
                        addReviewElement(review, reviewLink, photoUrl, index, false);
                    });
                    updateStats();
                }
            };
            reader.readAsDataURL(photo);
        });
    } else {
        reviews.forEach((review, index) => {
            addReviewElement(review, reviewLink, null, index, false);
        });
        updateStats();
    }
}

function addReviewElement(review, link, photoUrl, index, isDone) {
    const container = isDone ? document.getElementById('done-container') : document.getElementById('undone-container');
    const outputDiv = document.createElement('div');
    outputDiv.className = 'output';
    outputDiv.id = `output-${index}`;

    const linkElement = document.createElement('p');
    linkElement.innerHTML = `Click: <a href="${link}" target="_blank">${link}</a>`;
    outputDiv.appendChild(linkElement);

    const reviewElement = document.createElement('p');
    reviewElement.textContent = review;
    outputDiv.appendChild(reviewElement);

    if (photoUrl) {
        const imgElement = document.createElement('img');
        imgElement.src = photoUrl;
        imgElement.alt = 'Review Image';
        outputDiv.appendChild(imgElement);
    }

    const copyButton = document.createElement('button');
    copyButton.className = 'copy-btn';
    copyButton.textContent = 'Copy';
    copyButton.onclick = () => copyReviewToClipboard(link, review, photoUrl);
    outputDiv.appendChild(copyButton);

    if (isDone) {
        const undoneButton = document.createElement('button');
        undoneButton.className = 'undone-btn';
        undoneButton.textContent = 'Mark as Undone';
        undoneButton.onclick = () => markAsUndone(outputDiv, index);
        outputDiv.appendChild(undoneButton);
    } else {
        const doneButton = document.createElement('button');
        doneButton.className = 'done-btn';
        doneButton.textContent = 'Mark as Done';
        doneButton.onclick = () => markAsDone(outputDiv, index);
        outputDiv.appendChild(doneButton);
    }

    container.appendChild(outputDiv);
}

function copyReviewToClipboard(link, review, photoUrl) {
    const textToCopy = `Click: ${link}\n\n${review}${photoUrl ? `\n\n![image](${photoUrl})` : ''}`;
    navigator.clipboard.writeText(textToCopy).then(() => {
        alert('Copied to clipboard!');
    }).catch(() => {
        alert('Failed to copy!');
    });
}

function markAsDone(element, index) {
    element.remove();
    addReviewElement(element.querySelector('p:nth-of-type(2)').textContent, element.querySelector('a').href, element.querySelector('img') ? element.querySelector('img').src : null, index, true);
    updateStats();
}

function markAsUndone(element, index) {
    element.remove();
    addReviewElement(element.querySelector('p:nth-of-type(2)').textContent, element.querySelector('a').href, element.querySelector('img') ? element.querySelector('img').src : null, index, false);
    updateStats();
}

function updateStats() {
    const totalReviews = document.querySelectorAll('.output').length;
    const doneReviews = document.getElementById('done-container').childElementCount;
    const undoneReviews = totalReviews - doneReviews;

    document.getElementById('total-reviews').textContent = totalReviews;
    document.getElementById('done-count').textContent = doneReviews;
    document.getElementById('undone-count').textContent = undoneReviews;
}

function saveData() {
    const outputs = document.querySelectorAll('.output');
    const data = Array.from(outputs).map(output => {
        const img = output.querySelector('img');
        return {
            l: output.querySelector('a').href,
            r: output.querySelector('p:nth-of-type(2)').textContent,
            p: img ? img.src : null,
            d: output.closest('#done-container') !== null
        };
    });
    const dataStr = JSON.stringify(data);
    const dataOutput = document.getElementById('data-output');
    dataOutput.value = dataStr;
    copyToClipboard(dataStr);
}

function loadData() {
    const dataInput = document.getElementById('data-input').value;
    const data = JSON.parse(dataInput);
    const undoneContainer = document.getElementById('undone-container');
    const doneContainer = document.getElementById('done-container');
    undoneContainer.innerHTML = '';
    doneContainer.innerHTML = '';

    try {
        data.forEach((item, index) => {
            addReviewElement(item.r, item.l, item.p, index, item.d);
            if (item.d) {
                document.getElementById(`output-${index}`).classList.add('done');
            }
        });
        updateStats();
    } catch (error) {
        alert('Invalid data format');
    }
}

function loadDataFromFile(event) {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = function(e) {
        const fileContent = e.target.result;
        const dataInput = document.getElementById('data-input');
        dataInput.value = fileContent;
        loadData();
    };
    reader.readAsText(file);
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        alert('Copied to clipboard!');
    }).catch(() => {
        alert('Failed to copy!');
    });
}

function showTab(tab) {
    const undoneContainer = document.getElementById('undone-container');
    const doneContainer = document.getElementById('done-container');

    if (tab === 'undone') {
        undoneContainer.style.display = 'block';
        doneContainer.style.display = 'none';
    } else {
        undoneContainer.style.display = 'none';
        doneContainer.style.display = 'block';
    }
}

function compressImage(dataUrl, maxWidth, maxHeight, callback) {
    const img = new Image();
    img.src = dataUrl;
    img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
            if (width > height) {
                height = Math.round((height *= maxWidth / width));
                width = maxWidth;
            } else {
                width = Math.round((width *= maxHeight / height));
                height = maxHeight;
            }
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        callback(canvas.toDataURL('image/webp', 0.9)); // Higher quality setting
    };
}
















