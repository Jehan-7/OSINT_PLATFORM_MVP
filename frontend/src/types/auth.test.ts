import { describe, it, expect } from 'vitest'
import type { 
  AuthSuccessResponse,
  RegistrationFormData,
  LoginFormData,
  User,
  AuthState 
} from './auth'

describe('Authentication Types', () => {
  it('should define AuthSuccessResponse with correct structure', () => {
    // This test validates the type structure matches backend exactly
    const mockResponse: AuthSuccessResponse = {
      success: true,
      message: 'Registration successful',
      user: {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        reputation: 0,
        created_at: '2024-01-01T00:00:00.000Z'
      },
      token: 'jwt.token.here'
    }

    expect(mockResponse.success).toBe(true)
    expect(mockResponse.user.id).toBe(1)
    expect(mockResponse.token).toBe('jwt.token.here')
  })

  it('should define RegistrationFormData correctly', () => {
    const formData: RegistrationFormData = {
      username: 'newuser',
      email: 'new@example.com',
      password: 'securepassword123'
    }

    expect(formData.username).toBe('newuser')
    expect(formData.email).toBe('new@example.com')
    expect(formData.password).toBe('securepassword123')
  })

  it('should define LoginFormData correctly', () => {
    const loginData: LoginFormData = {
      email: 'user@example.com',
      password: 'password123'
    }

    expect(loginData.email).toBe('user@example.com')
    expect(loginData.password).toBe('password123')
  })

  it('should define User interface correctly', () => {
    const user: User = {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      reputation: 100,
      created_at: '2024-01-01T00:00:00.000Z'
    }

    expect(user.id).toBe(1)
    expect(user.reputation).toBe(100)
  })

  it('should define AuthState with all required properties', () => {
    const authState: AuthState = {
      isAuthenticated: false,
      user: null,
      token: null,
      loading: false,
      error: null
    }

    expect(authState.isAuthenticated).toBe(false)
    expect(authState.user).toBeNull()
    expect(authState.loading).toBe(false)
  })
}) 