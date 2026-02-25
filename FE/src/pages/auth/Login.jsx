import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { jwtDecode } from 'jwt-decode'
import { useAuth } from '../../hooks/useAuth'
import '../../styles/Auth.css'

function Login() {

  const navigate = useNavigate()

  const { login } = useAuth()


  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  })


  const [showPassword, setShowPassword] = useState(false)

  const [loading, setLoading] = useState(false)

  const [error, setError] = useState('')



  const handleChange = (e) => {

    const { name, value, type, checked } = e.target

    setFormData(prev => ({

      ...prev,

      [name]:
        type === 'checkbox'
          ? checked
          : value

    }))

  }



  const handleSubmit = async (e) => {

    e.preventDefault()

    setLoading(true)

    setError('')


    try {

      const result =
        await login(
          formData.email,
          formData.password
        )


      if (!result.success) {

        setError(result.error)

        return

      }


      const token =
        localStorage.getItem('token')


      if (token) {

        try {

          const decoded =
            jwtDecode(token)


          const scope =
            decoded?.scope || ''


          const roles =
            Array.isArray(scope)
              ? scope
              : scope.split(' ')



          if (
            roles.includes(
              'ROLE_ADMIN'
            )
          ) {

            navigate(
              '/admin/dashboard'
            )

            return

          }



          if (
            roles.includes(
              'ROLE_CAR_OWNER'
            )
          ) {

            navigate(
              '/owner/fleet'
            )

            return

          }


        }
        catch (decodeError) {

          console.error(
            'Decode token error:',
            decodeError
          )

        }

      }


      navigate('/')


    }
    catch (err) {

      setError(
        err.message
        || 'Login failed'
      )

    }
    finally {

      setLoading(false)

    }

  }



  return (

    <div className="auth-container">


      <div className="auth-background">

        <div className="auth-shape shape-1"></div>

        <div className="auth-shape shape-2"></div>

        <div className="auth-shape shape-3"></div>

      </div>



      <div className="auth-content">

        <div className="auth-card">


          <div className="auth-header">

            <div className="auth-logo">

              <img
                src="/favicon.svg"
                alt="Logo"
              />

            </div>


            <h1>
              Welcome Back
            </h1>


            <p>
              Sign in to continue
            </p>

          </div>



          <form
            className="auth-form"
            onSubmit={handleSubmit}
          >



            <div className="form-group">

              <label>Email</label>


              <div className="input-wrapper">

                <span>
                  ✉️
                </span>


                <input

                  type="email"

                  name="email"

                  value={formData.email}

                  onChange={handleChange}

                  placeholder="Email"

                  required

                />

              </div>

            </div>



            <div className="form-group">

              <label>Password</label>


              <div className="input-wrapper">

                <span>
                  🔒
                </span>


                <input

                  type={
                    showPassword
                      ? 'text'
                      : 'password'
                  }

                  name="password"

                  value={formData.password}

                  onChange={handleChange}

                  placeholder="Password"

                  required

                />


                <button
                  type="button"
                  className="toggle-password"
                  onClick={() =>
                    setShowPassword(
                      !showPassword
                    )
                  }
                >

                  {showPassword
                    ? '👁️'
                    : '👁️‍🗨️'}

                </button>


              </div>

            </div>



            <div className="form-options">

              <label>

                <input

                  type="checkbox"

                  name="rememberMe"

                  checked={
                    formData.rememberMe
                  }

                  onChange={handleChange}

                />

                Remember me

              </label>



              <Link to="/forgot-password">

                Forgot password?

              </Link>

            </div>



            <button
              type="submit"
              className="btn-submit"
              disabled={loading}
            >

              {loading
                ? 'Signing In...'
                : 'Sign In'}

            </button>



            {error && (

              <div
                className="error-message"
              >

                {error}

              </div>

            )}

          </form>



          <div className="auth-footer">

            <p>

              Chưa có tài khoản?

              <Link to="/register">

                Đăng ký

              </Link>

            </p>

          </div>


        </div>

      </div>

    </div>

  )

}

export default Login