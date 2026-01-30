import '../styles/Footer.css'

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-section">
          <div className="footer-brand">
            <img src="/favicon.svg" alt="CarRental Logo" className="footer-logo" />
            <h4>CarRental</h4>
          </div>
          <p className="footer-description">
            Premium car rental service with a wide selection of luxury vehicles for all your
            travel needs.
          </p>
          <div className="social-links">
            <a href="#facebook" title="Facebook">f</a>
            <a href="#instagram" title="Instagram">📷</a>
            <a href="#twitter" title="Twitter">𝕏</a>
            <a href="#linkedin" title="LinkedIn">in</a>
            <a href="#email" title="Email">✉️</a>
          </div>
        </div>

        <div className="footer-section">
          <h5>QUICK LINKS</h5>
          <ul>
            <li><a href="/">Browse Cars</a></li>
            <li><a href="/">How it Works</a></li>
            <li><a href="/">About Us</a></li>
            <li><a href="/">Contact Us</a></li>
          </ul>
        </div>

        <div className="footer-section">
          <h5>RESOURCES</h5>
          <ul>
            <li><a href="/">Blog</a></li>
            <li><a href="/">Terms of Service</a></li>
            <li><a href="/">Privacy Policy</a></li>
            <li><a href="/">Insurance</a></li>
          </ul>
        </div>

        <div className="footer-section">
          <h5>CONTACT</h5>
          <ul>
            <li><a href="tel:+14155552671">+1 (415) 555-2671</a></li>
            <li>San Francisco, CA 94107</li>
            <li><a href="mailto:info@example.com">info@example.com</a></li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; 2025 CarRental. All rights reserved.</p>
        <div className="footer-links">
          <a href="/">Privacy</a>
          <a href="/">Terms</a>
          <a href="/">Cookies</a>
        </div>
      </div>
    </footer>
  )
}

export default Footer
