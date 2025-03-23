document.addEventListener("DOMContentLoaded", async () => {
  const socket = io();
  const uploadForm = document.getElementById("uploadForm");
  const fileInput = document.getElementById("file");
  const nameInput = document.getElementById("name");
  const passwordInput = document.getElementById("password");
  const progressBar = document.getElementById("progressBar");
  const uploadStatus = document.getElementById("uploadStatus");
  const reviewsList = document.getElementById("reviews-list");

  uploadForm.addEventListener("submit", async function (event) {
      event.preventDefault();

      const name = nameInput.value;
      const password = passwordInput.value;
      const file = fileInput.files[0];

      // Check if review name exists
      const reviewNameCheck = await fetch('/upload/checkReviewName', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify({ name })
      });

      if (reviewNameCheck.status === 400) {
          const response = await reviewNameCheck.json();
          uploadStatus.innerText = response.message || 'Please choose a unique review name';
          return;
      }

      if (reviewNameCheck.status !== 200) {
          uploadStatus.innerText = 'Error checking review name. Please try again.';
          return;
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("name", name);
      formData.append("password", password);

      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/upload", true);

      xhr.upload.onprogress = function (event) {
          if (event.lengthComputable) {
              const percentComplete = (event.loaded / event.total) * 100;
              progressBar.style.display = 'block';
              progressBar.value = percentComplete;
              uploadStatus.innerText = `Uploading: ${Math.round(percentComplete)}%`;
          }
      };

      xhr.onload = function () {
          console.log('XHR status:', xhr.status);
          console.log('XHR response:', xhr.responseText);
          progressBar.style.display = 'none';
          if (xhr.status == 200) {
              uploadStatus.innerText = 'Upload complete!';
              // Réinitialiser le formulaire
              uploadForm.reset();
              loadReviews();
          } else if (xhr.status == 400) {
              try {
                  const response = JSON.parse(xhr.responseText);
                  uploadStatus.innerText = response.message || 'Please choose a unique review name';
              } catch (e) {
                  uploadStatus.innerText = 'Error parsing response: ' + xhr.responseText;
              }
          } else {
              try {
                  const response = JSON.parse(xhr.responseText);
                  uploadStatus.innerText = response.message || 'Upload failed.';
              } catch (e) {
                  uploadStatus.innerText = 'Upload failed: ' + xhr.responseText;
              }
          }
      };

      xhr.onerror = function () {
          console.error('XHR error occurred');
          progressBar.style.display = 'none';
          uploadStatus.innerText = 'An error occurred during the upload. Please try again.';
      };

      // Ajouter un timeout pour éviter que l'upload reste bloqué indéfiniment
      xhr.timeout = 180000; // 3 minutes
      xhr.ontimeout = function () {
          console.error('XHR timeout occurred');
          progressBar.style.display = 'none';
          uploadStatus.innerText = 'Upload timed out. The video might be too large or the server is busy.';
      };

      // Afficher un message au début de l'upload
      uploadStatus.innerText = 'Starting upload...';
      console.log('Sending form data to server');

      xhr.send(formData);
  });

  socket.on('uploadProgress', function (data) {
      progressBar.style.display = 'block';
      progressBar.value = data.progress;
  });

  socket.on('transcodeProgress', function (data) {
      document.getElementById('transcodeProgress').innerText = `Transcode Progress: ${data.progress.toFixed(2)}% `;
  });

  const fetchReviews = async () => {
      const response = await fetch("/reviews/all");
      const reviews = await response.json();
      return reviews;
  };

  const deleteReview = async (id) => {
      await fetch(`/reviews/${id}`, {
          method: "DELETE"
      });
      loadReviews();
  };

  const updateReview = async (id, reviewName, password) => {
      await fetch(`/reviews/${id}`, {
          method: "PUT",
          headers: {
              "Content-Type": "application/json",
          },
          body: JSON.stringify({ reviewName, password }),
      });
      loadReviews();
  };

  const loadReviews = async () => {
      const reviews = await fetchReviews();
      reviewsList.innerHTML = reviews.map(review => `
          <div class="review-item" data-id="${review.id}">
              <div class="reviewText">Review Name:</div>
              <input type="text" value="${review.reviewName}" class="review-name" placeholder="Review Name" />
              <div class="reviewText">Password:</div>
              <input type="text" value="${review.password}" class="review-password" placeholder="Password" />
              <button class="delete-review">Delete</button>
              <button class="update-review">Update</button>
          </div>
  
      `).join("");

      document.querySelectorAll(".delete-review").forEach(button => {
          button.addEventListener("click", (e) => {
              const reviewItem = e.target.closest(".review-item");
              const reviewId = reviewItem.dataset.id;
              deleteReview(reviewId);
          });
      });

      document.querySelectorAll(".update-review").forEach(button => {
          button.addEventListener("click", (e) => {
              const reviewItem = e.target.closest(".review-item");
              const reviewId = reviewItem.dataset.id;
              const reviewName = reviewItem.querySelector(".review-name").value.trim();
              const password = reviewItem.querySelector(".review-password").value.trim();
              updateReview(reviewId, reviewName, password);
          });
      });
  };

  loadReviews();
});
