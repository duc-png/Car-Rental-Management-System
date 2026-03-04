'use client';

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Award, CarFront, Headset, ShieldCheck } from 'lucide-react'
import SearchBar from '../../components/SearchBar'
import FeaturedVehicles from '../../components/FeaturedVehicles'
import CallToAction from '../../components/CallToAction'
import Testimonials from '../../components/Testimonials'
import Newsletter from '../../components/Newsletter'
import '../../styles/Home.css'

function Home() {
  const navigate = useNavigate()
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  const heroImages = [
    {
      url: 'https://res.cloudinary.com/dntzdrmc8/image/upload/v1769344789/RR-removebg-preview_tr10r4.png',
      alt: 'Rolls Royce'
    },
    {
      url: 'https://res.cloudinary.com/dntzdrmc8/image/upload/v1769349878/designed-in-house-at-ferrari-laferrari-is-a-bold-melange-of-classic-elements-from-maranellos-supercars-of-yore-its-lines-are-sleek-evocative-of-a-space-ship-yielding-the-ultimate-ferrari-hypercar_7007_u75lnz.png',
      alt: 'Luxury Black Car'
    },
    {
      url: 'https://res.cloudinary.com/dntzdrmc8/image/upload/v1769349877/hqdefault-removebg-preview_uvmkop.png',
      alt: 'Silver Sports Car'
    },
    {
      url: 'https://res.cloudinary.com/dntzdrmc8/image/upload/v1769349878/hinh-nen-sieu-xe-dep-mat-cho-may-tinh-1200-removebg-preview_xjnetk.png',
      alt: 'White Luxury Car'
    }
  ]

  // Auto-play slider
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev === heroImages.length - 1 ? 0 : prev + 1))
    }, 5000) // Change image every 5 seconds

    return () => clearInterval(interval)
  }, [heroImages.length])

  const handleSearch = (data) => {
    const params = new URLSearchParams()
    if (data.location) params.set('address', data.location)
    if (data.pickupDate) params.set('pickupDate', data.pickupDate)
    if (data.returnDate) params.set('returnDate', data.returnDate)
    if (data.pickupTime) params.set('pickupTime', data.pickupTime)
    if (data.returnTime) params.set('returnTime', data.returnTime)

    navigate(`/cars?${params.toString()}`)
  }

  return (
    <div className="home">
      <section className="hero-section">
        <div className="hero-background"></div>

        <div className="hero-container">
          <div className="hero-content">
            <div className="hero-badge">
              <span className="badge-icon" aria-hidden="true"><Award size={16} strokeWidth={2.2} /></span>
              Trải Nghiệm Lái Xe Cao Cấp
            </div>
            <h1>
              BẠN CẦN
              <br />
              <span className="accent-text">THUÊ XE</span>
            </h1>
            <p>Khám phá bộ sưu tập xe hơi cao cấp được thiết kế riêng cho phong cách sống của bạn. Trải nghiệm sự xa hoa, thoải mái và thẩm mỹ với dịch vụ cho thuê xe cao cấp của chúng tôi.</p>

            <div className="hero-features">
              <div className="feature-item">
                <span className="feature-icon" aria-hidden="true"><CarFront size={20} strokeWidth={2.2} /></span>
                <div className="feature-content">
                  <h4>Ô Tô Cao Cấp</h4>
                  <span>Các xe mới nhất</span>
                </div>
              </div>
              <div className="feature-item">
                <span className="feature-icon" aria-hidden="true"><ShieldCheck size={20} strokeWidth={2.2} /></span>
                <div className="feature-content">
                  <h4>Bảo Hiểm Đầy Đủ</h4>
                  <span>An tâm khi lái xe</span>
                </div>
              </div>
              <div className="feature-item">
                <span className="feature-icon" aria-hidden="true"><Headset size={20} strokeWidth={2.2} /></span>
                <div className="feature-content">
                  <h4>Hỗ Trợ 24/7</h4>
                  <span>Luôn sẵn sàng</span>
                </div>
              </div>
            </div>
          </div>

          <div className="hero-image">
            <div className="image-wrapper">
              <div className="hero-image-slider">
                <img
                  src={heroImages[currentImageIndex].url}
                  alt={heroImages[currentImageIndex].alt}
                  key={currentImageIndex}
                />
              </div>
              <div className="slider-dots">
                {heroImages.map((_, index) => (
                  <button
                    key={index}
                    className={` ${index === currentImageIndex ? 'active' : ''}`}
                    onClick={() => setCurrentImageIndex(index)}
                  ></button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="search-bar-wrapper">
          <SearchBar onSearch={handleSearch} />
        </div>
      </section>

      <FeaturedVehicles />
      <CallToAction />
      <Testimonials />
      <div className="home-newsletter">
        <Newsletter />
      </div>
    </div>
  )
}

export default Home
