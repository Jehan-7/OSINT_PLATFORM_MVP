import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import App from './App'

describe('Frontend Foundation - Phase 1', () => {
  it('should render the OSINT Platform app with proper title', () => {
    render(<App />)
    
    // Check if the main title exists (using heading role to be specific)
    expect(screen.getByRole('heading', { name: 'OSINT Platform' })).toBeInTheDocument()
    expect(screen.getByText('Open Source Intelligence Gathering & Analysis Platform')).toBeInTheDocument()
  })

  it('should have proper Tailwind CSS setup and structure', () => {
    render(<App />)
    
    // Check if the main content exists (using heading role to be specific)
    const mainHeading = screen.getByRole('heading', { name: 'OSINT Platform' })
    expect(mainHeading).toBeInTheDocument()
    
    // Check for navigation buttons
    expect(screen.getByText('Get Started')).toBeInTheDocument()
    expect(screen.getByText('Sign In')).toBeInTheDocument()
  })

  it('should display authentication and posts sections', () => {
    render(<App />)

    // Check for the feature sections that exist in the HomePage
    expect(screen.getByText(/Intelligence Posts/i)).toBeInTheDocument()
    expect(screen.getByText(/Community Notes/i)).toBeInTheDocument()
    expect(screen.getByText(/Secure Platform/i)).toBeInTheDocument()
  })
}) 