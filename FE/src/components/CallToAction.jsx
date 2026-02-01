import '../styles/Home.css'

function CallToAction() {
  return (
    <section className="cta-section">
      <div className="container">
        <div className="cta-container">
          <div className="cta-content">
            <h2>Bạn Có Sở Hữu Xe Cao Cấp?</h2>
            <p>
              Kiếm tiền từ xe của bạn một cách dễ dàng bằng cách đăng ký trên CarRental.
              Chúng tôi lo lắng về bảo hiểm, xác minh tài xế và thanh toán an toàn
              – để bạn có thể tận hưởng doanh thu thụ động mà không lo lắng.
            </p>
            <button className="cta-btn">Đăng ký xe của bạn</button>
          </div>
          <div className="cta-image">
            <img
              src="https://res.cloudinary.com/dntzdrmc8/image/upload/v1769501417/download-removebg-preview_vhpzlh.png"
              alt="vehhicle"
            />
          </div>
        </div>
      </div>
    </section>
  )
}

export default CallToAction
