document.addEventListener('DOMContentLoaded', async () => {
  const reviewsDiv = document.getElementById('reviews');
  const totalReviewsElem = document.getElementById('totalReviews');
  const avgRatingElem = document.getElementById('avgRating');
  const lowRatingsElem = document.getElementById('lowRatings');
  const ratingFilter = document.getElementById('ratingFilter');
  const startDate = document.getElementById('startDate');
  const endDate = document.getElementById('endDate');
  let allReviews = [];

  // Fetch all reviews on load
  async function fetchReviews() {
    reviewsDiv.innerHTML = 'Loading reviews...';
    try {
      const res = await fetch('/staff-reviews');
      allReviews = await res.json();
      renderDashboard(allReviews);
    } catch (err) {
      reviewsDiv.innerHTML = '<p style="color:red;">Error loading reviews.</p>';
    }
  }

  // Render dashboard stats, charts, and reviews
  function renderDashboard(reviews) {
    // Summary stats
    totalReviewsElem.textContent = reviews.length;
    avgRatingElem.textContent = (reviews.reduce((a, r) => a + r.rating, 0) / (reviews.length || 1)).toFixed(1);
    lowRatingsElem.textContent = reviews.filter(r => r.rating <= 3).length;

    // Charts
    renderCharts(reviews);

    // Reviews list
    renderReviews(reviews);
  }

  // Render reviews as cards
  function renderReviews(reviews) {
    if (!reviews.length) {
      reviewsDiv.innerHTML = '<p>No low-rated reviews found.</p>';
      return;
    }
    reviewsDiv.innerHTML = reviews.map(r => `
      <div class="review-card">
        <div class="review-header">
          <span class="review-rating">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</span>
          <span class="review-name">${r.name || 'Anonymous'}</span>
          <span class="review-date">${new Date(r.createdAt).toLocaleString()}</span>
        </div>
        <div class="review-body">
          <p>${r.feedback}</p>
          <div class="review-contact">
            <span>Phone: ${r.phone || '-'}</span>
          </div>
        </div>
      </div>
    `).join('');
  }

  // Render charts using Chart.js
  function renderCharts(reviews) {
    // Destroy previous charts if any
    if (window.trendChart) window.trendChart.destroy();
    if (window.distChart) window.distChart.destroy();

    // Trend chart (reviews per day, last 7 days)
    const days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().slice(0, 10);
    });
    const dayLabels = days.map(d => d.slice(5));
    const dayCounts = days.map(day =>
      reviews.filter(r => r.createdAt && r.createdAt.slice(0, 10) === day).length
    );
    window.trendChart = new Chart(document.getElementById('trendChart').getContext('2d'), {
      type: 'line',
      data: {
        labels: dayLabels,
        datasets: [{
          label: 'Reviews per Day',
          data: dayCounts,
          borderColor: '#d4af37',
          backgroundColor: 'rgba(212,175,55,0.1)',
          fill: true
        }]
      }
    });

    // Rating distribution chart
    const ratingCounts = [1,2,3].map(star =>
      reviews.filter(r => r.rating === star).length
    );
    window.distChart = new Chart(document.getElementById('ratingDistribution').getContext('2d'), {
      type: 'pie',
      data: {
        labels: ['1★', '2★', '3★'],
        datasets: [{
          data: ratingCounts,
          backgroundColor: ['#ff6b6b', '#ffd54f', '#4dabf7']
        }]
      }
    });
  }

  // Filter logic
  function applyFilters() {
    let filtered = [...allReviews];
    const rating = ratingFilter.value;
    if (rating !== 'all') filtered = filtered.filter(r => String(r.rating) === rating);
    if (startDate.value) filtered = filtered.filter(r => r.createdAt && r.createdAt.slice(0,10) >= startDate.value);
    if (endDate.value) filtered = filtered.filter(r => r.createdAt && r.createdAt.slice(0,10) <= endDate.value);
    renderDashboard(filtered);
  }

  ratingFilter.addEventListener('change', applyFilters);
  startDate.addEventListener('change', applyFilters);
  endDate.addEventListener('change', applyFilters);

  fetchReviews();
});
