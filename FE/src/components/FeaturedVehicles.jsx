'use client';

import { useState, useEffect } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import VehicleCard from './VehicleCard'
import { getCarsList } from '../api/cars'
import '../styles/Home.css'
import '../styles/FeaturedVehiclesSlider.css'

function FeaturedVehicles() {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: 'start',
    slidesToScroll: 1,
  })
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [scrollSnaps, setScrollSnaps] = useState([])

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        setLoading(true)
        const data = await getCarsList()
        console.log("[v0] Fetched vehicles:", data)
        const featuredVehicles = (data || [])
          .filter(car => car.status === 'AVAILABLE')
          .slice(0, 8)
        setVehicles(featuredVehicles)
      } catch (err) {
        console.error('[v0] Error in FeaturedVehicles:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchVehicles()
  }, [])

  useEffect(() => {
    if (!emblaApi) return

    setScrollSnaps(emblaApi.scrollSnapList())

    const handleSelect = () => {
      setSelectedIndex(emblaApi.selectedScrollSnap())
    }

    handleSelect()
    emblaApi.on('select', handleSelect)
    emblaApi.on('reInit', handleSelect)
  }, [emblaApi])

  const scrollPrev = () => emblaApi && emblaApi.scrollPrev()
  const scrollNext = () => emblaApi && emblaApi.scrollNext()

  if (error) {
    return (
      <section className="featured-section">
        <div className="section-header">
          <h2>Featured Vehicles</h2>
          <p>Unable to load vehicles. Please try again later.</p>
        </div>
      </section>
    )
  }

  return (
    <section className="featured-section">
      <div className="section-header">
        <h2>Xe Nổi Bật</h2>
        <p>Khám phá bộ sưu tập xe cao cấp có sẵn cho cuộc phiêu lưu tiếp theo của bạn.</p>
      </div>

      {loading ? (
        <div className="loading-message">Đang tải xe...</div>
      ) : vehicles.length > 0 ? (
        <>
          <div className="slider-wrapper">
            <div className="embla" ref={emblaRef}>
              <div className="embla__container">
                {vehicles.map(vehicle => (
                  <div key={vehicle.id} className="embla__slide">
                    <VehicleCard vehicle={vehicle} />
                  </div>
                ))}
              </div>
            </div>

            <button className="slider-button slider-button--prev" onClick={scrollPrev} aria-label="Previous slide">
              <span>❮</span>
            </button>
            <button className="slider-button slider-button--next" onClick={scrollNext} aria-label="Next slide">
              <span>❯</span>
            </button>
          </div>

          <div className="slider-dots">
            {scrollSnaps.map((_, index) => (
              <button
                key={index}
                className={`${index === selectedIndex ? 'active' : ''}`}
                onClick={() => emblaApi && emblaApi.scrollTo(index)}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>

          <div className="explore-btn-container">
            <a href="/cars" className="explore-btn">
              Explore All Vehicles
            </a>
          </div>
        </>
      ) : (
        <div className="loading-message">No vehicles available</div>
      )}
    </section>
  )
}

export default FeaturedVehicles
