'use client';

import { useState } from 'react'
import '../styles/Home.css'

function Newsletter() {
  const [email, setEmail] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log('Subscribed:', email)
    setEmail('')
  }

  return (
    <section className="newsletter-section">
      <h2>Không Bao Giờ Bỏ Lỡ Ưu Đãi!</h2>
      <p>Đăng ký để nhận các ưu đãi mới nhất, những chiếc xe mới và giảm giá độc quyền.</p>

      <form className="newsletter-form" onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Nhập email của bạn"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button type="submit">Đăng Ký</button>
      </form>
    </section>
  )
}

export default Newsletter
