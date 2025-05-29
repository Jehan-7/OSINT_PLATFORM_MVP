import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import App from './App'

describe('Frontend Foundation - Phase 1', () => {
  it('should render the OSINT Platform app with proper title', () => {
    render(<App />)
    
    // Test for the main title
    expect(screen.getByText(/OSINT Platform/i)).toBeInTheDocument()
    expect(screen.getByText(/Intelligence Gathering & Analysis Platform/i)).toBeInTheDocument()
  })

  it('should have proper Tailwind CSS setup and structure', () => {
    render(<App />)
    
    // Check if the main app container exists
    const appElement = screen.getByTestId('app-container')
    expect(appElement).toBeInTheDocument()
    
    // Check for Sprint 3 content
    expect(screen.getByText(/Sprint 3: Frontend Foundation & User Authentication UI/i)).toBeInTheDocument()
  })

  it('should display authentication and posts sections', () => {
    render(<App />)
    
    // Check for the two main sections planned for Sprint 3
    expect(screen.getByText(/Authentication/i)).toBeInTheDocument()
    expect(screen.getByText(/Intelligence Posts/i)).toBeInTheDocument()
  })
}) 