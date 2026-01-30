import TestimonialCard from './TestimonialCard'
import '../styles/Home.css'

function Testimonials() {
  const testimonials = [
    {
      id: 1,
      name: 'Emma Rodriguez',
      location: 'Madrid, Spain',
      rating: 5,
      text: '"Tôi đã thuê xe từ nhiều công ty khác nhau, nhưng trải nghiệm với ứng dụng CarRental vượt quá mong đợi của tôi. Mọi thứ diễn ra suôn sẻ từ đầu đến cuối."'
    },
    {
      id: 2,
      name: 'John Smith',
      location: 'New York, USA',
      rating: 5,
      text: '"CarRental giúp chuyến đi của tôi dễ dàng hơn rất nhiều. Xe được giao ngay tại cửa nhà tôi và dịch vụ khách hàng xuất sắc."'
    },
    {
      id: 3,
      name: 'Ava Johnson',
      location: 'Sydney, Australia',
      rating: 5,
      text: '"Tôi rất khuyên khích CarRental! Dàn xe của họ tuyệt vời và tôi luôn cảm thấy an toàn với các dịch vụ của họ. Tôi chắc chắn sẽ thuê lại."'
    }
  ]

  return (
    <section className="testimonials-section">
      <div className="section-header">
        <h2>Khách Hàng Nói Gì Về Chúng Tôi</h2>
        <p>
          Khám phá lý do tại sao những du khách khó tính lựa chọn CarRental cho các dịch vụ cho thuê xe cao cấp trên khắp thế giới.
        </p>
      </div>

      <div className="testimonials-grid">
        {testimonials.map(testimonial => (
          <TestimonialCard key={testimonial.id} testimonial={testimonial} />
        ))}
      </div>
    </section>
  )
}

export default Testimonials
