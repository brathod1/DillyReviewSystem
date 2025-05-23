const stars = document.querySelectorAll('.stars span');
let selectedRating = 0;

stars.forEach(star => {
    star.addEventListener('click', (e) => {
        selectedRating = parseInt(star.dataset.rating);

        stars.forEach((s, idx) => {
            s.style.color = (idx < selectedRating) ? '#ffd700' : '#ddd';
        });

        if (selectedRating >= 4) {
            window.location.href = 'https://search.google.com/local/writereview?placeid=ChIJnfW7upbIXzkR38VzTXjsTsQ';
        } else {
            document.getElementById('lowRatingForm').style.display = 'block';
            document.getElementById('rating').value = selectedRating;
            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        }
    });
});

const form = document.getElementById('detailedReview');
if (form) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        try {
            const response = await fetch('/review', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (response.ok) {
                document.getElementById('message').textContent = 'Thank you for your valuable feedback!';
                document.getElementById('message').style.color = 'green';
                form.reset();
                setTimeout(() => {
                    document.getElementById('lowRatingForm').style.display = 'none';
                    stars.forEach(s => s.style.color = '#ddd');
                }, 2000);
            } else {
                document.getElementById('message').textContent = result.errors[0].msg;
                document.getElementById('message').style.color = 'red';
            }
        } catch (err) {
            document.getElementById('message').textContent = 'Submission failed. Please try again.';
            document.getElementById('message').style.color = 'red';
        }
    });
}