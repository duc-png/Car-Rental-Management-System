import '../styles/TestimonialCard.css'

function TestimonialCard({ testimonial }) {
  const renderStars = (rating) => {
    return '⭐'.repeat(rating)
  }

  return (
    <div className="testimonial-card">
      <div className="testimonial-header">
        <div className="testimonial-avatar">
          {testimonial.name.charAt(0)}
        </div>
        <div>
          <h4 className="testimonial-name">{testimonial.name}</h4>
          <p className="testimonial-location">{testimonial.location}</p>
        </div>
      </div>

      <div className="testimonial-rating">
        {renderStars(testimonial.rating)}
      </div>

      <p className="testimonial-text">{testimonial.text}</p>
    </div>
  )
}

export default TestimonialCard
